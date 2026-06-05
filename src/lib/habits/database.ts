import type { SQLiteDatabase } from 'expo-sqlite';

import { addDays, formatDateKey, parseDateKey } from '@/lib/habits/dates';

const DATABASE_VERSION = 2;
const HISTORY_WINDOW_DAYS = 30;

export const habitColors = ['#FF8D68', '#FF6F61', '#F7C59F', '#8FC7B5', '#8EA7E9', '#B9A7E8'];

export const habitIconOptions = [
  { emoji: '🧘', label: 'Yoga', category: 'Wellness', color: habitColors[0] },
  { emoji: '🎵', label: 'Singing', category: 'Creative', color: habitColors[1] },
  { emoji: '📚', label: 'Reading', category: 'Learning', color: habitColors[2] },
  { emoji: '🏃', label: 'Running', category: 'Fitness', color: habitColors[0] },
  { emoji: '💤', label: 'Sleeping', category: 'Health', color: habitColors[4] },
  { emoji: '🎨', label: 'Drawing', category: 'Creative', color: habitColors[2] },
  { emoji: '🚴', label: 'Cycling', category: 'Fitness', color: habitColors[3] },
  { emoji: '💧', label: 'Water', category: 'Health', color: habitColors[4] },
] as const;

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type WeekStartsOn = 'monday' | 'sunday';

export type AppSettings = {
  hapticsEnabled: boolean;
  compactLayout: boolean;
  weekStartsOn: WeekStartsOn;
};

export type UserProfile = {
  displayName: string;
  subtitle: string;
  avatarEmoji: string;
  weeklyGoal: number;
};

export type Habit = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
  category: string;
  schedule: HabitFrequency;
  customDays: number[];
  reminderTime: string | null;
  targetCount: number;
  targetUnit: string;
  startDate: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HabitWithTodayStatus = Habit & {
  completedToday: boolean;
  completedAt: string | null;
  currentStreak: number;
  isDueToday: boolean;
};

export type HabitInput = {
  title: string;
  description: string;
  emoji: string;
  color: string;
  category: string;
  schedule: HabitFrequency;
  customDays: number[];
  reminderTime: string | null;
  targetCount: number;
  targetUnit: string;
};

export type HabitHistoryDay = {
  date: string;
  dueCount: number;
  completedCount: number;
  completionRate: number;
};

export type HabitBreakdown = {
  habitId: number;
  title: string;
  emoji: string;
  color: string;
  completedCount: number;
  dueCount: number;
  completionRate: number;
  currentStreak: number;
};

export type HabitAnalytics = {
  activeHabitCount: number;
  completedToday: number;
  dueToday: number;
  todayRate: number;
  bestStreak: number;
  totalCompletions: number;
  thirtyDayRate: number;
  perfectDays: number;
  weeklyHistory: HabitHistoryDay[];
  habitBreakdown: HabitBreakdown[];
};

type HabitRow = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
  category: string;
  schedule: string;
  custom_days: string;
  reminder_time: string | null;
  target_count: number;
  target_unit: string;
  start_date: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
};

type CompletionRow = {
  habit_id: number;
  date: string;
};

export const defaultSettings: AppSettings = {
  hapticsEnabled: true,
  compactLayout: false,
  weekStartsOn: 'sunday',
};

export const defaultProfile: UserProfile = {
  displayName: 'You',
  subtitle: 'Building better days',
  avatarEmoji: '🙂',
  weeklyGoal: 21,
};

