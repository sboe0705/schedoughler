<template>
  <div class="scheduler-header">
    <div class="header-row">
      <button class="back-btn" title="Zur Rezeptauswahl" @click="$emit('back')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <div class="recipe-info">
        <div class="recipe-name">{{ recipe.name }}</div>
        <div class="recipe-subtitle">{{ recipe.subtitle }}</div>
      </div>

      <div class="header-actions">
        <a
          v-if="recipe.source?.url"
          :href="recipe.source.url"
          target="_blank"
          rel="noopener noreferrer"
          class="source-link"
          :title="recipe.source.title"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>

        <button
          class="save-btn"
          :class="{ saved }"
          :title="saved ? 'Gespeicherte Backzeit entfernen' : 'Backzeit speichern'"
          @click="$emit('toggle-save')"
        >
          <svg v-if="saved" width="14" height="14" viewBox="0 0 24 24" fill="#FBF5EA">
            <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  recipe: Object,
  saved: { type: Boolean, default: false },
})
defineEmits(['back', 'toggle-save'])
</script>

<style scoped>
.scheduler-header {
  padding-top: 8px;
  margin-bottom: 16px;
}

.header-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.back-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--color-card);
  border: 1px solid #E0CBA8;
  color: var(--color-brown);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .15s, color .15s;
}

.back-btn:hover {
  background: var(--color-brown);
  color: var(--color-card);
}

.recipe-info {
  flex: 1;
  min-width: 0;
}

.recipe-name {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 800;
  color: var(--color-ink);
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.recipe-subtitle {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--color-muted);
  margin-top: 3px;
}

.header-actions {
  flex-shrink: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.source-link {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: var(--color-card);
  border: 1px solid #E0CBA8;
  color: var(--color-brown);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background .15s, color .15s, border-color .15s;
}

.source-link:hover {
  background: var(--color-brown);
  border-color: var(--color-brown);
  color: var(--color-card);
}

.save-btn {
  margin-top: auto;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #F4EBDD;
  border: 1px solid #E0CBA8;
  color: #B6A485;
  transition: color .15s, border-color .15s, background .15s;
}

.save-btn:hover {
  color: var(--color-bake);
  border-color: var(--color-bake);
}

.save-btn.saved {
  background: var(--color-bake);
  border: none;
  color: var(--color-card);
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}
</style>
