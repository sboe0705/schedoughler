import { reactive } from 'vue'
import {
  buildSyncPayload, parseSyncPayload, mergeSyncState,
  readSyncMeta, writeSyncMeta, clearSyncMeta, emptySyncMeta,
  tokenValid, decideSync, conflictWinner,
} from './scheduler.js'
import { DriveAuthError, createDriveClient } from './drive.js'

// Optional sync of saved bakes and starred recipes through the user's own
// Google Drive. The decisions are pure functions in scheduler.js, the requests
// live in drive.js; this module wires them to Google Identity Services, the
// page's triggers and a reactive status for the UI.
//
// App.vue owns the state and hands in two callbacks: `getState()` returns
// { saved, starred }, `applyState(state)` replaces both (and persists them).
// Unlike a file import, a download needs no reload — the two maps are plain
// refs with nothing that hydrates from storage.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const SCOPES = `${DRIVE_SCOPE} openid email`

/** Edits are bundled — starring a few recipes in a row is one upload. */
const UPLOAD_DELAY_MS = 3_000

const SIGN_IN_ERRORS = {
  popup_failed_to_open: 'Das Anmeldefenster wurde blockiert – bitte noch einmal tippen.',
  scope_denied: 'Ohne Zugriff auf den App-Ordner in Google Drive ist kein Abgleich möglich.',
  // Closing the popup is a decision, not an error.
  popup_closed: '',
}

// ---------------------------------------------------------------------------
// Google Identity Services
// ---------------------------------------------------------------------------

let gis = null

/**
 * Inject the GIS script once. Only ever called for a user who signs in or is
 * already connected — nobody else causes a request to Google.
 */
function loadGis() {
  gis ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      gis = null
      script.remove()
      reject(new Error('gis: load failed'))
    }
    document.head.append(script)
  })
  return gis
}

/** Opens Google's popup — must run close to a tap, or the browser blocks it. */
async function requestToken(hint) {
  await loadGis()
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: response => {
        if (response.error) reject(new Error(response.error))
        else if (!window.google.accounts.oauth2.hasGrantedAllScopes(response, DRIVE_SCOPE)) {
          reject(new Error('scope_denied'))
        } else resolve(response)
      },
      error_callback: error => reject(new Error(error.type)),
    })
    client.requestAccessToken({ prompt: '', login_hint: hint })
  })
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

/**
 * @param {{ getState: () => { saved, starred }, applyState: (state) => void }} io
 * @returns a reactive object: enabled, status, error, email, lastSyncedAt and
 *   the actions start, signIn, signOut, markDirty.
 *
 * status: 'off' | 'connecting' | 'syncing' | 'ok' | 'offline' | 'expired' | 'error'
 */
