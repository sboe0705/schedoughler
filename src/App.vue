<template>
  <div class="app">
    <header class="header">
      <div class="app-icon">S</div>
      <div class="wordmark-group">
        <span class="wordmark">Schedoughler</span>
        <span class="sub-label">BROT NACH PLAN</span>
      </div>
    </header>

    <section class="section">
      <div class="section-label">REZEPT WÄHLEN</div>
      <RecipePicker :recipes="RECIPES" v-model="recipeId" :saved-bakes="savedBakes" @long-press="onLongPress" />
    </section>

    <SetupCard
      :recipe="recipe"
      :finish-at="finishAt"
      :schedule="schedule"
      @update:finish-at="finishAt = $event"
    />

    <StepTimeline
      :schedule="schedule"
      :overrides="overrides"
      :recipe="recipe"
      @nudge="onNudge"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  RECIPES, computeSchedule, defaultFinishTime, nudgeDuration,
  loadSavedBakes, persistSavedBakes, toggleSavedBake, pruneSavedBakes,
} from './scheduler.js'
import RecipePicker from './components/RecipePicker.vue'
import SetupCard from './components/SetupCard.vue'
import StepTimeline from './components/StepTimeline.vue'

function loadFinishAt(recipeId) {
  const saved = localStorage.getItem('finishAt')
  const savedId = localStorage.getItem('recipeId')
  if (saved && savedId === recipeId) {
    const d = new Date(saved)
    if (!isNaN(d)) return d
  }
  const r = RECIPES.find(r => r.id === recipeId) ?? RECIPES[0]
  return defaultFinishTime(r)
}

const recipeId = ref(localStorage.getItem('recipeId') ?? RECIPES[0].id)
const recipe = computed(() => RECIPES.find(r => r.id === recipeId.value) ?? RECIPES[0])
const finishAt = ref(loadFinishAt(recipeId.value))
const overrides = ref(JSON.parse(localStorage.getItem('overrides') ?? '{}'))

function pruneAndPersist(saved) {
  const { saved: pruned, changed } = pruneSavedBakes(saved)
  if (changed) persistSavedBakes(localStorage, pruned)
  return pruned
}

const savedBakes = ref(pruneAndPersist(loadSavedBakes(localStorage)))

const schedule = computed(() => computeSchedule(recipe.value, finishAt.value, overrides.value))

watch(recipeId, () => {
  const entry = savedBakes.value[recipeId.value]
  if (entry) {
    finishAt.value = new Date(entry.target)
    overrides.value = { ...entry.overrides }
  } else {
    overrides.value = {}
    finishAt.value = defaultFinishTime(recipe.value)
  }
})

watch([recipeId, finishAt, overrides], ([id, fa]) => {
  localStorage.setItem('recipeId', id)
  localStorage.setItem('finishAt', fa.toISOString())
  localStorage.setItem('overrides', JSON.stringify(overrides.value))
}, { deep: true })

function onNudge(stepIndex, dir) {
  overrides.value = nudgeDuration(recipe.value, overrides.value, stepIndex, dir)
}

function onLongPress(r) {
  navigator.vibrate?.(50)
  const next = toggleSavedBake(savedBakes.value, r, {
    isActive: r.id === recipeId.value,
    finishAt: finishAt.value,
    overrides: overrides.value,
  })
  savedBakes.value = next
  persistSavedBakes(localStorage, next)
}

let pruneInterval
onMounted(() => {
  pruneInterval = setInterval(() => {
    savedBakes.value = pruneAndPersist(savedBakes.value)
  }, 60_000)
})
onUnmounted(() => clearInterval(pruneInterval))
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --color-bg: #F4EBDD;
  --color-card: #FBF5EA;
  --color-card-border: #EADCC4;
  --color-brown: #6B4426;
  --color-brown-dark: #5a3820;
  --color-ink: #2E2218;
  --color-ink-soft: #3D2817;
  --color-muted: #9A8156;
  --color-tan: #A8946C;
  --color-faint: #C2B393;
  --color-prep: #C28A3D;
  --color-rise: #A8894E;
  --color-cold: #6E8597;
  --color-bake: #B5532A;
  --color-night-bg: #EBEEF3;
  --color-night-border: #D6DEE6;
  --color-night-pill: #3D3450;
  --color-night-pill-text: #EDE9F4;
  --color-rail: #E2D5BF;
  --font-serif: 'Bitter', serif;
  --font-sans: 'Hanken Grotesk', sans-serif;
}

body {
  background: var(--color-bg);
  font-family: var(--font-sans);
  color: var(--color-ink);
  min-height: 100dvh;
}

#app {
  display: flex;
  justify-content: center;
}

.app {
  width: 100%;
  max-width: 420px;
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.app-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: var(--color-brown);
  color: #fff;
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.18);
  flex-shrink: 0;
}

.wordmark-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.wordmark {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 800;
  color: var(--color-ink);
  letter-spacing: -0.01em;
  line-height: 1;
}

.sub-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-tan);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
