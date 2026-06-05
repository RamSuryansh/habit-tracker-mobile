import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HabitCard } from '@/components/habits/habit-card';
import { HabitSymbolIcon, SymbolIcon } from '@/components/symbol-icon';
import { HabitFormModal } from '@/components/habits/habit-form-modal';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HabitInput, HabitWithTodayStatus } from '@/lib/habits/database';
import { getTodayKey, parseDateKey } from '@/lib/habits/dates';
import { useAppSettings, useHabits } from '@/lib/habits/hooks';

const dayFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric' });
const headerDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

function openNewHabit() {
  router.push('/new-habit');
}

export default function HomeScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const today = getTodayKey();
  const { settings } = useAppSettings();
  const { archiveHabit, createHabit, habits, isLoading, toggleHabitCompletion, updateHabit } =
    useHabits(today);
  const [selectedHabit, setSelectedHabit] = useState<HabitWithTodayStatus | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const dueHabits = habits.filter((habit) => habit.isDueToday);
  const completedCount = dueHabits.filter((habit) => habit.completedToday).length;
  const progress = dueHabits.length ? completedCount / dueHabits.length : 0;
  const bestStreak = Math.max(0, ...habits.map((habit) => habit.currentStreak));
  const nextReminder = dueHabits.find((habit) => habit.reminderTime)?.reminderTime ?? 'Today';
  const isWide = width >= 760;
  const todayDate = parseDateKey(today);
  const dayOfMonth = dayFormatter.format(todayDate);
  const displayDate = headerDateFormatter.format(todayDate);

  const openHabit = (habit: HabitWithTodayStatus) => {
    setSelectedHabit(habit);
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setSelectedHabit(null);
    setIsFormVisible(false);
  };

  const handleSubmit = async (input: HabitInput) => {
    if (selectedHabit) {
      await updateHabit(selectedHabit.id, input);
    } else {
      await createHabit(input);
    }

    closeForm();
  };

  const handleArchive = async (habitId: number) => {
    await archiveHabit(habitId);
    closeForm();
  };

  const handleToggle = async (habitId: number) => {
    await toggleHabitCompletion(habitId);

    if (settings.hapticsEnabled && Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    }
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.circleButton}>
              <CalendarDateIcon day={dayOfMonth} />
            </View>

            <View style={styles.headerText}>
              <ThemedText selectable type="small" themeColor="textSecondary">
                {displayDate}
              </ThemedText>
              <ThemedText selectable type="default" style={styles.headerTitle}>
                {"Today's Habits"}
              </ThemedText>
            </View>

            <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
              <SymbolIcon
                color={theme.accent}
                name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
                size={36}
              />
            </View>
          </View>

          <View style={[styles.progressCard, { backgroundColor: theme.accentSoft }]}>
            <View style={styles.progressCopy}>
              <ThemedText selectable type="small" themeColor="textSecondary">
                Daily Progress
              </ThemedText>
              <ThemedText selectable type="subtitle" style={styles.progressTitle}>
                {completedCount}/{dueHabits.length} completed
              </ThemedText>
              <View style={styles.streakRow}>
                <SymbolIcon color={theme.accentWarm} name={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }} size={22} />
                <ThemedText selectable type="default" themeColor="textSecondary">
                  Best streak: {bestStreak} days
                </ThemedText>
              </View>
            </View>
            <ProgressDial progress={progress} />
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryTile, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
              <ThemedText selectable type="default" themeColor="textSecondary">
                Deadline
              </ThemedText>
              <SymbolIcon color={theme.text} name={{ ios: 'calendar.badge.clock', android: 'calendar_clock', web: 'calendar_clock' }} size={34} />
              <ThemedText selectable type="default">
                {nextReminder}
              </ThemedText>
            </View>

            <View style={[styles.summaryTile, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
              <ThemedText selectable type="default" themeColor="textSecondary">
                Habits
              </ThemedText>
              <HabitPreview habits={dueHabits} />
            </View>
          </View>

          <View style={styles.listHeader}>
            <ThemedText selectable type="default" style={styles.sectionTitle}>
              Today
            </ThemedText>
          </View>

          <View style={[styles.list, isWide && styles.listWide]}>
            {isLoading ? (
              <ThemedText selectable themeColor="textSecondary">
                Loading habits...
              </ThemedText>
            ) : habits.length ? (
              habits.map((habit) => (
                <HabitCard
                  compact={settings.compactLayout}
                  containerStyle={isWide ? styles.wideHabitCard : undefined}
                  habit={habit}
                  key={habit.id}
                  onEdit={() => openHabit(habit)}
                  onToggle={() => handleToggle(habit.id)}
                />
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
                <ThemedText selectable type="subtitle" style={styles.emptyTitle}>
                  Start small.
                </ThemedText>
                <ThemedText selectable themeColor="textSecondary" style={styles.emptyBody}>
                  Add one habit with an icon, cadence, reminder, and target. Your progress appears here in real time.
                </ThemedText>
                <Pressable onPress={openNewHabit} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.emptyButtonText}>
                    Add habit
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <HabitFormModal
        habit={selectedHabit}
        onArchive={handleArchive}
        onClose={closeForm}
        onSubmit={handleSubmit}
        visible={isFormVisible}
      />
    </>
  );
}

function CalendarDateIcon({ day }: { day: string }) {
  const theme = useTheme();

  return (
    <View accessibilityLabel={`Today is ${day}`} style={[styles.calendarIcon, { borderColor: theme.text }]}>
      <View style={styles.calendarBindingRow}>
        <View style={[styles.calendarBinding, { backgroundColor: theme.text }]} />
        <View style={[styles.calendarBinding, { backgroundColor: theme.text }]} />
      </View>
      <View style={[styles.calendarHeaderRule, { backgroundColor: theme.text }]} />
      <View style={styles.calendarDayFrame}>
        <ThemedText selectable={false} type="smallBold" style={[styles.calendarDay, { color: theme.text }]}>
          {day}
        </ThemedText>
      </View>
    </View>
  );
}

function HabitPreview({ habits }: { habits: HabitWithTodayStatus[] }) {
  const theme = useTheme();
  const visibleHabits = habits.length > 3 ? habits.slice(0, 2) : habits.slice(0, 3);
  const moreCount = habits.length > 3 ? habits.length - 2 : 0;

  if (!habits.length) {
    return (
      <ThemedText selectable type="small" themeColor="textSecondary" style={styles.habitPreviewEmpty}>
        No habits due
      </ThemedText>
    );
  }

  return (
    <View style={styles.habitPreviewList}>
      {visibleHabits.map((habit) => (
        <View key={habit.id} style={styles.habitPreviewItem}>
          <View style={[styles.habitPreviewIcon, { backgroundColor: `${habit.color}1F` }]}>
            <HabitSymbolIcon color={habit.color} symbol={habit.emoji} size={19} />
          </View>
          <ThemedText selectable type="small" numberOfLines={1} style={styles.habitPreviewTitle}>
            {habit.title}
          </ThemedText>
        </View>
      ))}

      {moreCount ? (
        <View style={[styles.moreHabitsPill, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText selectable type="smallBold" style={[styles.moreHabitsText, { color: theme.accent }]}>
            +{moreCount} more
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function ProgressDial({ progress }: { progress: number }) {
  const theme = useTheme();
  const percentage = Math.round(progress * 100);

  return (
    <View
      style={[
        styles.progressDial,
        {
          borderColor: '#F2E5DC',
          borderTopColor: theme.accentWarm,
          borderRightColor: theme.accent,
          borderBottomColor: progress > 0.52 ? theme.accent : '#F2E5DC',
        },
      ]}>
      <ThemedText selectable type="default" style={styles.progressPercent}>
        {percentage}%
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(46, 38, 31, 0.05)',
  },
  calendarDay: {
    fontSize: 13,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    textAlign: 'center',
  },
  calendarIcon: {
    width: 34,
    height: 34,
    borderRadius: 5,
    borderWidth: 3,
    borderCurve: 'continuous',
  },
  calendarBindingRow: {
    position: 'absolute',
    top: -6,
    left: 6,
    right: 6,
    height: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarBinding: {
    width: 4,
    height: 10,
    borderRadius: 2,
  },
  calendarHeaderRule: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 3,
  },
  calendarDayFrame: {
    position: 'absolute',
    top: 11,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    minHeight: 166,
    borderRadius: 24,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  progressCopy: {
    flex: 1,
    gap: Spacing.two,
  },
  progressTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  progressDial: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '18deg' }],
  },
  progressPercent: {
    fontSize: 28,
    lineHeight: 34,
    transform: [{ rotate: '-18deg' }],
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summaryTile: {
    flex: 1,
    minHeight: 142,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  habitPreviewList: {
    width: '100%',
    gap: Spacing.one,
  },
  habitPreviewItem: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  habitPreviewIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitPreviewTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
  },
  habitPreviewEmpty: {
    textAlign: 'center',
  },
  moreHabitsPill: {
    minHeight: 28,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    alignSelf: 'flex-start',
  },
  moreHabitsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  list: {
    gap: Spacing.two,
  },
  listWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wideHabitCard: {
    width: '49%',
  },
  emptyState: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyTitle: {
    fontSize: 30,
  },
  emptyBody: {
    maxWidth: 360,
  },
  emptyButton: {
    minHeight: 50,
    borderRadius: 25,
    borderCurve: 'continuous',
    backgroundColor: '#FF6F61',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    alignSelf: 'flex-start',
  },
  emptyButtonText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.72,
  },
});
