<template>
  <div class="nudge-wrap">
    <div class="nudge-divider" />
    <div class="nudge-header">
      <span class="nudge-label">GÄRZEIT ANPASSEN</span>
      <span class="nudge-range">{{ rangeLabel(step) }}</span>
    </div>
    <div class="nudge-buttons">
      <button
        class="nudge-btn"
        :disabled="isAtMax"
        @click="$emit('nudge', +1)"
      >‹ früher beginnen</button>
      <button
        class="nudge-btn"
        :disabled="isAtMin"
        @click="$emit('nudge', -1)"
      >später ›</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { rangeLabel, effectiveDuration } from '../scheduler.js'

const props = defineProps({ step: Object, override: [Number, null] })
defineEmits(['nudge'])

const current = computed(() => effectiveDuration(props.step, props.override ?? null))
const isAtMax = computed(() => current.value >= props.step.max)
const isAtMin = computed(() => current.value <= props.step.min)
</script>

<style scoped>
.nudge-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.nudge-divider {
  border-top: 1px dashed #E7D6BB;
}

.nudge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nudge-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #B6A485;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.nudge-range {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-tan);
}

.nudge-buttons {
  display: flex;
  gap: 8px;
}

.nudge-btn {
  padding: 9px 13px;
  border-radius: 11px;
  border: 1px solid #E0CBA8;
  background: #F4EBDD;
  color: var(--color-brown);
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .15s;
}

.nudge-btn:disabled {
  opacity: .3;
  pointer-events: none;
}
</style>
