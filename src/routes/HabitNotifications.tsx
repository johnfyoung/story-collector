import { useMemo } from 'react'
import { Card } from '../components/Card'
import {
  NOTIFICATION_CATEGORY_VALUES,
  TIME_OF_DAY_VALUES,
  WEEKDAY_VALUES,
  type HabitNotificationPreference,
  type HabitNotificationSchedule,
  type TimeOfDayOption,
  type Weekday,
} from '../types/notifications'
import {
  NOTIFICATION_CATEGORY_DESCRIPTIONS,
  NOTIFICATION_CATEGORY_LABELS,
  TIME_OF_DAY_LABELS,
  WEEKDAY_LABELS,
  sortWeekdays,
} from '../lib/notifications'
import { useNotificationSettings } from '../state/NotificationSettingsProvider'

type Habit = {
  id: string
  name: string
  description?: string
}

const DEFAULT_CUSTOM_TIME = '09:00'

const HABITS: Habit[] = [
  {
    id: 'hydrate',
    name: 'Drink water',
    description: 'Stay hydrated by drinking a glass of water.',
  },
  {
    id: 'journal',
    name: 'Morning journal',
    description: 'Capture your thoughts with a quick journal entry.',
  },
  {
    id: 'stretch',
    name: 'Stretch break',
    description: 'Take a mindful stretch to reset your posture.',
  },
]

type ScheduleType = HabitNotificationSchedule['type']

function ensureSchedule(
  schedule: HabitNotificationSchedule | undefined,
  type: ScheduleType,
): HabitNotificationSchedule {
  if (type === 'timeOfDay') {
    return {
      type: 'timeOfDay',
      timeOfDay:
        schedule?.type === 'timeOfDay' ? schedule.timeOfDay : TIME_OF_DAY_VALUES[0],
    }
  }
  const fallbackDays = [...WEEKDAY_VALUES]
  const days =
    schedule?.type === 'exact' && schedule.daysOfWeek.length
      ? sortWeekdays(schedule.daysOfWeek)
      : fallbackDays
  const time = schedule?.type === 'exact' ? schedule.time : DEFAULT_CUSTOM_TIME
  return { type: 'exact', time, daysOfWeek: days }
}

