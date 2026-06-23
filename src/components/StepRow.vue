<template>
  <div class="step-row">
    <!-- Time column -->
    <div class="time-col">
      <span class="step-time" :style="{ color: kindColor }">{{ formatTime(step.start) }}</span>
      <span class="step-day">{{ formatDayLabel(step.start) }}</span>
    </div>

    <!-- Rail -->
    <div class="rail">
      <div class="rail-line" :class="{ 'rail-line-first': stepIndex === 0 }" />
      <div
        class="rail-dot"
        :style="{
          background: kindColor,
          boxShadow: `0 0 0 4px #F4EBDD, 0 0 0 5px ${kindColor}55`,
        }"
      />
    </div>

    <!-- Card -->
    <div class="card" :class="{ overnight: step.sleep }">
      <div v-if="step.sleep" class="night-pill">
        <span class="night-moon" />
        über Nacht
      </div>

      <div class="card-body">
        <div class="step-title">{{ step.title }}</div>
        <div class="step-desc">{{ step.desc }}</div>
        <div class="meta-row">
          <span class="kind-pill" :style="{ background: kindColor + '22', color: kindColor }">
            {{ KINDS[step.kind].label }}
          </span>
          <span class="duration-label">{{ durationLabel(step.dur) }}</span>
        </div>
        <NudgeControls
          v-if="step.min != null"
          :step="step"
          :override="override"
          @nudge="$emit('nudge', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { KINDS, durationLabel } from '../scheduler.js'
import { formatTime, formatDayLabel } from '../utils.js'
import NudgeControls from './NudgeControls.vue'

const props = defineProps({
  step: Object,
  override: { type: Number, default: null },
  stepIndex: Number,
})
defineEmits(['nudge'])

const kindColor = computed(() => KINDS[props.step.kind]?.color ?? '#999')
</script>

<style scoped>
.step-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.time-col {
  width: 60px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-top: 4px;
  gap: 2px;
}

.step-time {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.step-day {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-tan);
  text-align: right;
}

.rail {
  width: 28px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-top: 4px;
  align-self: stretch;
}

.rail-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-rail);
}

/* First row: start line at dot centre (padding-top 4px + radius 8px) */
.rail-line-first {
  top: 12px;
}

.rail-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.card {
  flex: 1;
  min-width: 0;
  background: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: 16px;
  padding: 13px 15px;
  position: relative;
  margin-bottom: 12px;
}

.card.overnight {
  background: var(--color-night-bg);
  border-color: var(--color-night-border);
}

.night-pill {
  position: absolute;
  top: 10px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--color-night-pill);
  color: var(--color-night-pill-text);
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}

.night-moon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  box-shadow: inset -3px -1px 0 0 var(--color-night-pill-text);
  flex-shrink: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-title {
  font-family: var(--font-serif);
  font-size: 15.5px;
  font-weight: 700;
  color: var(--color-ink);
  padding-right: 60px;
}

.card:not(.overnight) .step-title { padding-right: 0; }

.step-desc {
  font-size: 12.5px;
  color: #6E6253;
  line-height: 1.45;
  margin-top: 2px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.kind-pill {
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.duration-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-muted);
}
</style>
