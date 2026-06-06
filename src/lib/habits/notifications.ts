import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  clearHabitNotificationIds,
  listHabitNotificationIds,
  replaceHabitNotificationIds,
  type HabitInput,
} from '@/lib/habits/database';

const HABIT_REMINDER_CHANNEL_ID = 'habit-reminders';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

export class HabitReminderPermissionError extends Error {
  constructor() {
    super('Notification permission is needed to enable this reminder.');
    this.name = 'HabitReminderPermissionError';
  }
}

export class HabitReminderUnavailableError extends Error {
  constructor() {
    super('Reminders need a development build on Android. Turn reminders off to save this habit in Expo Go.');
    this.name = 'HabitReminderUnavailableError';
  }
}

export function configureHabitNotifications() {
  if (process.env.EXPO_OS === 'web') {
    return;
  }

  getNotificationsModule().then((notifications) => {
    if (!notifications) {
      return;
    }

    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (process.env.EXPO_OS === 'android') {
      notifications
        .setNotificationChannelAsync(HABIT_REMINDER_CHANNEL_ID, {
          name: 'Habit reminders',
          importance: notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#FF6F61',
        })
        .catch(() => {
          // Channel creation is best-effort; scheduling still reports permission errors on save.
        });
    }
  });
}

export async function cancelHabitReminders(db: SQLiteDatabase, habitId: number) {
  if (process.env.EXPO_OS !== 'web') {
    const notifications = await getNotificationsModule();
    const notificationIds = await listHabitNotificationIds(db, habitId);

    if (notifications) {
      await Promise.all(
        notificationIds.map((notificationId) =>
          notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined)
        )
      );
    }
  }

  await clearHabitNotificationIds(db, habitId);
}

export async function prepareHabitReminder(input: HabitInput) {
  if (!input.reminderTime || process.env.EXPO_OS === 'web') {
    return;
  }

  const notifications = await getNotificationsModule();

  if (!notifications) {
    throw new HabitReminderUnavailableError();
  }

  const permissionGranted = await ensureNotificationPermission(notifications);

  if (!permissionGranted) {
    throw new HabitReminderPermissionError();
  }
}

export async function syncHabitReminders(db: SQLiteDatabase, habitId: number, input: HabitInput) {
  await cancelHabitReminders(db, habitId);

  if (!input.reminderTime || process.env.EXPO_OS === 'web') {
    return;
  }

  const notifications = await getNotificationsModule();

  if (!notifications) {
    throw new HabitReminderUnavailableError();
  }

  const reminderTime = parseReminderTime(input.reminderTime);
  const notificationIds: string[] = [];

  if (input.schedule === 'daily') {
    notificationIds.push(
      await notifications.scheduleNotificationAsync({
        content: getReminderContent(habitId, input),
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: HABIT_REMINDER_CHANNEL_ID,
          hour: reminderTime.hour,
          minute: reminderTime.minute,
        },
      })
    );
  } else {
    for (const weekday of getReminderWeekdays(input)) {
      notificationIds.push(
        await notifications.scheduleNotificationAsync({
          content: getReminderContent(habitId, input),
          trigger: {
            type: notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId: HABIT_REMINDER_CHANNEL_ID,
            weekday: weekday + 1,
            hour: reminderTime.hour,
            minute: reminderTime.minute,
          },
        })
      );
    }
  }

  await replaceHabitNotificationIds(db, habitId, notificationIds);
}

async function getNotificationsModule() {
  if (!canUseNotificationsModule()) {
    return null;
  }

  notificationsModulePromise ??= import('expo-notifications')
    .then((notifications) =>
      typeof notifications.setNotificationHandler === 'function' &&
      typeof notifications.scheduleNotificationAsync === 'function'
        ? notifications
        : null
    )
    .catch(() => null);

  return notificationsModulePromise;
}

function canUseNotificationsModule() {
  if (process.env.EXPO_OS === 'web') {
    return false;
  }

  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    (Constants.executionEnvironment === ExecutionEnvironment.StoreClient && Boolean(Constants.expoGoConfig));

  return !isExpoGo;
}

async function ensureNotificationPermission(notifications: NotificationsModule) {
  const existingPermission = await notifications.getPermissionsAsync();

  if (existingPermission.granted || existingPermission.status === 'granted') {
    return true;
  }

  const requestedPermission = await notifications.requestPermissionsAsync();
  return requestedPermission.granted || requestedPermission.status === 'granted';
}

function getReminderContent(habitId: number, input: HabitInput) {
  const title = input.title.trim() || 'Habit reminder';

  return {
    title: `${input.emoji} ${title}`,
    body: `Time for ${title}.`,
    data: {
      habitId,
      url: '/',
    },
  };
}

function getReminderWeekdays(input: HabitInput) {
  if (input.schedule === 'weekdays') {
    return [1, 2, 3, 4, 5];
  }

  if (input.schedule === 'weekends') {
    return [0, 6];
  }

  return input.customDays;
}

function parseReminderTime(reminderTime: string) {
  const match = reminderTime.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) {
    return { hour: 9, minute: 0 };
  }

  const [, hourPart, minutePart, periodPart] = match;
  const period = periodPart.toUpperCase();
  const hour12 = Math.max(1, Math.min(12, Number.parseInt(hourPart, 10)));
  const minute = Math.max(0, Math.min(59, Number.parseInt(minutePart, 10)));
  const hour = period === 'AM' ? hour12 % 12 : (hour12 % 12) + 12;

  return { hour, minute };
}
