import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getTodayKey, parseDateKey } from '@/lib/habits/dates';
import { useHabitAnalytics } from '@/lib/habits/hooks';

export default function AnalyticsScreen() {
  const theme = useTheme();
  const today = useMemo(() => getTodayKey(), []);
  const { analytics, isLoading } = useHabitAnalytics(today);

  const todayPercent = analytics ? Math.round(analytics.todayRate * 100) : 0;
  const monthPercent = analytics ? Math.round(analytics.thirtyDayRate * 100) : 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText selectable type="small" themeColor="textSecondary">
              Momentum
            </ThemedText>
            <ThemedText selectable type="default" style={styles.headerTitle}>
              Analytics
            </ThemedText>
          </View>
          <View style={[styles.scoreBubble, { backgroundColor: theme.accentSoft }]}>
            <ThemedText selectable type="default" style={styles.scoreText}>
              {monthPercent}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard label="Today" value={`${analytics?.completedToday ?? 0}/${analytics?.dueToday ?? 0}`} sub={`${todayPercent}% done`} />
          <MetricCard label="Best streak" value={`${analytics?.bestStreak ?? 0}`} sub="days in a row" />
          <MetricCard label="Perfect days" value={`${analytics?.perfectDays ?? 0}`} sub="last 30 days" />
          <MetricCard label="Check-ins" value={`${analytics?.totalCompletions ?? 0}`} sub="all time" />
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <ThemedText selectable type="default" style={styles.sectionTitle}>
              Weekly rhythm
            </ThemedText>
            {isLoading ? (
              <ThemedText selectable type="small" themeColor="textSecondary">
                Loading
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.barChart}>
            {(analytics?.weeklyHistory ?? []).map((day) => {
              const label = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(parseDateKey(day.date));
              const height = Math.max(10, Math.round(day.completionRate * 120));

              return (
                <View style={styles.barColumn} key={day.date}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height, backgroundColor: day.completionRate >= 1 ? theme.accent : theme.accentWarm }]} />
                  </View>
                  <ThemedText selectable type="small" themeColor="textSecondary" style={styles.barLabel}>
                    {label.slice(0, 3)}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.focusCard, { backgroundColor: theme.accentSoft }]}>
          <ThemedText selectable type="default" themeColor="textSecondary">
            30 day completion
          </ThemedText>
          <ThemedText selectable type="subtitle" style={styles.focusNumber}>
            {monthPercent}%
          </ThemedText>
          <View style={[styles.progressTrack, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.progressFill, { width: `${monthPercent}%`, backgroundColor: theme.accent }]} />
          </View>
        </View>

        <View style={styles.breakdown}>
          <ThemedText selectable type="default" style={styles.sectionTitle}>
            Habit health
          </ThemedText>
          {(analytics?.habitBreakdown ?? []).map((habit) => (
            <View
              key={habit.habitId}
              style={[styles.breakdownRow, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
              <View style={[styles.habitIcon, { backgroundColor: `${habit.color}22` }]}>
                <ThemedText style={styles.habitEmoji}>{habit.emoji}</ThemedText>
              </View>
              <View style={styles.breakdownCopy}>
                <ThemedText selectable type="default" numberOfLines={1}>
                  {habit.title}
                </ThemedText>
                <ThemedText selectable type="small" themeColor="textSecondary">
                  {habit.completedCount}/{habit.dueCount} · {habit.currentStreak} day streak
                </ThemedText>
              </View>
              <ThemedText selectable type="default" style={styles.rateText}>
                {Math.round(habit.completionRate * 100)}%
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function MetricCard({ label, sub, value }: { label: string; sub: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
      <ThemedText selectable type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable type="subtitle" style={styles.metricValue}>
        {value}
      </ThemedText>
      <ThemedText selectable type="small" themeColor="textSecondary">
        {sub}
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
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  scoreBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    lineHeight: 28,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 126,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  metricValue: {
    fontSize: 32,
    lineHeight: 38,
  },
  chartCard: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  barChart: {
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  barTrack: {
    width: '100%',
    maxWidth: 36,
    height: 128,
    borderRadius: 18,
    backgroundColor: '#F3F0ED',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 18,
  },
  barLabel: {
    textAlign: 'center',
  },
  focusCard: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  focusNumber: {
    fontSize: 42,
    lineHeight: 48,
  },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    height: 14,
    borderRadius: 7,
  },
  breakdown: {
    gap: Spacing.two,
  },
  breakdownRow: {
    minHeight: 82,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
  },
  habitIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  breakdownCopy: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.one,
  },
  rateText: {
    fontVariant: ['tabular-nums'],
  },
});
