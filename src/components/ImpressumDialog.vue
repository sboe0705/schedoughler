<template>
  <dialog ref="dialogEl" class="impressum-dialog" @close="$emit('close')" @click="onBackdropClick">
    <div class="impressum-content">
      <div class="impressum-head">
        <h2>Impressum</h2>
        <button class="close-btn" title="Schließen" @click="close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="impressum-body">
        <p>Angaben gemäß § 5 DDG:</p>
        <p class="address">
          Sebastian Böhm<br>
          Karlsruher Straße 26<br>
          70771 Echterdingen<br>
          Deutschland
        </p>
        <p>Kontakt: sboe0705@icloud.com</p>

        <h3>Haftung für Inhalte</h3>
        <p>
          Dies ist ein privates, nicht-kommerzielles Hobbyprojekt.
          Für externe Links wird keine Haftung übernommen; zum
          Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.
        </p>

        <h3>Datenschutz</h3>
        <p>
          Diese Website speichert selbst keine personenbezogenen Daten,
          verwendet keine Cookies und bindet keine Tracker ein.
        </p>
        <p>
          Die Seite wird über GitHub Pages (GitHub Inc., USA) gehostet.
          GitHub erfasst beim Aufruf technisch bedingt Server-Logs
          (u.a. IP-Adresse) zur Sicherstellung des Betriebs. Details:
          <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">
            docs.github.com/.../github-privacy-statement
          </a>
        </p>

        <h3>Rezeptquellen</h3>
        <p>
          Die Zeitpläne basieren auf Rezepten Dritter. Die jeweilige
          Quelle ist beim Rezept verlinkt. Alle Texte wurden eigenständig
          formuliert und strukturiert.
        </p>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})
defineEmits(['close'])

const dialogEl = ref(null)

watch(() => props.open, (isOpen) => {
  const el = dialogEl.value
  if (!el) return
  if (isOpen && !el.open) el.showModal()
  if (!isOpen && el.open) el.close()
})

function close() {
  dialogEl.value?.close()
}

function onBackdropClick(e) {
  if (e.target === dialogEl.value) close()
}
</script>

<style scoped>
.impressum-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(420px, calc(100vw - 32px));
  max-height: min(80vh, 640px);
  padding: 0;
  border: 1.5px solid var(--color-card-border);
  border-radius: 16px;
  background: var(--color-card);
  color: var(--color-ink);
}

.impressum-dialog::backdrop {
  background: rgba(46, 34, 24, 0.45);
}

.impressum-content {
  display: flex;
  flex-direction: column;
  max-height: min(80vh, 640px);
}

.impressum-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-card-border);
}

.impressum-head h2 {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 800;
  color: var(--color-ink);
}

.close-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid var(--color-card-border);
  background: var(--color-bg);
  color: var(--color-brown);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-btn:hover {
  background: var(--color-brown);
  color: var(--color-card);
}

.impressum-body {
  overflow-y: auto;
  padding: 16px 18px 20px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-ink-soft);
}

.impressum-body p {
  margin-bottom: 12px;
}

.impressum-body .address {
  color: var(--color-ink);
}

.impressum-body h3 {
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 6px;
}

.impressum-body a {
  color: var(--color-brown);
  word-break: break-word;
}
</style>