function HabitScheduleCard({
  habit,
  preference,
  onChange,
  disabled,
}: {
  habit: Habit
  preference?: HabitNotificationPreference
  onChange: (update: Partial<HabitNotificationPreference>) => void
  disabled: boolean
}) {
  const enabled = preference?.enabled ?? false
  const schedule = preference?.schedule
  const scheduleType: ScheduleType = schedule?.type ?? 'timeOfDay'

  const handleEnabledChange = (next: boolean) => {
    if (next) {
      const nextSchedule = ensureSchedule(schedule, scheduleType)
      onChange({ enabled: true, schedule: nextSchedule })
    } else {
      onChange({ enabled: false, schedule: undefined })
    }
  }

  const handleScheduleTypeChange = (nextType: ScheduleType) => {
    const nextSchedule = ensureSchedule(schedule, nextType)
    onChange({ enabled: true, schedule: nextSchedule })
  }

  const handleTimeOfDayChange = (value: TimeOfDayOption) => {
    onChange({
      enabled: true,
      schedule: { type: 'timeOfDay', timeOfDay: value },
    })
  }

  const handleCustomTimeChange = (value: string) => {
    const timeValue = value || DEFAULT_CUSTOM_TIME
    const current = ensureSchedule(schedule, 'exact')
    onChange({
      enabled: true,
      schedule: { type: 'exact', time: timeValue, daysOfWeek: current.daysOfWeek },
    })
  }

  const handleDayToggle = (day: Weekday) => {
    const current = ensureSchedule(schedule, 'exact')
    const set = new Set(current.daysOfWeek)
    if (set.has(day)) {
      if (set.size === 1) {
        return
      }
      set.delete(day)
    } else {
      set.add(day)
    }
    const nextDays = sortWeekdays(Array.from(set) as Weekday[])
    onChange({
      enabled: true,
      schedule: { type: 'exact', time: current.time, daysOfWeek: nextDays },
    })
  }

  const scheduleDisabled = disabled || !enabled

  return (
    <Card>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{habit.name}</div>
          {habit.description ? (
            <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              {habit.description}
            </div>
          ) : null}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => handleEnabledChange(event.target.checked)}
            disabled={disabled}
          />
          <span>Enable reminders</span>
        </label>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 500 }}>Schedule type</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio"
                name={`${habit.id}-schedule`}
                value="timeOfDay"
                checked={scheduleType === 'timeOfDay'}
                onChange={() => handleScheduleTypeChange('timeOfDay')}
                disabled={scheduleDisabled}
              />
              <span>Time of day</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio"
                name={`${habit.id}-schedule`}
                value="exact"
                checked={scheduleType === 'exact'}
                onChange={() => handleScheduleTypeChange('exact')}
                disabled={scheduleDisabled}
              />
              <span>Specific time</span>
            </label>
          </div>
        </div>
        {scheduleType === 'timeOfDay' ? (
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 500 }}>Reminder window</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {TIME_OF_DAY_VALUES.map((value) => (
                <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name={`${habit.id}-timeOfDay`}
                    value={value}
                    checked={schedule?.type === 'timeOfDay' ? schedule.timeOfDay === value : value === TIME_OF_DAY_VALUES[0]}
                    onChange={() => handleTimeOfDayChange(value)}
                    disabled={scheduleDisabled}
                  />
                  <span>{TIME_OF_DAY_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 500 }}>Reminder time</div>
              <input
                type="time"
                value={schedule?.type === 'exact' ? schedule.time : DEFAULT_CUSTOM_TIME}
                onChange={(event) => handleCustomTimeChange(event.target.value)}
                disabled={scheduleDisabled}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontWeight: 500 }}>Days of the week</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {WEEKDAY_VALUES.map((day) => {
                  const selected = schedule?.type === 'exact' ? schedule.daysOfWeek.includes(day) : true
                  return (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleDayToggle(day)}
                        disabled={scheduleDisabled}
                      />
                      <span>{WEEKDAY_LABELS[day]}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function HabitNotifications() {
  const {
    globalEnabled,
    categories,
    habitPreferences,
    setGlobalEnabled,
    setCategoryEnabled,
    setHabitPreference,
  } = useNotificationSettings()

  const remindersDisabled = !globalEnabled || !categories.habitReminders
  const categoryItems = useMemo(() => {
    return NOTIFICATION_CATEGORY_VALUES.map((category) => ({
      id: category,
      label: NOTIFICATION_CATEGORY_LABELS[category],
      description: NOTIFICATION_CATEGORY_DESCRIPTIONS[category],
    }))
  }, [])

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
          Configure when Story Collector should send you habit reminders.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={globalEnabled}
            onChange={(event) => setGlobalEnabled(event.target.checked)}
          />
          <span>Enable notifications</span>
        </label>
      </div>
      <Card>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Notification categories</div>
            <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              Choose the types of notifications you want to receive. Only habit reminders are
              available right now.
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {categoryItems.map((category) => (
              <label key={category.id} style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={categories[category.id] ?? false}
                    onChange={(event) =>
                      setCategoryEnabled(category.id, event.target.checked)
                    }
                    disabled={!globalEnabled}
                  />
                  <span style={{ fontWeight: 500 }}>{category.label}</span>
                </div>
                <span style={{ color: 'var(--color-text-muted)' }}>{category.description}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Habit reminders</div>
          <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
            Set personalised schedules for each habit. Reminders follow the global and category
            settings above.
          </div>
          {remindersDisabled ? (
            <div style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
              Enable notifications and the habit reminders category to customise schedules.
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {HABITS.map((habit) => (
            <HabitScheduleCard
              key={habit.id}
              habit={habit}
              preference={habitPreferences[habit.id]}
              onChange={(update) =>
                setHabitPreference(habit.id, {
                  enabled: update.enabled,
                  schedule: update.schedule ?? null,
                })
              }
              disabled={remindersDisabled}
            />
          ))}
        </div>
      </div>
      <div style={{ color: 'var(--color-text-muted)' }}>Changes save automatically.</div>
    </div>
  )
}
