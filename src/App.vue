<template>
  <div class="app">
    <RecipeSelectView
      v-if="view === 'select'"
      :recipes="RECIPES"
      :saved-bakes="savedBakes"
      @select-recipe="onSelectRecipe"
      @toggle-save="onToggleSave"
    />

    <template v-else>
      <SchedulerHeader
        :recipe="recipe"
        :saved="!!savedBakes[recipeId]"
        @back="onBack"
        @toggle-save="onToggleSave(recipe)"
      />

      <SetupCard
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  RECIPES, computeSchedule, defaultFinishTime, nudgeDuration,
  loadSavedBakes, persistSavedBakes, toggleSavedBake, pruneSavedBakes,
} from './scheduler.js'
import RecipeSelectView from './components/RecipeSelectView.vue'
import SchedulerHeader from './components/SchedulerHeader.vue'
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

const view = ref('select')
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

// Keep an already-saved bake's bookmark in sync while its plan is being edited.
watch([finishAt, overrides], () => {
  if (!savedBakes.value[recipeId.value]) return
  const next = {
    ...savedBakes.value,
    [recipeId.value]: { target: finishAt.value.getTime(), overrides: { ...overrides.value } },
  }
  savedBakes.value = next
  persistSavedBakes(localStorage, next)
}, { deep: true })

function onNudge(stepIndex, dir) {
  overrides.value = nudgeDuration(recipe.value, overrides.value, stepIndex, dir)
}

function onSelectRecipe(id) {
  recipeId.value = id
  view.value = 'plan'
}

function onBack() {
  view.value = 'select'
}

function onToggleSave(r) {
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
</style>
