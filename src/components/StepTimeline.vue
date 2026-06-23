<template>
  <section class="timeline">
    <div class="section-label">ABLAUF</div>

    <div class="steps">
      <StepRow
        v-for="(step, i) in schedule.steps"
        :key="i"
        :step="step"
        :override="overrides[i] ?? null"
        :step-index="i"
        :is-last="i === schedule.steps.length - 1"
        @nudge="(dir) => $emit('nudge', i, dir)"
      />

      <!-- Finish row -->
      <div class="finish-row">
        <div class="time-col">
          <span class="finish-time">{{ formatTime(schedule.finishAt) }}</span>
          <span class="finish-day">{{ formatDayLabel(schedule.finishAt) }}</span>
        </div>
        <div class="rail rail-end">
          <div class="rail-dot-finish" />
        </div>
        <div class="finish-label">
          <span class="finish-text">Brot fertig</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      Zeiten rückwärts berechnet · Raumtemperatur ~22 °C
    </div>
  </section>
</template>

<script setup>
import { formatTime, formatDayLabel } from '../utils.js'
import StepRow from './StepRow.vue'

defineProps({
  schedule: Object,
  overrides: Object,
  recipe: Object,
})
defineEmits(['nudge'])
</script>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-tan);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.steps {
  display: flex;
  flex-direction: column;
}

.finish-row {
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
  padding-top: 2px;
  gap: 2px;
}

.finish-time {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 800;
  color: var(--color-bake);
  line-height: 1;
}

.finish-day {
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
  padding-top: 2px;
}

.rail-end::before {
  content: '';
  position: absolute;
  top: 0;
  height: 19px; /* reach dot centre: padding-top(2) + margin-top(10) + radius(7) */
  width: 2px;
  background: var(--color-rail);
}

.rail-dot-finish {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-bake);
  box-shadow: 0 0 0 4px #F4EBDD, 0 0 0 5px #B5532A55;
  position: relative;
  z-index: 1;
  margin-top: 10px;
}

.finish-label {
  flex: 1;
  display: flex;
  align-items: center;
  padding-top: 12px;
}

.finish-text {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 800;
  color: var(--color-bake);
}

.footer-note {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-faint);
  text-align: center;
  padding-top: 8px;
}
</style>