export function useSync({ getState, applyState }) {
  // The GIS popup cannot work inside the Tauri webview (its origin is not one
  // an OAuth client can list), so the desktop build never offers it.
  const enabled = CLIENT_ID !== '' && !window.__TAURI_INTERNALS__

  const state = reactive({
    enabled,
    meta: enabled ? readSyncMeta(localStorage) : null,
    status: 'off',
    error: '',
    get email() { return this.meta?.email ?? null },
    get lastSyncedAt() { return this.meta?.lastSyncedAt ?? null },
    start, signIn, signOut, markDirty,
  })

  function save(next) {
    state.meta = next
    if (next) writeSyncMeta(localStorage, next)
    else clearSyncMeta(localStorage)
  }

  function patch(changes) {
    if (state.meta) save({ ...state.meta, ...changes })
  }

  // --- the sync run ---

  /** Bumped on every local edit, so an upload knows whether it caught all of them. */
  let edits = 0
  let running = null
  let again = false

  /**
   * Run one reconcile, or queue another behind the one in flight. Never runs
   * two at once: both would list the same version and upload twice.
   */
  function sync(options = {}) {
    if (running) {
      again = true
      return running
    }
    running = (async () => {
      do {
        again = false
        await reconcile(options)
      } while (again && state.status === 'ok')
    })().finally(() => { running = null })
    return running
  }

  async function reconcile({ keepalive = false } = {}) {
    const current = state.meta
    if (!current) return
    if (!tokenValid(current)) {
      state.status = 'expired'
      return
    }

    const drive = createDriveClient(current.token, { keepalive })
    state.status = 'syncing'
    state.error = ''

    try {
      const remote = await drive.find()
      let action = decideSync(current, remote)
      let parsed = null

      if (action === 'conflict' || action === 'merge' || action === 'download') {
        parsed = parseSyncPayload(await drive.download(remote.id))
        if (!parsed.ok) {
          // An unreadable remote file is replaced only by a deliberate local
          // edit; never downloaded, never merged.
          if (action === 'download') {
            state.status = 'error'
            state.error = 'Der Stand in Google Drive ist unlesbar und wurde nicht übernommen.'
            return
          }
          action = 'upload'
        }
      }

      if (action === 'conflict') {
        action = conflictWinner(current.lastEditAt, parsed.payload.exportedAt) === 'remote'
          ? 'download'
          : 'upload'
      }

      if (action === 'merge') {
        applyState(mergeSyncState(getState(), parsed.payload))
        await upload(drive, remote)
      } else if (action === 'upload') {
        await upload(drive, remote)
      } else if (action === 'download') {
        download(remote, parsed.payload)
      } else {
        patch({ lastSyncedAt: new Date().toISOString() })
      }

      if (state.status === 'syncing') state.status = 'ok'
    } catch (e) {
      if (e instanceof DriveAuthError) {
        patch({ token: null, tokenExpiresAt: null })
        state.status = 'expired'
      } else {
        // Network or Drive hiccup: `dirty` stays set and the next trigger retries.
        state.status = 'offline'
      }
    }
  }

  async function upload(drive, remote) {
    const seen = edits
    const body = JSON.stringify(buildSyncPayload(getState()), null, 2)
    const file = remote ? await drive.update(remote.id, body) : await drive.create(body)
    // An edit that landed while the request was in flight is not in `body`.
    const caughtUp = seen === edits
    patch({
      baseVersion: file.version,
      dirty: !caughtUp,
      lastEditAt: caughtUp ? null : (state.meta?.lastEditAt ?? null),
      lastSyncedAt: new Date().toISOString(),
    })
    if (!caughtUp) again = true
  }

  function download(remote, payload) {
    applyState({ saved: payload.saved, starred: payload.starred })
    patch({
      baseVersion: remote.version,
      dirty: false,
      lastEditAt: null,
      lastSyncedAt: new Date().toISOString(),
    })
  }

  // --- edits ---

  let timer

  /**
   * Record a local edit and schedule the upload. App.vue calls it for taps on
   * a bookmark or star and for edits of a saved plan — never for the pruning
   * of expired bakes, which every device derives from the clock on its own.
   */
  function markDirty() {
    if (!state.meta) return
    edits++
    patch({ dirty: true, lastEditAt: new Date().toISOString() })
    if (state.status === 'expired') return
    clearTimeout(timer)
    timer = setTimeout(() => void sync(), UPLOAD_DELAY_MS)
  }

  let watching = false

  function watch() {
    if (watching) return
    watching = true
    document.addEventListener('visibilitychange', () => {
      if (!state.meta) return
      if (document.visibilityState === 'hidden') {
        if (state.meta.dirty) {
          clearTimeout(timer)
          void sync({ keepalive: true })
        }
      } else void sync()
    })
    window.addEventListener('online', () => {
      if (state.meta) void sync()
    })
  }

  // --- actions ---

  /** App start: a no-op unless sync is configured and an account is connected. */
  async function start() {
    if (!enabled) return
    watch()
    if (!state.meta) return
    // Already consented — load GIS now so "Fortsetzen" opens its popup instantly.
    void loadGis().catch(() => undefined)
    await sync()
  }

  /** Sign in, or renew an expired token — both need a tap for Google's popup. */
  async function signIn() {
    if (!enabled) return
    const before = state.status
    state.status = 'connecting'
    state.error = ''

    let response
    try {
      response = await requestToken(state.meta?.email)
    } catch (e) {
      state.status = state.meta ? before : 'off'
      state.error = SIGN_IN_ERRORS[e?.message] ?? 'Die Anmeldung bei Google ist fehlgeschlagen.'
      return
    }

    const token = response.access_token
    const tokenExpiresAt = new Date(Date.now() + response.expires_in * 1000).toISOString()
    try {
      const address = await createDriveClient(token).fetchEmail()
      // Another account means another Drive — start over and merge again.
      const base = state.meta?.email === address ? state.meta : emptySyncMeta(address)
      save({ ...base, token, tokenExpiresAt })
    } catch (e) {
      state.status = state.meta ? 'offline' : 'off'
      state.error = 'Google ist gerade nicht erreichbar.'
      return
    }

    watch()
    await sync()
  }

  /** Disconnect. Local data and the Drive file both stay where they are. */
  function signOut() {
    const token = state.meta?.token
    if (token && window.google?.accounts) window.google.accounts.oauth2.revoke(token)
    clearTimeout(timer)
    save(null)
    state.status = 'off'
    state.error = ''
  }

  return state
}