export async function migrateDatabase(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    await ensureDefaultSettings(db);
    await ensureDefaultProfile(db);
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      emoji TEXT NOT NULL DEFAULT '✅',
      color TEXT NOT NULL DEFAULT '#FF8D68',
      category TEXT NOT NULL DEFAULT 'Wellness',
      schedule TEXT NOT NULL DEFAULT 'daily',
      custom_days TEXT NOT NULL DEFAULT '[]',
      reminder_time TEXT,
      target_count INTEGER NOT NULL DEFAULT 1,
      target_unit TEXT NOT NULL DEFAULT 'check-in',
      start_date TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(habit_id, date),
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      display_name TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      avatar_emoji TEXT NOT NULL,
      weekly_goal INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_habits_active_sort
      ON habits(archived_at, sort_order, created_at);

    CREATE INDEX IF NOT EXISTS idx_habit_completions_lookup
      ON habit_completions(habit_id, date);

    CREATE INDEX IF NOT EXISTS idx_habit_completions_date
      ON habit_completions(date);
  `);

  await ensureHabitColumns(db);
  await db.runAsync("UPDATE habits SET start_date = DATE(created_at) WHERE start_date = ''");
  await ensureDefaultSettings(db);
  await ensureDefaultProfile(db);

  if (__DEV__) {
    await seedStarterData(db);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function listHabitsWithTodayStatus(db: SQLiteDatabase, date: string) {
  const rows = await db.getAllAsync<HabitRow>(
    `
      SELECT
        habits.id,
        habits.title,
        habits.description,
        habits.emoji,
        habits.color,
        habits.category,
        habits.schedule,
        habits.custom_days,
        habits.reminder_time,
        habits.target_count,
        habits.target_unit,
        habits.start_date,
        habits.sort_order,
        habits.archived_at,
        habits.created_at,
        habits.updated_at,
        habit_completions.completed_at
      FROM habits
      LEFT JOIN habit_completions
        ON habit_completions.habit_id = habits.id
        AND habit_completions.date = ?
      WHERE habits.archived_at IS NULL
      ORDER BY habits.sort_order ASC, habits.created_at ASC
    `,
    date
  );

  const habits = await Promise.all(
    rows.map(async (row) => {
      const habit = mapHabitRow(row);

      return {
        ...habit,
        completedToday: Boolean(row.completed_at),
        completedAt: row.completed_at ?? null,
        currentStreak: await getCurrentStreak(db, habit, date),
        isDueToday: isHabitDueOnDate(habit, date),
      };
    })
  );

  return habits;
}

export async function createHabit(db: SQLiteDatabase, input: HabitInput) {
  const normalized = normalizeHabitInput(input);
  const sortResult = await db.getFirstAsync<{ next_sort_order: number }>(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order FROM habits'
  );

  const result = await db.runAsync(
    `
      INSERT INTO habits (
        title,
        description,
        emoji,
        color,
        category,
        schedule,
        custom_days,
        reminder_time,
        target_count,
        target_unit,
        start_date,
        sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    normalized.title,
    normalized.description,
    normalized.emoji,
    normalized.color,
    normalized.category,
    normalized.schedule,
    JSON.stringify(normalized.customDays),
    normalized.reminderTime,
    normalized.targetCount,
    normalized.targetUnit,
    formatDateKey(new Date()),
    sortResult?.next_sort_order ?? 1
  );

  return result.lastInsertRowId;
}

export async function updateHabit(db: SQLiteDatabase, id: number, input: HabitInput) {
  const normalized = normalizeHabitInput(input);

  await db.runAsync(
    `
      UPDATE habits
      SET title = ?,
          description = ?,
          emoji = ?,
          color = ?,
          category = ?,
          schedule = ?,
          custom_days = ?,
          reminder_time = ?,
          target_count = ?,
          target_unit = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    normalized.title,
    normalized.description,
    normalized.emoji,
    normalized.color,
    normalized.category,
    normalized.schedule,
    JSON.stringify(normalized.customDays),
    normalized.reminderTime,
    normalized.targetCount,
    normalized.targetUnit,
    id
  );
}

export async function archiveHabit(db: SQLiteDatabase, id: number) {
  await db.runAsync(
    `
      UPDATE habits
      SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    id
  );
}

export async function toggleHabitCompletion(db: SQLiteDatabase, habitId: number, date: string) {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?',
    habitId,
    date
  );

  if (existing) {
    await db.runAsync('DELETE FROM habit_completions WHERE id = ?', existing.id);
    return false;
  }

  await db.runAsync('INSERT INTO habit_completions (habit_id, date) VALUES (?, ?)', habitId, date);
  return true;
}

