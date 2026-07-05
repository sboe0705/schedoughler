<template>
  <div class="scheduler-header">
    <button class="back-btn" title="Zur Rezeptauswahl" @click="$emit('back')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>

    <div class="recipe-info">
      <div class="recipe-name">{{ recipe.name }}</div>
      <div class="recipe-subtitle">{{ recipe.subtitle }}</div>
    </div>

    <a
      v-if="recipe.source?.url"
      :href="recipe.source.url"
      target="_blank"
      rel="noopener noreferrer"
      class="source-link"
      :title="recipe.source.title"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  </div>
</template>

<script setup>
defineProps({ recipe: Object })
defineEmits(['back'])
</script>

<style scoped>
.scheduler-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0 16px;
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

.source-link {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--color-card);
  border: 1px solid #E7D6BB;
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
</style>
