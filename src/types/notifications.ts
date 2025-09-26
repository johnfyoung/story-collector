export const NOTIFICATION_CATEGORY_VALUES = [
  'habitReminders',
  'progressUpdates',
  'streakCelebrations',
  'goalAchievements',
] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORY_VALUES)[number]

export const TIME_OF_DAY_VALUES = ['morning', 'afternoon', 'evening'] as const

export type TimeOfDayOption = (typeof TIME_OF_DAY_VALUES)[number]

export const WEEKDAY_VALUES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAY_VALUES)[number]

export type NotificationGlobalSettings = {
  enabled: boolean
  categories: Record<NotificationCategory, boolean>
}

export type HabitNotificationSchedule =
  | {
      type: 'timeOfDay'
      timeOfDay: TimeOfDayOption
    }
  | {
      type: 'exact'
      time: string
      daysOfWeek: Weekday[]
    }

export type HabitNotificationPreference = {
  habitId: string
  enabled: boolean
  schedule?: HabitNotificationSchedule
}

export type NotificationSettingsState = {
  global: NotificationGlobalSettings
  habitPreferences: Record<string, HabitNotificationPreference>
}