export async function getHabitHistory(db: SQLiteDatabase, startDate: string, endDate: string) {
  const habits = await listActiveHabits(db);
  const today = formatDateKey(new Date());
  const completionRows = await db.getAllAsync<CompletionRow>(
    'SELECT habit_id, date FROM habit_completions WHERE date BETWEEN ? AND ?',
    startDate,
    endDate
  );
  const completionsByDate = new Map<string, Set<number>>();

  completionRows.forEach((row) => {
    const ids = completionsByDate.get(row.date) ?? new Set<number>();
    ids.add(row.habit_id);
    completionsByDate.set(row.date, ids);
  });

  const days: HabitHistoryDay[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const dueHabits = cursor <= today ? habits.filter((habit) => isHabitDueOnDate(habit, cursor)) : [];
    const completedIds = completionsByDate.get(cursor) ?? new Set<number>();
    const completedCount = dueHabits.filter((habit) => completedIds.has(habit.id)).length;

    days.push({
      date: cursor,
      dueCount: dueHabits.length,
      completedCount,
      completionRate: dueHabits.length ? completedCount / dueHabits.length : 0,
    });

    cursor = addDays(cursor, 1);
  }

  return days;
}

export async function getCalendarMonth(db: SQLiteDatabase, visibleDate: string) {
  const parsed = parseDateKey(visibleDate);
  const start = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  const end = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);

  return getHabitHistory(db, formatDateKey(start), formatDateKey(end));
}

export async function getHabitAnalytics(db: SQLiteDatabase, date: string) {
  const activeHabits = await listActiveHabits(db);
  const todayHabits = await listHabitsWithTodayStatus(db, date);
  const weeklyHistory = await getHabitHistory(db, addDays(date, -6), date);
  const thirtyDayHistory = await getHabitHistory(db, addDays(date, -(HISTORY_WINDOW_DAYS - 1)), date);
  const totalCompletionsRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM habit_completions'
  );
  const dueToday = todayHabits.filter((habit) => habit.isDueToday).length;
  const completedToday = todayHabits.filter((habit) => habit.isDueToday && habit.completedToday).length;
  const totalDue = thirtyDayHistory.reduce((sum, day) => sum + day.dueCount, 0);
  const totalCompleted = thirtyDayHistory.reduce((sum, day) => sum + day.completedCount, 0);

  const habitBreakdown = await Promise.all(
    activeHabits.map(async (habit) => {
      const days = thirtyDayHistory.filter((day) => isHabitDueOnDate(habit, day.date));
      const completionRows = await db.getAllAsync<{ date: string }>(
        'SELECT date FROM habit_completions WHERE habit_id = ? AND date BETWEEN ? AND ?',
        habit.id,
        addDays(date, -(HISTORY_WINDOW_DAYS - 1)),
        date
      );
      const completedDates = new Set(completionRows.map((row) => row.date));
      const completedCount = days.filter((day) => completedDates.has(day.date)).length;

      return {
        habitId: habit.id,
        title: habit.title,
        emoji: habit.emoji,
        color: habit.color,
        completedCount,
        dueCount: days.length,
        completionRate: days.length ? completedCount / days.length : 0,
        currentStreak: await getCurrentStreak(db, habit, date),
      };
    })
  );

  return {
    activeHabitCount: activeHabits.length,
    completedToday,
    dueToday,
    todayRate: dueToday ? completedToday / dueToday : 0,
    bestStreak: Math.max(0, ...todayHabits.map((habit) => habit.currentStreak)),
    totalCompletions: totalCompletionsRow?.count ?? 0,
    thirtyDayRate: totalDue ? totalCompleted / totalDue : 0,
    perfectDays: thirtyDayHistory.filter((day) => day.dueCount > 0 && day.completedCount === day.dueCount).length,
    weeklyHistory,
    habitBreakdown,
  } satisfies HabitAnalytics;
}

