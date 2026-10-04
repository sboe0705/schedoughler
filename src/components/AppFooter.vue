<template>
  <footer class="app-footer">
    <span class="footer-version">v{{ commit }} · {{ commitDate }}</span>
    <span class="footer-sep">·</span>
    <button class="footer-link" @click="showImpressum = true">Impressum</button>
    <template v-if="sync?.status === 'expired'">
      <span class="footer-sep">·</span>
      <button class="footer-link footer-sync" @click="sync.signIn()">Sync fortsetzen</button>
    </template>
  </footer>

  <ImpressumDialog
    :open="showImpressum"
    :sync-enabled="!!sync?.enabled"
    @close="showImpressum = false"
  />
</template>

<script setup>
import { ref } from 'vue'
import ImpressumDialog from './ImpressumDialog.vue'

// An expired Google token pauses the sync, and renewing it needs a tap for
// Google's popup — "Sync fortsetzen" is that tap, visible from both views.
defineProps({
  sync: { type: Object, default: null },
})

const commit = __APP_COMMIT__
const commitDate = __APP_COMMIT_DATE__

const showImpressum = ref(false)
</script>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 0 2px;
  font-size: 11px;
  color: var(--color-tan);
}

.footer-sep {
  color: var(--color-faint);
}

.footer-link {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--color-muted);
  text-decoration: underline;
  cursor: pointer;
}

.footer-link:hover {
  color: var(--color-brown);
}

.footer-sync {
  color: var(--color-bake);
}
</style>
