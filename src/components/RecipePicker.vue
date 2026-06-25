<template>
  <div class="picker">
    <button
      v-for="r in recipes"
      :key="r.id"
      class="chip"
      :class="{ selected: r.id === modelValue }"
      @pointerdown="startLongPress(r, $event)"
      @pointerup="cancelLongPress"
      @pointermove="onPointerMove"
      @pointercancel="cancelLongPress"
      @contextmenu.prevent
      @click="onChipClick(r.id)"
    >
      <span class="chip-name">{{ r.name }}</span>
      <span class="chip-meta">{{ r.totalShort }}</span>
      <span
        v-if="savedBakes[r.id]"
        class="saved-badge"
        title="Gespeicherte Backzeit – lange drücken zum Entfernen"
        aria-hidden="true"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#FBF5EA">
          <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"/>
        </svg>
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  recipes: Array,
  modelValue: String,
  savedBakes: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'long-press'])

const LONG_PRESS_MS = 550
const MOVE_THRESHOLD_PX = 8

let timer = null
let longPressActive = false
let startX = 0
let startY = 0

function startLongPress(recipe, event) {
  cancelLongPress()
  longPressActive = false
  startX = event.clientX
  startY = event.clientY
  timer = setTimeout(() => {
    longPressActive = true
    timer = null
    emit('long-press', recipe)
  }, LONG_PRESS_MS)
}

function onPointerMove(event) {
  if (!timer) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD_PX) {
    cancelLongPress()
  }
}

function cancelLongPress() {
  if (timer) { clearTimeout(timer); timer = null }
}

function onChipClick(id) {
  if (longPressActive) { longPressActive = false; return }
  emit('update:modelValue', id)
}
</script>

<style scoped>
.picker {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.picker::-webkit-scrollbar { display: none; }

.chip {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 120px;
  padding: 13px 15px;
  border-radius: 16px;
  border: 1.5px solid #E5D5BB;
  background: var(--color-card);
  cursor: pointer;
  text-align: left;
  transition: all .15s;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-x;
}

.chip.selected {
  background: var(--color-brown);
  border-color: var(--color-brown);
}

.chip-name {
  font-family: var(--font-serif);
  font-size: 14.5px;
  font-weight: 700;
  color: var(--color-ink);
  transition: color .15s;
}
.chip.selected .chip-name { color: var(--color-card); }

.chip-meta {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-tan);
  transition: color .15s;
}
.chip.selected .chip-meta { color: #E7C9A0; }

.saved-badge {
  position: absolute;
  bottom: 7px;
  right: 7px;
  width: 20px;
  height: 20px;
  border-radius: 7px;
  background: #B5532A;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
</style>
