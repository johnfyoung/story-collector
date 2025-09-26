import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  NOTIFICATION_CATEGORY_VALUES,
  type HabitNotificationPreference,
  type HabitNotificationSchedule,
  type NotificationCategory,
  type Weekday,
  type NotificationSettingsState,
} from '../types/notifications'
import {
  isTimeOfDay,
  isWeekday,
  sortWeekdays,
} from '../lib/notifications'

const STORAGE_KEY = 'notification-settings:v1'

const DEFAULT_CATEGORY_STATE: Record<NotificationCategory, boolean> = {
  habitReminders: true,
  progressUpdates: false,
  streakCelebrations: false,
  goalAchievements: false,
}

function createDefaultState(): NotificationSettingsState {
  return {
    global: {
      enabled: true,
      categories: { ...DEFAULT_CATEGORY_STATE },
    },
    habitPreferences: {},
  }
}

type HabitPreferenceUpdate = {
  enabled?: boolean
  schedule?: HabitNotificationSchedule | null
}

type NotificationSettingsContextValue = {
  globalEnabled: boolean
  categories: Record<NotificationCategory, boolean>
  habitPreferences: Record<string, HabitNotificationPreference>
  setGlobalEnabled: (enabled: boolean) => void
  setCategoryEnabled: (category: NotificationCategory, enabled: boolean) => void
  setHabitPreference: (habitId: string, update: HabitPreferenceUpdate) => void
  clearHabitPreference: (habitId: string) => void
}

const NotificationSettingsContext = createContext<NotificationSettingsContextValue | undefined>(
  undefined,
)

function loadState(): NotificationSettingsState {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as unknown
    return normalizeState(parsed)
  } catch {
    return createDefaultState()
  }
}

function normalizeState(raw: unknown): NotificationSettingsState {
  const base = createDefaultState()
  if (!raw || typeof raw !== 'object') {
    return base
  }

  const globalRaw = (raw as Record<string, unknown>).global
  const globalObject =
    globalRaw && typeof globalRaw === 'object' ? (globalRaw as Record<string, unknown>) : {}
  const categoriesRaw =
    globalObject.categories && typeof globalObject.categories === 'object'
      ? (globalObject.categories as Record<string, unknown>)
      : {}
  const categories = { ...DEFAULT_CATEGORY_STATE }
  for (const category of NOTIFICATION_CATEGORY_VALUES) {
    const value = categoriesRaw[category]
    if (typeof value === 'boolean') {
      categories[category] = value
    }
  }

  const habitPreferences: Record<string, HabitNotificationPreference> = {}
  const preferencesRaw = (raw as Record<string, unknown>).habitPreferences
  if (preferencesRaw && typeof preferencesRaw === 'object') {
    for (const [habitId, pref] of Object.entries(preferencesRaw as Record<string, unknown>)) {
      const normalized = normalizeHabitPreference(habitId, pref)
      if (normalized) {
        habitPreferences[habitId] = normalized
      }
    }
  }

  return {
    global: {
      enabled: typeof globalObject.enabled === 'boolean' ? globalObject.enabled : base.global.enabled,
      categories,
    },
    habitPreferences,
  }
}

function normalizeHabitPreference(
  habitId: string,
  raw: unknown,
): HabitNotificationPreference | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const prefObject = raw as Record<string, unknown>
  const enabled = typeof prefObject.enabled === 'boolean' ? prefObject.enabled : false
  const schedule = normalizeSchedule(prefObject.schedule)
  if (!enabled && !schedule) {
    return null
  }
  const preference: HabitNotificationPreference = { habitId, enabled }
  if (schedule) {
    preference.schedule = schedule
  }
  return preference
}

function normalizeSchedule(raw: unknown): HabitNotificationSchedule | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }
  const schedule = raw as Record<string, unknown>
  const type = schedule.type
  if (type === 'timeOfDay' && isTimeOfDay(schedule.timeOfDay)) {
    return { type: 'timeOfDay', timeOfDay: schedule.timeOfDay }
  }
  if (type === 'exact') {
    const time = typeof schedule.time === 'string' ? schedule.time : ''
    const days = Array.isArray(schedule.daysOfWeek)
      ? sortWeekdays(schedule.daysOfWeek.filter((d): d is Weekday => isWeekday(d)))
      : []
    if (time && days.length > 0) {
      return { type: 'exact', time, daysOfWeek: days }
    }
  }
  return undefined
}

export function NotificationSettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotificationSettingsState>(() => loadState())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore persistence failures
    }
  }, [state])

  const value = useMemo<NotificationSettingsContextValue>(() => {
    const setGlobalEnabled = (enabled: boolean) => {
      setState((prev) => ({
        ...prev,
        global: { ...prev.global, enabled },
      }))
    }

    const setCategoryEnabled = (category: NotificationCategory, enabled: boolean) => {
      setState((prev) => ({
        ...prev,
        global: {
          ...prev.global,
          categories: { ...prev.global.categories, [category]: enabled },
        },
      }))
    }

    const setHabitPreference = (habitId: string, update: HabitPreferenceUpdate) => {
      setState((prev) => {
        const existing = prev.habitPreferences[habitId]
        const next: HabitNotificationPreference = {
          habitId,
          enabled: existing?.enabled ?? false,
          ...(existing?.schedule ? { schedule: existing.schedule } : {}),
        }
        if (typeof update.enabled === 'boolean') {
          next.enabled = update.enabled
        }
        if (update.schedule === null) {
          delete next.schedule
        } else if (update.schedule) {
          next.schedule = update.schedule
        }
        if (!next.enabled && !next.schedule) {
          const rest = { ...prev.habitPreferences }
          delete rest[habitId]
          return { ...prev, habitPreferences: rest }
        }
        return {
          ...prev,
          habitPreferences: {
            ...prev.habitPreferences,
            [habitId]: next,
          },
        }
      })
    }

    const clearHabitPreference = (habitId: string) => {
      setState((prev) => {
        if (!prev.habitPreferences[habitId]) {
          return prev
        }
        const rest = { ...prev.habitPreferences }
        delete rest[habitId]
        return { ...prev, habitPreferences: rest }
      })
    }

    return {
      globalEnabled: state.global.enabled,
      categories: state.global.categories,
      habitPreferences: state.habitPreferences,
      setGlobalEnabled,
      setCategoryEnabled,
      setHabitPreference,
      clearHabitPreference,
    }
  }, [state])

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  )
}

export function useNotificationSettings() {
  const ctx = useContext(NotificationSettingsContext)
  if (!ctx) {
    throw new Error('useNotificationSettings must be used within NotificationSettingsProvider')
  }
  return ctx
}
