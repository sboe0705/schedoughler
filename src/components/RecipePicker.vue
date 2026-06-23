<template>
  <div class="picker">
    <button
      v-for="r in recipes"
      :key="r.id"
      class="chip"
      :class="{ selected: r.id === modelValue }"
      @click="$emit('update:modelValue', r.id)"
    >
      <span class="chip-name">{{ r.name }}</span>
      <span class="chip-meta">{{ r.totalShort }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({ recipes: Array, modelValue: String })
defineEmits(['update:modelValue'])
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
</style>
