import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HabitCard } from '@/components/habits/habit-card';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, getTodayKey, parseDateKey } from '@/lib/habits/dates';
import { useAppSettings, useCalendarMonth, useHabits } from '@/lib/habits/hooks';

const weekdaysSunday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdaysMonday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarScreen() {
  const theme = useTheme();
  const today = useMemo(() => getTodayKey(), []);
  const [visibleDate, setVisibleDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const { settings } = useAppSettings();
  const { days, isLoading } = useCalendarMonth(visibleDate);
  const { habits, toggleHabitCompletion } = useHabits(selectedDate);

  const visibleMonth = parseDateKey(visibleDate);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(visibleMonth);
  const weekLabels = settings.weekStartsOn === 'monday' ? weekdaysMonday : weekdaysSunday;
  const leadingCells = days.length ? getLeadingCells(days[0].date, settings.weekStartsOn) : 0;
  const perfectDays = days.filter((day) => day.dueCount > 0 && day.completedCount === day.dueCount).length;
  const dueDays = days.filter((day) => day.dueCount > 0).length;
  const monthCompleted = days.reduce((sum, day) => sum + day.completedCount, 0);
  const monthDue = days.reduce((sum, day) => sum + day.dueCount, 0);
  const selectedReadable = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(parseDateKey(selectedDate));

  const moveMonth = (amount: number) => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1);
    const nextKey = formatDateKey(next);

    setVisibleDate(nextKey);
    setSelectedDate(nextKey);
  };

  const handleToggle = async (habitId: number) => {
    await toggleHabitCompletion(habitId);

    if (settings.hapticsEnabled && Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedDate(today)} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
            <ThemedText type="subtitle" style={styles.headerIcon}>
              ‹
            </ThemedText>
          </Pressable>
          <ThemedText selectable type="default" style={styles.headerTitle}>
            Calendar
          </ThemedText>
          <View style={styles.circleButton}>
            <ThemedText type="subtitle" style={styles.headerIcon}>
              ⋮
            </ThemedText>
          </View>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <View style={styles.monthHeader}>
            <ThemedText selectable type="default" style={styles.monthTitle}>
              {monthLabel}
            </ThemedText>
            <View style={styles.monthActions}>
              <Pressable onPress={() => moveMonth(-1)} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}>
                <ThemedText type="subtitle" style={styles.monthArrow}>
                  ‹
                </ThemedText>
              </Pressable>
              <Pressable onPress={() => moveMonth(1)} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}>
                <ThemedText type="subtitle" style={styles.monthArrow}>
                  ›
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.weekRow}>
            {weekLabels.map((label) => (
              <ThemedText selectable type="default" themeColor="textSecondary" style={styles.weekLabel} key={label}>
                {label}
              </ThemedText>
            ))}
          </View>

          <View style={styles.dayGrid}>
            {Array.from({ length: leadingCells }).map((_, index) => (
              <View style={styles.dayCell} key={`empty-${index}`} />
            ))}
            {days.map((day) => (
              <CalendarDay
                day={day}
                isSelected={day.date === selectedDate}
                key={day.date}
                onPress={() => setSelectedDate(day.date)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <ThemedText selectable type="default" themeColor="textSecondary">
            Completed
          </ThemedText>
          <ThemedText selectable type="subtitle" style={styles.summaryNumber}>
            {perfectDays}/{dueDays} days
          </ThemedText>
          <ThemedText selectable type="default" themeColor="textSecondary">
            {monthDue ? Math.round((monthCompleted / monthDue) * 100) : 0}% completion rate
          </ThemedText>
        </View>

        <View style={styles.legend}>
          <ThemedText selectable type="default" style={styles.sectionTitle}>
            Legend
          </ThemedText>
          <LegendDot label="Completed" color="#FFF0E8" />
          <LegendDot label="Missed" color="#FF9A72" />
        </View>

        <View style={styles.listHeader}>
          <ThemedText selectable type="default" style={styles.sectionTitle}>
            {selectedReadable}
          </ThemedText>
          {isLoading ? (
            <ThemedText selectable type="small" themeColor="textSecondary">
              Loading
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.list}>
          {habits.length ? (
            habits.map((habit) => (
              <HabitCard
                compact={settings.compactLayout}
                habit={habit}
                key={habit.id}
                onEdit={() => {}}
                onToggle={() => handleToggle(habit.id)}
              />
            ))
          ) : (
            <ThemedText selectable themeColor="textSecondary">
              No habits yet for this day.
            </ThemedText>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function CalendarDay({
  day,
  isSelected,
  onPress,
}: {
  day: { date: string; dueCount: number; completedCount: number; completionRate: number };
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const date = parseDateKey(day.date).getDate();
  const isComplete = day.dueCount > 0 && day.completedCount === day.dueCount;
  const isPartial = day.completedCount > 0 && !isComplete;
  const isMissed = day.dueCount > 0 && day.completedCount === 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.dayCell, pressed && styles.pressed]}>
      <View
        style={[
          styles.dayBubble,
          {
            backgroundColor: isSelected
              ? theme.accent
              : isComplete
                ? theme.accentSoft
                : isPartial
                  ? '#FFD9C8'
                  : isMissed
                    ? '#F3F0ED'
                    : 'transparent',
          },
        ]}>
        <ThemedText type="smallBold" style={isSelected && styles.selectedDayText}>
          {`${date}`.padStart(2, '0')}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText selectable type="default" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function getLeadingCells(date: string, weekStartsOn: 'monday' | 'sunday') {
  const day = parseDateKey(date).getDay();

  if (weekStartsOn === 'monday') {
    return day === 0 ? 6 : day - 1;
  }

  return day;
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
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    lineHeight: 38,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
  },
  calendarCard: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  monthTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  monthActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrow: {
    lineHeight: 34,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    minHeight: 140,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  summaryNumber: {
    fontSize: 36,
    lineHeight: 42,
  },
  legend: {
    gap: Spacing.two,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  legendDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  list: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.72,
  },
});
