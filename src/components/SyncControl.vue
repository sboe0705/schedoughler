<template>
  <div v-if="sync.enabled" ref="root" class="sync">
    <button
      v-if="!sync.email"
      class="sync-pill"
      :aria-disabled="sync.status === 'connecting'"
      @click="sync.status !== 'connecting' && sync.signIn()"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17.5 19H7a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 11a4 4 0 0 1-1.5 8z"/>
      </svg>
      {{ sync.status === 'connecting' ? 'Anmeldung …' : 'Anmelden' }}
    </button>

    <button
      v-else
      class="sync-pill"
      :class="{ alert: needsAttention }"
      :aria-expanded="open"
      :title="`Angemeldet als ${sync.email}`"
      @click="open = !open"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17.5 19H7a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 11a4 4 0 0 1-1.5 8z"/>
        <path v-if="!needsAttention" d="M9 14l2 2 4-4"/>
        <path v-else d="M12 11v3M12 16.5v.01"/>
      </svg>
      Sync
    </button>

    <div v-if="open && sync.email" class="sync-panel">
      <p class="sync-account">Angemeldet als <strong>{{ sync.email }}</strong></p>
      <p v-if="statusLine" class="sync-note">{{ statusLine }}</p>
      <p class="sync-note">Abgeglichen werden gespeicherte Backzeiten und Favoriten.</p>
      <div class="sync-actions">
        <template v-if="sync.status === 'expired'">
          <button class="sync-action" @click="sync.signIn()">Fortsetzen</button>
          <span class="sync-dot">·</span>
        </template>
        <button class="sync-action" @click="onSignOut">Abmelden</button>
      </div>
    </div>

    <p v-if="sync.error" class="sync-error">{{ sync.error }}</p>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'

// Sign-in with Google for the optional Drive sync — a pill in the header of
// the recipe list, with a small panel for status and sign-out once connected.
// Renders nothing unless the build has a Google client id (see useSync.js).

const props = defineProps({
  sync: { type: Object, required: true },
})

const open = ref(false)
const root = ref(null)

// The panel floats over the list, so a tap anywhere else closes it.
function onOutside(event) {
  if (!root.value?.contains(event.target)) open.value = false
}
watch(open, isOpen => {
  if (isOpen) document.addEventListener('pointerdown', onOutside)
  else document.removeEventListener('pointerdown', onOutside)
})
onUnmounted(() => document.removeEventListener('pointerdown', onOutside))

const needsAttention = computed(() =>
  ['expired', 'offline', 'error'].includes(props.sync.status)
)

const statusLine = computed(() => {
  switch (props.sync.status) {
    case 'connecting': return 'Anmeldung läuft …'
    case 'syncing': return 'Wird abgeglichen …'
    case 'offline': return 'Keine Verbindung – Änderungen werden nachgeholt.'
    case 'expired': return 'Anmeldung abgelaufen – der Abgleich ruht.'
    default:
      return props.sync.lastSyncedAt
        ? `Zuletzt abgeglichen: ${new Date(props.sync.lastSyncedAt).toLocaleString('de-DE', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}`
        : ''
  }
})

function onSignOut() {
  props.sync.signOut()
  open.value = false
}
</script>

<style scoped>
.sync {
  position: relative;
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.sync-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border: 1.5px solid #E5D5BB;
  border-radius: 999px;
  background: var(--color-card);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-muted);
  cursor: pointer;
}

.sync-pill:hover {
  color: var(--color-brown);
}

.sync-pill.alert {
  color: var(--color-bake);
  border-color: var(--color-bake);
}

.sync-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 10;
  width: 250px;
  padding: 12px 14px;
  border: 1.5px solid var(--color-card-border);
  border-radius: 14px;
  background: var(--color-card);
  box-shadow: 0 6px 18px rgba(46, 34, 24, 0.12);
  font-size: 12px;
  line-height: 1.45;
  color: var(--color-ink-soft);
}

.sync-panel p {
  margin-bottom: 6px;
}

.sync-account strong {
  color: var(--color-ink);
  word-break: break-all;
}

.sync-note {
  color: var(--color-muted);
}

.sync-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.sync-action {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-weight: 700;
  color: var(--color-brown);
  text-decoration: underline;
  cursor: pointer;
}

.sync-dot {
  color: var(--color-faint);
}

.sync-error {
  margin-top: 6px;
  max-width: 220px;
  font-size: 11px;
  line-height: 1.4;
  text-align: right;
  color: var(--color-bake);
}
</style>
