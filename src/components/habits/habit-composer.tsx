import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { HabitSymbolIcon, SymbolIcon } from '@/components/symbol-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  habitIconOptions,
  type HabitFrequency,
  type HabitInput,
  type HabitWithTodayStatus,
} from '@/lib/habits/database';

type HabitComposerProps = {
  habit?: HabitWithTodayStatus | null;
  submitLabel?: string;
  onArchive?: () => void;
  onCancel?: () => void;
  onSubmit: (input: HabitInput) => Promise<void>;
};

const defaultHabit: HabitInput = {
  title: '',
  description: '',
  emoji: habitIconOptions[0].emoji,
  color: habitIconOptions[0].color,
  category: habitIconOptions[0].category,
  schedule: 'daily',
  customDays: [],
  reminderTime: '09:56 PM',
  targetCount: 1,
  targetUnit: 'check-in',
};

const frequencyOptions: { label: string; value: HabitFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays', value: 'weekdays' },
  { label: 'Weekends', value: 'weekends' },
  { label: 'Custom', value: 'custom' },
];

const weekdays = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export function HabitComposer({
  habit,
  onArchive,
  onCancel,
  onSubmit,
  submitLabel = 'Save Habit',
}: HabitComposerProps) {
  const theme = useTheme();
  const [form, setForm] = useState<HabitInput>(defaultHabit);
  const [targetCount, setTargetCount] = useState(`${defaultHabit.targetCount}`);
  const [isSaving, setIsSaving] = useState(false);
  const canSave = form.title.trim().length > 0 && !isSaving;
  const selectedIconLabel = useMemo(
    () => habitIconOptions.find((option) => option.emoji === form.emoji)?.label ?? 'All In',
    [form.emoji]
  );

  useEffect(() => {
    const nextForm = habit
      ? {
          title: habit.title,
          description: habit.description,
          emoji: habit.emoji,
          color: habit.color,
          category: habit.category,
          schedule: habit.schedule,
          customDays: habit.customDays,
          reminderTime: habit.reminderTime,
          targetCount: habit.targetCount,
          targetUnit: habit.targetUnit,
        }
      : defaultHabit;

    setForm(nextForm);
    setTargetCount(`${nextForm.targetCount}`);
    setIsSaving(false);
  }, [habit]);

  const handleSubmit = async () => {
    if (!canSave) {
      return;
    }

    const parsedTarget = Number.parseInt(targetCount, 10);
    setIsSaving(true);

    try {
      await onSubmit({
        ...form,
        targetCount: Number.isFinite(parsedTarget) ? parsedTarget : 1,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.field}>
        <ThemedText type="default">Habit Name</ThemedText>
        <TextInput
          autoCapitalize="words"
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
          placeholder="e.g., Morning Meditation"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
            },
          ]}
          value={form.title}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="default">Choose Icon</ThemedText>
        <View style={styles.iconGrid}>
          {habitIconOptions.map((option) => {
            const selected = form.emoji === option.emoji;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.label}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    emoji: option.emoji,
                    category: option.category,
                    color: option.color,
                  }))
                }
                style={({ pressed }) => [
                  styles.iconCard,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
                    borderColor: selected ? theme.accent : theme.cardBorder,
                  },
                  pressed && styles.pressed,
                ]}>
                <HabitSymbolIcon color={option.color} symbol={option.emoji} size={29} />
                <ThemedText numberOfLines={1} type="small" style={styles.iconLabel}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText type="default">Frequency</ThemedText>
        <View style={styles.segmentGrid}>
          {frequencyOptions.map((option) => {
            const selected = form.schedule === option.value;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => setForm((current) => ({ ...current, schedule: option.value }))}
                style={({ pressed }) => [
                  styles.segment,
                  {
                    backgroundColor: selected ? theme.accent : theme.backgroundElement,
                    borderColor: selected ? theme.accent : theme.cardBorder,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="default" style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {form.schedule === 'custom' ? (
        <View style={styles.weekdayRow}>
          {weekdays.map((day) => {
            const selected = form.customDays.includes(day.value);

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={`${day.label}-${day.value}`}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    customDays: selected
                      ? current.customDays.filter((value) => value !== day.value)
                      : [...current.customDays, day.value].sort(),
                  }))
                }
                style={({ pressed }) => [
                  styles.dayChip,
                  {
                    backgroundColor: selected ? theme.accent : theme.backgroundElement,
                    borderColor: selected ? theme.accent : theme.cardBorder,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={selected && styles.segmentLabelSelected}>
                  {day.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.field}>
        <ThemedText type="default">Reminder Time</ThemedText>
        <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <SymbolIcon color={theme.textSecondary} name={{ ios: 'alarm', android: 'alarm', web: 'alarm' }} size={22} />
          <TextInput
            onChangeText={(reminderTime) => setForm((current) => ({ ...current, reminderTime }))}
            placeholder="09:56 PM"
            placeholderTextColor={theme.textSecondary}
            style={[styles.inlineInput, { color: theme.text }]}
            value={form.reminderTime ?? ''}
          />
        </View>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.fieldFlex}>
          <ThemedText type="default">Target</ThemedText>
          <TextInput
            inputMode="numeric"
            keyboardType="number-pad"
            onChangeText={setTargetCount}
            placeholder="1"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            value={targetCount}
          />
        </View>
        <View style={styles.fieldFlex}>
          <ThemedText type="default">Unit</ThemedText>
          <TextInput
            autoCapitalize="none"
            onChangeText={(targetUnit) => setForm((current) => ({ ...current, targetUnit }))}
            placeholder="check-in"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            value={form.targetUnit}
          />
        </View>
      </View>

      <View style={[styles.preview, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
        <View style={[styles.previewIcon, { backgroundColor: `${form.color}22` }]}>
          <HabitSymbolIcon color={form.color} symbol={form.emoji} size={31} />
        </View>
        <View style={styles.previewText}>
          <ThemedText type="smallBold">{form.title.trim() || 'New habit'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {selectedIconLabel} · {targetCount || 1} {form.targetUnit || 'check-in'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          disabled={!canSave}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.accent },
            !canSave && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="default" style={styles.primaryButtonText}>
            {isSaving ? 'Saving' : submitLabel}
          </ThemedText>
        </Pressable>

        <View style={styles.secondaryActions}>
          {onCancel ? (
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Cancel
              </ThemedText>
            </Pressable>
          ) : null}
          {onArchive ? (
            <Pressable onPress={onArchive} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.archiveText}>
                Archive
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  fieldFlex: {
    flex: 1,
    gap: Spacing.two,
  },
  input: {
    minHeight: 58,
    borderRadius: 29,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontWeight: 500,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  iconCard: {
    width: '23%',
    minWidth: 78,
    aspectRatio: 1,
    borderRadius: 15,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  iconLabel: {
    maxWidth: '88%',
  },
  segmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  segment: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  segmentLabel: {
    color: '#5F5A57',
  },
  segmentLabelSelected: {
    color: '#FFFFFF',
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    minHeight: 58,
    borderRadius: 29,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  inlineInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 600,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  preview: {
    minHeight: 78,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
  },
  previewIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    flex: 1,
    gap: Spacing.one,
  },
  actions: {
    gap: Spacing.two,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 29,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  archiveText: {
    color: '#EB5757',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
  },
});
