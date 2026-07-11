import { describe, it, expect } from 'vitest'
import {
  RECIPES,
  KINDS,
  computeSchedule,
  defaultFinishTime,
  nudgeDuration,
  effectiveDuration,
  durationLabel,
  rangeLabel,
  matchesQuery,
  currentStepIndex,
} from './scheduler.js'

const FINISH = new Date('2025-01-15T10:00:00')

describe('RECIPES', () => {
  it('exports 9 recipes', () => {
    expect(RECIPES).toHaveLength(9)
  })

  it('every recipe has required fields', () => {
    for (const r of RECIPES) {
      expect(r.id).toBeTruthy()
      expect(r.name).toBeTruthy()
      expect(Array.isArray(r.steps)).toBe(true)
      expect(r.steps.length).toBeGreaterThan(0)
    }
  })

  it('every step has title, dur, and kind', () => {
    for (const r of RECIPES) {
      for (const s of r.steps) {
        expect(typeof s.title).toBe('string')
        expect(typeof s.dur).toBe('number')
        expect(s.dur).toBeGreaterThan(0)
        expect(Object.keys(KINDS)).toContain(s.kind)
      }
    }
  })

  it('flexible steps have consistent min/max/step', () => {
    for (const r of RECIPES) {
      for (const s of r.steps) {
        if (s.min != null) {
          expect(s.min).toBeLessThanOrEqual(s.dur)
          expect(s.dur).toBeLessThanOrEqual(s.max)
          expect(s.step).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('computeSchedule', () => {
  const recipe = RECIPES[0] // Sauerteigbrot

  it('finish time matches the requested finish', () => {
    const result = computeSchedule(recipe, FINISH)
    expect(result.finishAt).toBe(FINISH)
  })

  it('last step ends at finish time', () => {
    const { steps } = computeSchedule(recipe, FINISH)
    expect(steps.at(-1).end.getTime()).toBe(FINISH.getTime())
  })

  it('each step starts where the previous one ends', () => {
    const { steps } = computeSchedule(recipe, FINISH)
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].start.getTime()).toBe(steps[i - 1].end.getTime())
    }
  })

  it('step duration matches end - start', () => {
    const { steps } = computeSchedule(recipe, FINISH)
    for (const s of steps) {
      const diff = (s.end.getTime() - s.start.getTime()) / 60000
      expect(diff).toBe(s.dur)
    }
  })

  it('startAt equals first step start', () => {
    const result = computeSchedule(recipe, FINISH)
    expect(result.startAt.getTime()).toBe(result.steps[0].start.getTime())
  })

  it('totalMinutes is the sum of all step durations', () => {
    const result = computeSchedule(recipe, FINISH)
    const sum = result.steps.reduce((a, s) => a + s.dur, 0)
    expect(result.totalMinutes).toBe(sum)
  })

  it('applies overrides to flexible steps', () => {
    const stepIndex = 1 // Vorteig gären lassen — flexible
    const override = 600
    const { steps } = computeSchedule(recipe, FINISH, { [stepIndex]: override })
    expect(steps[stepIndex].dur).toBe(override)
  })

  it('clamps overrides to step min/max', () => {
    const stepIndex = 1
    const { min, max } = recipe.steps[stepIndex]
    const { steps: stepsUnder } = computeSchedule(recipe, FINISH, { [stepIndex]: min - 60 })
    expect(stepsUnder[stepIndex].dur).toBe(min)
    const { steps: stepsOver } = computeSchedule(recipe, FINISH, { [stepIndex]: max + 60 })
    expect(stepsOver[stepIndex].dur).toBe(max)
  })
})

describe('defaultFinishTime', () => {
  it('returns a date after now + total duration', () => {
    const now = new Date()
    const recipe = RECIPES[0]
    const total = recipe.steps.reduce((a, s) => a + s.dur, 0)
    const result = defaultFinishTime(recipe, now)
    expect(result.getTime()).toBeGreaterThan(now.getTime() + total * 60000)
  })

  it('is rounded to a whole hour', () => {
    const result = defaultFinishTime(RECIPES[0], FINISH)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })
})

describe('nudgeDuration', () => {
  const recipe = RECIPES[0]
  const stepIndex = 1 // flexible step

  it('increases duration by step amount when dir=+1', () => {
    const { dur, step } = recipe.steps[stepIndex]
    const result = nudgeDuration(recipe, {}, stepIndex, +1)
    expect(result[stepIndex]).toBe(dur + step)
  })

  it('decreases duration by step amount when dir=-1', () => {
    const { dur, step } = recipe.steps[stepIndex]
    const result = nudgeDuration(recipe, {}, stepIndex, -1)
    expect(result[stepIndex]).toBe(dur - step)
  })

  it('clamps at max', () => {
    const { max } = recipe.steps[stepIndex]
    const result = nudgeDuration(recipe, { [stepIndex]: max }, stepIndex, +1)
    expect(result[stepIndex]).toBe(max)
  })

  it('clamps at min', () => {
    const { min } = recipe.steps[stepIndex]
    const result = nudgeDuration(recipe, { [stepIndex]: min }, stepIndex, -1)
    expect(result[stepIndex]).toBe(min)
  })

  it('does not mutate the original overrides', () => {
    const overrides = { 0: 60 }
    nudgeDuration(recipe, overrides, stepIndex, +1)
    expect(overrides[stepIndex]).toBeUndefined()
  })

  it('ignores non-flexible steps', () => {
    const overrides = {}
    const result = nudgeDuration(recipe, overrides, 0, +1) // step 0 has no min
    expect(result).toBe(overrides)
  })
})

describe('effectiveDuration', () => {
  const flexible = RECIPES[0].steps[1] // has min/max
  const fixed = RECIPES[0].steps[0]    // no min/max

  it('returns step.dur for fixed steps regardless of override', () => {
    expect(effectiveDuration(fixed, 999)).toBe(fixed.dur)
  })

  it('returns override when within range', () => {
    expect(effectiveDuration(flexible, flexible.min + 30)).toBe(flexible.min + 30)
  })

  it('returns step.dur when override is null', () => {
    expect(effectiveDuration(flexible, null)).toBe(flexible.dur)
  })

  it('clamps to min', () => {
    expect(effectiveDuration(flexible, flexible.min - 1)).toBe(flexible.min)
  })

  it('clamps to max', () => {
    expect(effectiveDuration(flexible, flexible.max + 1)).toBe(flexible.max)
  })
})

describe('durationLabel', () => {
  it('formats minutes only when under 60', () => {
    expect(durationLabel(45)).toBe('45 Min')
  })

  it('formats whole hours', () => {
    expect(durationLabel(120)).toBe('2 Std')
  })

  it('formats hours and minutes', () => {
    expect(durationLabel(90)).toBe('1 Std 30 Min')
  })
})

describe('rangeLabel', () => {
  it('returns empty string for fixed steps', () => {
    expect(rangeLabel(RECIPES[0].steps[0])).toBe('')
  })

  it('formats hour ranges', () => {
    const step = RECIPES[0].steps[1] // 480–840 min = 8–14 Std
    expect(rangeLabel(step)).toBe('8 Std–14 Std')
  })

  it('formats minute ranges', () => {
    const step = RECIPES[2].steps[6] // Guinness Brot Stückgare: 40–50 min
    expect(rangeLabel(step)).toBe('40–50 Min')
  })
})

describe('currentStepIndex', () => {
  const recipe = RECIPES[0] // Sauerteigbrot
  const { steps } = computeSchedule(recipe, FINISH)

  it('returns 0 when now is before the first step starts', () => {
    const before = new Date(steps[0].start.getTime() - 60000)
    expect(currentStepIndex(steps, before)).toBe(0)
  })

  it('returns the step whose start/end window contains now', () => {
    const midStep = 2
    const inside = new Date((steps[midStep].start.getTime() + steps[midStep].end.getTime()) / 2)
    expect(currentStepIndex(steps, inside)).toBe(midStep)
  })

  it('returns the next step exactly at a boundary (end is exclusive)', () => {
    expect(currentStepIndex(steps, steps[0].end)).toBe(1)
  })

  it('returns the last step once the whole bake is past finish', () => {
    const after = new Date(steps.at(-1).end.getTime() + 60000)
    expect(currentStepIndex(steps, after)).toBe(steps.length - 1)
  })

  it('defaults to the current time when now is omitted', () => {
    expect(() => currentStepIndex(steps)).not.toThrow()
  })
})

describe('matchesQuery', () => {
  const recipe = RECIPES[0] // Sauerteigbrot - wie vom Bäcker

  it('matches everything for an empty query', () => {
    expect(matchesQuery(recipe, '')).toBe(true)
  })

  it('matches everything for a whitespace-only query', () => {
    expect(matchesQuery(recipe, '   ')).toBe(true)
  })

  it('matches on the recipe name, case-insensitively', () => {
    expect(matchesQuery(recipe, 'SAUERTEIGBROT')).toBe(true)
  })

  it('matches on a word that only appears in a step title/description', () => {
    expect(matchesQuery(recipe, 'Gusseisentopf')).toBe(true)
  })

  it('requires every word to match (AND semantics)', () => {
    expect(matchesQuery(recipe, 'Gusseisentopf zzzznotfound')).toBe(false)
  })

  it('matches when every word occurs somewhere in the recipe', () => {
    expect(matchesQuery(recipe, 'Vorteig ansetzen')).toBe(true)
  })

  it('returns false when nothing matches', () => {
    expect(matchesQuery(recipe, 'zzzznotfound')).toBe(false)
  })
})
