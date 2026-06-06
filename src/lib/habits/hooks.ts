import { useFocusEffect } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import {
  archiveHabit,
  addCustomHabitIcon,
  createHabit,
  getAppSettings,
  getCalendarMonth,
  getCustomHabitIcons,
  getHabitAnalytics,
  getUserProfile,
  type AppSettings,
  type HabitIconOption,
  type HabitAnalytics,
  type HabitHistoryDay,
  type HabitInput,
  type HabitWithTodayStatus,
  type UserProfile,
  listHabitsWithTodayStatus,
  setAppSetting,
  toggleHabitCompletion,
  updateHabit,
  updateUserProfile,
} from '@/lib/habits/database';
import { cancelHabitReminders, prepareHabitReminder, syncHabitReminders } from '@/lib/habits/notifications';

const HABIT_TABLES = ['habits', 'habit_completions'];
const SETTINGS_TABLES = ['settings'];
const PROFILE_TABLES = ['user_profile'];

export function useHabits(date: string) {
  const db = SQLite.useSQLiteContext();
  const [habits, setHabits] = useState<HabitWithTodayStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setHabits(await listHabitsWithTodayStatus(db, date));
    } finally {
      setIsLoading(false);
    }
  }, [date, db]);

  useLiveDatabaseReload(reload, HABIT_TABLES);

  return {
    habits,
    isLoading,
    reload,
    createHabit: async (input: HabitInput) => {
      await prepareHabitReminder(input);
      const habitId = await createHabit(db, input);
      await syncHabitReminders(db, habitId, input);
      await reload();
    },
    updateHabit: async (id: number, input: HabitInput) => {
      await prepareHabitReminder(input);
      await updateHabit(db, id, input);
      await syncHabitReminders(db, id, input);
      await reload();
    },
    archiveHabit: async (id: number) => {
      await cancelHabitReminders(db, id);
      await archiveHabit(db, id);
      await reload();
    },
    toggleHabitCompletion: async (habitId: number) => {
      const completed = await toggleHabitCompletion(db, habitId, date);
      await reload();
      return completed;
    },
  };
}

export function useCalendarMonth(visibleDate: string) {
  const db = SQLite.useSQLiteContext();
  const [days, setDays] = useState<HabitHistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setDays(await getCalendarMonth(db, visibleDate));
    } finally {
      setIsLoading(false);
    }
  }, [db, visibleDate]);

  useLiveDatabaseReload(reload, HABIT_TABLES);

  return { days, isLoading, reload };
}

export function useHabitAnalytics(date: string) {
  const db = SQLite.useSQLiteContext();
  const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setAnalytics(await getHabitAnalytics(db, date));
    } finally {
      setIsLoading(false);
    }
  }, [date, db]);

  useLiveDatabaseReload(reload, HABIT_TABLES);

  return { analytics, isLoading, reload };
}

export function useAppSettings() {
  const db = SQLite.useSQLiteContext();
  const [settings, setSettings] = useState<AppSettings>({
    hapticsEnabled: true,
    compactLayout: false,
    weekStartsOn: 'sunday',
  });
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setSettings(await getAppSettings(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useLiveDatabaseReload(reload, SETTINGS_TABLES);

  const updateSetting = useCallback(
    async <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
      await setAppSetting(db, key, value);
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [db]
  );

  return { settings, isLoading, reload, updateSetting };
}

export function useUserProfile() {
  const db = SQLite.useSQLiteContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setProfile(await getUserProfile(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useLiveDatabaseReload(reload, PROFILE_TABLES);

  const saveProfile = useCallback(
    async (nextProfile: UserProfile) => {
      const normalized = await updateUserProfile(db, nextProfile);
      setProfile(normalized);
      return normalized;
    },
    [db]
  );

  return { profile, isLoading, reload, saveProfile };
}

export function useCustomHabitIcons() {
  const db = SQLite.useSQLiteContext();
  const [icons, setIcons] = useState<HabitIconOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setIcons(await getCustomHabitIcons(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useLiveDatabaseReload(reload, SETTINGS_TABLES);

  const saveCustomIcon = useCallback(
    async (icon: HabitIconOption) => {
      const nextIcons = await addCustomHabitIcon(db, icon);
      setIcons(nextIcons);
      return nextIcons;
    },
    [db]
  );

  return { icons, isLoading, reload, saveCustomIcon };
}

function useLiveDatabaseReload(reload: () => Promise<void>, tableNames: string[]) {
  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    if (process.env.EXPO_OS === 'web') {
      return undefined;
    }

    const subscription = SQLite.addDatabaseChangeListener((event) => {
      if (tableNames.includes(event.tableName)) {
        reload();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [reload, tableNames]);
}
