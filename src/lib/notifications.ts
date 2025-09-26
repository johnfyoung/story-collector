import {
  NOTIFICATION_CATEGORY_VALUES,
  TIME_OF_DAY_VALUES,
  WEEKDAY_VALUES,
  type NotificationCategory,
  type TimeOfDayOption,
  type Weekday,
} from '../types/notifications'

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  habitReminders: 'Habit reminders',
  progressUpdates: 'Progress updates',
  streakCelebrations: 'Streak celebrations',
  goalAchievements: 'Goal achievements',
}

export const NOTIFICATION_CATEGORY_DESCRIPTIONS: Record<NotificationCategory, string> = {
  habitReminders: 'Get reminders to complete the habits on your schedule.',
  progressUpdates: 'Stay informed about your overall progress (coming soon).',
  streakCelebrations: 'Celebrate important streak milestones (coming soon).',
  goalAchievements: 'Be notified when major goals are achieved (coming soon).',
}

export const TIME_OF_DAY_LABELS: Record<TimeOfDayOption, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export function isNotificationCategory(value: unknown): value is NotificationCategory {
  return NOTIFICATION_CATEGORY_VALUES.includes(value as NotificationCategory)
}

export function isTimeOfDay(value: unknown): value is TimeOfDayOption {
  return TIME_OF_DAY_VALUES.includes(value as TimeOfDayOption)
}

export function isWeekday(value: unknown): value is Weekday {
  return WEEKDAY_VALUES.includes(value as Weekday)
}

export function sortWeekdays(days: Weekday[]): Weekday[] {
  const order = [...WEEKDAY_VALUES]
  const unique = Array.from(new Set(days)) as Weekday[]
  return order.filter((day) => unique.includes(day))
}