export async function getSetting<T>(db: SQLiteDatabase, key: string, defaultValue: T) {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);

  if (!row) {
    return defaultValue;
  }

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(db: SQLiteDatabase, key: string, value: T) {
  await db.runAsync(
    `
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    key,
    JSON.stringify(value)
  );
}

export async function getAppSettings(db: SQLiteDatabase) {
  await ensureDefaultSettings(db);

  return {
    hapticsEnabled: await getSetting(db, 'hapticsEnabled', defaultSettings.hapticsEnabled),
    compactLayout: await getSetting(db, 'compactLayout', defaultSettings.compactLayout),
    weekStartsOn: await getSetting(db, 'weekStartsOn', defaultSettings.weekStartsOn),
  };
}

export async function setAppSetting<Key extends keyof AppSettings>(
  db: SQLiteDatabase,
  key: Key,
  value: AppSettings[Key]
) {
  await setSetting(db, key, value);
}

export async function getUserProfile(db: SQLiteDatabase) {
  await ensureDefaultProfile(db);
  const row = await db.getFirstAsync<{
    display_name: string;
    subtitle: string;
    avatar_emoji: string;
    weekly_goal: number;
  }>('SELECT display_name, subtitle, avatar_emoji, weekly_goal FROM user_profile WHERE id = 1');

  return row
    ? {
        displayName: row.display_name,
        subtitle: row.subtitle,
        avatarEmoji: row.avatar_emoji,
        weeklyGoal: row.weekly_goal,
      }
    : defaultProfile;
}

export async function updateUserProfile(db: SQLiteDatabase, profile: UserProfile) {
  const normalized = {
    displayName: profile.displayName.trim() || defaultProfile.displayName,
    subtitle: profile.subtitle.trim() || defaultProfile.subtitle,
    avatarEmoji: profile.avatarEmoji.trim() || defaultProfile.avatarEmoji,
    weeklyGoal: Math.max(1, Math.min(99, Math.round(profile.weeklyGoal || defaultProfile.weeklyGoal))),
  };

  await db.runAsync(
    `
      INSERT INTO user_profile (id, display_name, subtitle, avatar_emoji, weekly_goal)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        subtitle = excluded.subtitle,
        avatar_emoji = excluded.avatar_emoji,
        weekly_goal = excluded.weekly_goal,
        updated_at = CURRENT_TIMESTAMP
    `,
    normalized.displayName,
    normalized.subtitle,
    normalized.avatarEmoji,
    normalized.weeklyGoal
  );

  return normalized;
}

export function isHabitDueOnDate(habit: Pick<Habit, 'customDays' | 'schedule' | 'startDate'>, date: string) {
  if (habit.startDate && date < habit.startDate) {
    return false;
  }

  const weekday = parseDateKey(date).getDay();

  switch (habit.schedule) {
    case 'weekdays':
      return weekday >= 1 && weekday <= 5;
    case 'weekends':
      return weekday === 0 || weekday === 6;
    case 'custom':
      return habit.customDays.includes(weekday);
    case 'daily':
    default:
      return true;
  }
}

async function listActiveHabits(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<HabitRow>(
    `
      SELECT
        id,
        title,
        description,
        emoji,
        color,
        category,
        schedule,
        custom_days,
        reminder_time,
        target_count,
        target_unit,
        start_date,
        sort_order,
        archived_at,
        created_at,
        updated_at
      FROM habits
      WHERE archived_at IS NULL
      ORDER BY sort_order ASC, created_at ASC
    `
  );

  return rows.map(mapHabitRow);
}

async function ensureHabitColumns(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ name: string }>('PRAGMA table_info(habits)');
  const columnNames = new Set(rows.map((row) => row.name));
  const columns = [
    ['category', "TEXT NOT NULL DEFAULT 'Wellness'"],
    ['schedule', "TEXT NOT NULL DEFAULT 'daily'"],
    ['custom_days', "TEXT NOT NULL DEFAULT '[]'"],
    ['reminder_time', 'TEXT'],
    ['target_count', 'INTEGER NOT NULL DEFAULT 1'],
    ['target_unit', "TEXT NOT NULL DEFAULT 'check-in'"],
    ['start_date', "TEXT NOT NULL DEFAULT ''"],
  ] as const;

  for (const [name, definition] of columns) {
    if (!columnNames.has(name)) {
      await db.execAsync(`ALTER TABLE habits ADD COLUMN ${name} ${definition}`);
    }
  }
}

async function ensureDefaultSettings(db: SQLiteDatabase) {
  await Promise.all(
    Object.entries(defaultSettings).map(([key, value]) =>
      db.runAsync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', key, JSON.stringify(value))
    )
  );
}

async function ensureDefaultProfile(db: SQLiteDatabase) {
  await db.runAsync(
    `
      INSERT OR IGNORE INTO user_profile (id, display_name, subtitle, avatar_emoji, weekly_goal)
      VALUES (1, ?, ?, ?, ?)
    `,
    defaultProfile.displayName,
    defaultProfile.subtitle,
    defaultProfile.avatarEmoji,
    defaultProfile.weeklyGoal
  );
}

async function seedStarterData(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM habits');

  if ((row?.count ?? 0) > 0) {
    return;
  }

  const starters: HabitInput[] = [
    {
      title: 'Morning Meditation',
      description: 'A quiet start before notifications.',
      emoji: '🧘',
      color: habitColors[0],
      category: 'Wellness',
      schedule: 'daily',
      customDays: [],
      reminderTime: '07:30 AM',
      targetCount: 1,
      targetUnit: 'session',
    },
    {
      title: 'Read 30 minutes',
      description: 'Any book, any chair, phone elsewhere.',
      emoji: '📚',
      color: habitColors[2],
      category: 'Learning',
      schedule: 'daily',
      customDays: [],
      reminderTime: '09:00 PM',
      targetCount: 30,
      targetUnit: 'minutes',
    },
    {
      title: 'Drink 8 glasses water',
      description: 'Keep the bottle on the desk.',
      emoji: '💧',
      color: habitColors[4],
      category: 'Health',
      schedule: 'daily',
      customDays: [],
      reminderTime: '10:00 AM',
      targetCount: 8,
      targetUnit: 'glasses',
    },
    {
      title: 'Exercise',
      description: 'Walk, run, cycle, or stretch.',
      emoji: '🏃',
      color: habitColors[1],
      category: 'Fitness',
      schedule: 'weekdays',
      customDays: [],
      reminderTime: '06:30 PM',
      targetCount: 25,
      targetUnit: 'minutes',
    },
  ];

  const today = formatDateKey(new Date());

  for (const [index, starter] of starters.entries()) {
    const habitId = await createHabit(db, starter);
    await db.runAsync('UPDATE habits SET start_date = ? WHERE id = ?', addDays(today, -17), habitId);

    for (let offset = 0; offset < 18; offset += 1) {
      const date = addDays(today, -offset);
      const shouldComplete =
        index === 0 ||
        (index === 1 && offset % 4 !== 1) ||
        (index === 2 && offset % 5 !== 2) ||
        (index === 3 && offset % 3 === 0);

      if (shouldComplete) {
        await db.runAsync('INSERT OR IGNORE INTO habit_completions (habit_id, date) VALUES (?, ?)', habitId, date);
      }
    }
  }
}

async function getCurrentStreak(db: SQLiteDatabase, habit: Habit, date: string) {
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM habit_completions WHERE habit_id = ? AND date <= ? ORDER BY date DESC',
    habit.id,
    date
  );
  const completedDates = new Set(rows.map((row) => row.date));
  let cursor = date;
  let streak = 0;
  let guard = 0;

  while (cursor >= habit.startDate && guard < 3660) {
    guard += 1;

    if (!isHabitDueOnDate(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }

    if (!completedDates.has(cursor)) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function normalizeHabitInput(input: HabitInput) {
  const fallbackIcon = habitIconOptions[0];
  const schedule: HabitFrequency = ['daily', 'weekdays', 'weekends', 'custom'].includes(input.schedule)
    ? input.schedule
    : 'daily';
  const customDays = input.customDays
    .map((day) => Math.round(day))
    .filter((day, index, days) => day >= 0 && day <= 6 && days.indexOf(day) === index);

  return {
    title: input.title.trim(),
    description: input.description.trim(),
    emoji: input.emoji.trim() || fallbackIcon.emoji,
    color: habitColors.includes(input.color) ? input.color : fallbackIcon.color,
    category: input.category.trim() || fallbackIcon.category,
    schedule,
    customDays: schedule === 'custom' ? customDays : [],
    reminderTime: input.reminderTime?.trim() || null,
    targetCount: Math.max(1, Math.min(999, Math.round(input.targetCount || 1))),
    targetUnit: input.targetUnit.trim() || 'check-in',
  };
}

function mapHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    color: row.color,
    category: row.category,
    schedule: parseSchedule(row.schedule),
    customDays: parseCustomDays(row.custom_days),
    reminderTime: row.reminder_time,
    targetCount: row.target_count,
    targetUnit: row.target_unit,
    startDate: row.start_date || formatDateKey(parseDateKey(row.created_at.slice(0, 10))),
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseSchedule(schedule: string): HabitFrequency {
  if (schedule === 'weekdays' || schedule === 'weekends' || schedule === 'custom') {
    return schedule;
  }

  return 'daily';
}

function parseCustomDays(value: string) {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    }
  } catch {
    return [];
  }

  return [];
}
