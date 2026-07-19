<template>
  <div class="select-view">
    <header class="header">
      <div class="app-icon">S</div>
      <div class="wordmark-group">
        <span class="wordmark">Schedoughler</span>
        <span class="sub-label">BROT NACH PLAN</span>
      </div>
    </header>

    <div class="search-field">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A8946C" stroke-width="2.2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Rezepte durchsuchen …"
      />
      <button v-if="hasQuery" class="clear-btn" title="Suche löschen" @click="clearQuery">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <template v-if="filteredSaved.length">
      <div class="section-label">Gespeicherte Backzeiten</div>
      <div class="saved-list">
        <RecipeRow
          v-for="entry in filteredSaved"
          :key="entry.recipe.id"
          :recipe="entry.recipe"
          :saved="true"
          :saved-label="entry.savedLabel"
          :next-step-label="entry.nextStepLabel"
          :starred="!!props.starredRecipes[entry.recipe.id]"
          @select="$emit('select-recipe', entry.recipe.id)"
          @toggle-save="$emit('toggle-save', entry.recipe)"
          @toggle-star="$emit('toggle-star', entry.recipe.id)"
        />
      </div>
    </template>

    <template v-if="filteredStarred.length">
      <div class="section-label">Favoriten</div>
      <div class="starred-list">
        <RecipeRow
          v-for="r in filteredStarred"
          :key="r.id"
          :recipe="r"
          :starred="true"
          @select="$emit('select-recipe', r.id)"
          @toggle-save="$emit('toggle-save', r)"
          @toggle-star="$emit('toggle-star', r.id)"
        />
      </div>
    </template>

    <div class="section-label">Alle Rezepte</div>
    <div class="other-list">
      <RecipeRow
        v-for="r in filteredOther"
        :key="r.id"
        :recipe="r"
        :starred="!!props.starredRecipes[r.id]"
        @select="$emit('select-recipe', r.id)"
        @toggle-save="$emit('toggle-save', r)"
        @toggle-star="$emit('toggle-star', r.id)"
      />
    </div>

    <div v-if="noResults" class="empty-state">Keine Rezepte gefunden für „{{ query.trim() }}“</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { matchesQuery, computeSchedule, nextStepTime } from '../scheduler.js'
import { formatWeekdayTime } from '../utils.js'
import RecipeRow from './RecipeRow.vue'

const props = defineProps({
  recipes: Array,
  savedBakes: { type: Object, default: () => ({}) },
  starredRecipes: { type: Object, default: () => ({}) },
})
defineEmits(['select-recipe', 'toggle-save', 'toggle-star'])

const query = ref('')
const hasQuery = computed(() => query.value.trim().length > 0)

function clearQuery() {
  query.value = ''
}

const filteredSaved = computed(() =>
  props.recipes
    .filter(r => props.savedBakes[r.id] && matchesQuery(r, query.value))
    .map(r => {
      const entry = props.savedBakes[r.id]
      const schedule = computeSchedule(r, new Date(entry.target), entry.overrides)
      return {
        recipe: r,
        savedLabel: formatWeekdayTime(new Date(entry.target)),
        nextStepLabel: formatWeekdayTime(nextStepTime(schedule.steps)),
      }
    })
    .sort((a, b) => props.savedBakes[a.recipe.id].target - props.savedBakes[b.recipe.id].target)
)

const filteredStarred = computed(() =>
  props.recipes
    .filter(r => !props.savedBakes[r.id] && props.starredRecipes[r.id] && matchesQuery(r, query.value))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
)

const filteredOther = computed(() =>
  props.recipes
    .filter(r => !props.savedBakes[r.id] && !props.starredRecipes[r.id] && matchesQuery(r, query.value))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
)

const noResults = computed(() =>
  hasQuery.value && filteredSaved.value.length === 0 && filteredStarred.value.length === 0 && filteredOther.value.length === 0
)
</script>

<style scoped>
.select-view {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 2px 20px;
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

.search-field {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  margin-bottom: 18px;
  background: var(--color-card);
  border: 1.5px solid #E5D5BB;
  border-radius: 14px;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink-soft);
}

.clear-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #E5D5BB;
  color: var(--color-brown);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-tan);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 2px 9px;
}

.saved-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 22px;
}

.starred-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 22px;
}

.other-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.empty-state {
  text-align: center;
  padding: 26px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-tan);
}
</style>
