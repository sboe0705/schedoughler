<template>
  <div class="setup-card">
    <div class="field-group">
      <div class="field-label">BROT FERTIG AM</div>
      <div class="inputs-row">
        <input
          class="date-input"
          type="date"
          :value="dateValue"
          @change="onDateChange"
        />
        <input
          class="time-input"
          type="time"
          :value="timeValue"
          @change="onTimeChange"
        />
      </div>
    </div>

    <div class="start-banner">
      <div class="banner-left">
        <span class="banner-label">JETZT LOSLEGEN</span>
        <span class="banner-start">{{ startDayLabel }}</span>
        <span class="banner-time">{{ startTimeLabel }}</span>
      </div>
      <div class="banner-right">
        <span class="banner-total-label">Gesamt</span>
        <span class="banner-total">{{ totalLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { durationLabel } from '../scheduler.js'
import { formatDateInput, formatTimeInput, formatTime, formatDayLabel } from '../utils.js'

const props = defineProps({
  finishAt: Date,
  schedule: Object,
})
const emit = defineEmits(['update:finishAt'])

const dateValue = computed(() => formatDateInput(props.finishAt))
const timeValue = computed(() => formatTimeInput(props.finishAt))
const startTimeLabel = computed(() => formatTime(props.schedule.startAt))
const startDayLabel = computed(() => formatDayLabel(props.schedule.startAt))
const totalLabel = computed(() => durationLabel(props.schedule.totalMinutes))

function onDateChange(e) {
  const [y, m, d] = e.target.value.split('-').map(Number)
  const next = new Date(props.finishAt)
  next.setFullYear(y, m - 1, d)
  emit('update:finishAt', next)
}

function onTimeChange(e) {
  const [h, m] = e.target.value.split(':').map(Number)
  const next = new Date(props.finishAt)
  next.setHours(h, m, 0, 0)
  emit('update:finishAt', next)
}
</script>

<style scoped>
.setup-card {
  background: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-tan);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.inputs-row {
  display: flex;
  gap: 10px;
}

.date-input {
  flex: 1;
}

.time-input {
  width: 108px;
  flex-shrink: 0;
}

.date-input,
.time-input {
  background: #F4EBDD;
  border: 1px solid #E5D5BB;
  border-radius: 12px;
  padding: 11px 12px;
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-ink-soft);
  outline: none;
  cursor: pointer;
  min-width: 0;
}

.date-input:focus,
.time-input:focus {
  border-color: var(--color-brown);
}

.start-banner {
  background: linear-gradient(180deg, var(--color-brown), var(--color-brown-dark));
  border-radius: 14px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-label {
  font-size: 11px;
  font-weight: 700;
  color: #E7C9A0;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.banner-start {
  font-size: 11px;
  font-weight: 600;
  color: rgba(251, 245, 234, 0.75);
}

.banner-time {
  font-family: var(--font-serif);
  font-size: 21px;
  font-weight: 800;
  color: var(--color-card);
  line-height: 1;
}

.banner-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.banner-total-label {
  font-size: 11px;
  font-weight: 600;
  color: #E7C9A0;
}

.banner-total {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-card);
}
</style>
