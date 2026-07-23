<template>
  <div class="row" :class="{ saved }" @click="$emit('select')">
    <div class="row-main">
      <div class="row-name">{{ recipe.name }}</div>
      <div v-if="saved" class="row-meta">
        <span v-if="nextStepLabel" class="row-total next-step" :title="`Nächster Schritt: ${nextStepLabel}`">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
          {{ nextStepLabel }}
        </span>
        <span class="finish-pill" :title="`Fertig: ${savedLabel}`">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12l5 5L20 6"/>
          </svg>
          {{ savedLabel }}
        </span>
      </div>
      <template v-else>
        <div class="row-subtitle">{{ recipe.subtitle }}</div>
        <div class="row-total">{{ recipe.totalShort }}<span v-if="idealFinishLabel" class="row-ideal"><span class="ideal-star" :title="`Empfohlene Fertigstellungszeit: ${idealFinishLabel}`"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg></span> {{ idealFinishLabel }}</span></div>
      </template>
    </div>

    <button
      class="star-btn"
      :class="{ starred }"
      :title="starred ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'"
      @click.stop="$emit('toggle-star')"
    >
      <svg v-if="starred" width="14" height="14" viewBox="0 0 24 24" fill="#FBF5EA">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
      </svg>
    </button>

    <button
      class="bookmark-btn"
      :class="{ saved }"
      :title="saved ? 'Gespeicherte Backzeit entfernen' : 'Backzeit speichern'"
      @click.stop="$emit('toggle-save')"
    >
      <svg v-if="saved" width="14" height="14" viewBox="0 0 24 24" fill="#FBF5EA">
        <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"/>
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  recipe: Object,
  saved: { type: Boolean, default: false },
  savedLabel: { type: String, default: '' },
  nextStepLabel: { type: String, default: '' },
  starred: { type: Boolean, default: false },
})
defineEmits(['select', 'toggle-save', 'toggle-star'])

const idealFinishLabel = computed(() => {
  const f = props.recipe.idealFinish
  if (!f) return ''
  return `${String(f.hour).padStart(2, '0')}:${String(f.minute).padStart(2, '0')}`
})
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 15px;
  border-radius: 16px;
  background: var(--color-card);
  border: 1.5px solid #E5D5BB;
  cursor: pointer;
  transition: border-color .15s;
}

.row:hover {
  border-color: var(--color-brown);
}

.row.saved {
  border-color: #D9BE93;
  box-shadow: 0 1px 0 #fff inset;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-family: var(--font-serif);
  font-size: 15.5px;
  font-weight: 700;
  color: var(--color-ink);
}

.row-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-muted);
  line-height: 1.35;
  margin-top: 3px;
}

.row-total {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-tan);
  margin-top: 5px;
}

.next-step {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.row-meta .row-total {
  margin-top: 0;
}

.row-ideal {
  color: var(--color-muted);
  font-weight: 500;
  margin-left: 4px;
}

.ideal-star {
  display: inline-flex;
  vertical-align: -1px;
}

.finish-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-bake);
  color: var(--color-card);
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.bookmark-btn {
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
  transition: color .15s, border-color .15s;
}

.bookmark-btn:hover {
  color: var(--color-bake);
  border-color: var(--color-bake);
}

.bookmark-btn.saved {
  background: var(--color-bake);
  border: none;
  color: var(--color-card);
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}

.star-btn {
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
  transition: color .15s, border-color .15s;
}

.star-btn:hover {
  color: var(--color-prep);
  border-color: var(--color-prep);
}

.star-btn.starred {
  background: var(--color-prep);
  border: none;
  color: var(--color-card);
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}
</style>
