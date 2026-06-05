import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { HabitSymbolIcon, SymbolIcon } from '@/components/symbol-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HabitWithTodayStatus } from '@/lib/habits/database';

type HabitCardProps = {
  habit: HabitWithTodayStatus;
  compact: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onEdit: () => void;
  onToggle: () => void;
};

export function HabitCard({ habit, compact, containerStyle, onEdit, onToggle }: HabitCardProps) {
  const theme = useTheme();

  const handleToggle = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onToggle();
  };

  return (
    <Pressable onPress={onEdit} style={({ pressed }) => [containerStyle, pressed && styles.pressed]}>
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          habit.completedToday && styles.cardComplete,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={[styles.emoji, { backgroundColor: `${habit.color}1F` }]}>
          <HabitSymbolIcon color={habit.color} symbol={habit.emoji} size={32} />
        </View>

        <View style={styles.content}>
          <ThemedText selectable type="default" numberOfLines={1} style={styles.title}>
            {habit.title}
          </ThemedText>
          <View style={styles.metaRow}>
            <SymbolIcon color="#FF7A45" name={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }} size={15} />
            <ThemedText selectable type="small" themeColor="textSecondary" style={styles.streak}>
              {habit.currentStreak} days
            </ThemedText>
            {habit.reminderTime ? (
              <ThemedText selectable type="small" themeColor="textSecondary" numberOfLines={1} style={styles.reminder}>
                · {habit.reminderTime}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: habit.completedToday }}
          disabled={!habit.isDueToday}
          onPress={handleToggle}
          style={[
            styles.checkButton,
            {
              borderColor: habit.completedToday ? theme.accent : theme.inactiveControl,
              backgroundColor: habit.completedToday ? theme.accent : 'transparent',
              opacity: habit.isDueToday ? 1 : 0.35,
            },
          ]}>
          {habit.completedToday ? (
            <SymbolIcon color="#FFFFFF" name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={19} />
          ) : null}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.72,
  },
  card: {
    minHeight: 84,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    boxShadow: '0 8px 22px rgba(46, 38, 31, 0.05)',
  },
  cardCompact: {
    minHeight: 72,
  },
  cardComplete: {
    opacity: 0.76,
  },
  emoji: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  streak: {
    fontVariant: ['tabular-nums'],
  },
  reminder: {
    flex: 1,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
