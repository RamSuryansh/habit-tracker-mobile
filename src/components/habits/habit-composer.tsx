import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { HabitSymbolIcon, SymbolIcon } from '@/components/symbol-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  habitColors,
  habitIconOptions,
  type HabitFrequency,
  type HabitIconOption,
  type HabitInput,
  type HabitWithTodayStatus,
} from '@/lib/habits/database';
import { useAppSettings, useCustomHabitIcons } from '@/lib/habits/hooks';

type HabitComposerProps = {
  habit?: HabitWithTodayStatus | null;
  submitLabel?: string;
  onArchive?: () => void;
  onCancel?: () => void;
  onSubmit: (input: HabitInput) => Promise<void>;
};

type ReminderTimeParts = {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
};

const defaultReminderTime = '09:00 PM';

const defaultHabit: HabitInput = {
  title: '',
  description: '',
  emoji: habitIconOptions[0].emoji,
  color: habitIconOptions[0].color,
  category: habitIconOptions[0].category,
  schedule: 'daily',
  customDays: [],
  reminderTime: null,
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
  { label: 'S', shortLabel: 'Sun', value: 0 },
  { label: 'M', shortLabel: 'Mon', value: 1 },
  { label: 'T', shortLabel: 'Tue', value: 2 },
  { label: 'W', shortLabel: 'Wed', value: 3 },
  { label: 'T', shortLabel: 'Thu', value: 4 },
  { label: 'F', shortLabel: 'Fri', value: 5 },
  { label: 'S', shortLabel: 'Sat', value: 6 },
];

export function HabitComposer({
  habit,
  onArchive,
  onCancel,
  onSubmit,
  submitLabel = 'Save Habit',
}: HabitComposerProps) {
  const theme = useTheme();
  const { settings } = useAppSettings();
  const { icons: customIcons, saveCustomIcon } = useCustomHabitIcons();
  const [form, setForm] = useState<HabitInput>(defaultHabit);
  const [targetCount, setTargetCount] = useState(`${defaultHabit.targetCount}`);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCustomIconOpen, setIsCustomIconOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customColor, setCustomColor] = useState(habitColors[0]);
  const [customIconError, setCustomIconError] = useState<string | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [wheelTime, setWheelTime] = useState<ReminderTimeParts>(() => parseReminderTime(defaultReminderTime));
  const allIconOptions = useMemo(() => [...habitIconOptions, ...customIcons], [customIcons]);
  const selectedIconLabel = useMemo(
    () => allIconOptions.find((option) => option.emoji === form.emoji)?.label ?? 'Custom',
    [allIconOptions, form.emoji]
  );
  const orderedWeekdays = useMemo(
    () => (settings.weekStartsOn === 'monday' ? [...weekdays.slice(1), weekdays[0]] : weekdays),
    [settings.weekStartsOn]
  );
  const hasCustomDays = form.schedule !== 'custom' || form.customDays.length > 0;
  const canSave = form.title.trim().length > 0 && hasCustomDays && !isSaving;
  const canSaveCustomIcon = customEmoji.trim().length > 0 && customLabel.trim().length > 0;

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
    setWheelTime(parseReminderTime(nextForm.reminderTime ?? defaultReminderTime));
    setSubmitError(null);
    setIsSaving(false);
  }, [habit]);

  const handleSubmit = async () => {
    if (!canSave) {
      return;
    }

    const parsedTarget = Number.parseInt(targetCount, 10);
    setIsSaving(true);
    setSubmitError(null);

    try {
      await onSubmit({
        ...form,
        targetCount: Number.isFinite(parsedTarget) ? parsedTarget : 1,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this habit.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectIcon = (option: HabitIconOption) => {
    setForm((current) => ({
      ...current,
      emoji: option.emoji,
      category: option.category,
      color: option.color,
    }));
    setIsCustomIconOpen(false);
    setCustomIconError(null);
  };

  const handleSaveCustomIcon = async () => {
    if (!canSaveCustomIcon) {
      setCustomIconError('Add both an emoji and label.');
      return;
    }

    const nextIcon: HabitIconOption = {
      emoji: customEmoji.trim(),
      label: customLabel.trim(),
      category: 'Custom',
      color: customColor,
      isCustom: true,
    };

    try {
      await saveCustomIcon(nextIcon);
      selectIcon(nextIcon);
      setCustomEmoji('');
      setCustomLabel('');
      setCustomColor(habitColors[0]);
    } catch (error) {
      setCustomIconError(error instanceof Error ? error.message : 'Could not save this custom icon.');
    }
  };

  const toggleReminder = (enabled: boolean) => {
    if (!enabled) {
      setForm((current) => ({ ...current, reminderTime: null }));
      setIsTimePickerOpen(false);
      return;
    }

    const nextTime = form.reminderTime ?? defaultReminderTime;
    setWheelTime(parseReminderTime(nextTime));
    setForm((current) => ({ ...current, reminderTime: nextTime }));
    setIsTimePickerOpen(true);
  };

  const openTimePicker = () => {
    setWheelTime(parseReminderTime(form.reminderTime ?? defaultReminderTime));
    setIsTimePickerOpen(true);
  };

  const applyWheelTime = () => {
    setForm((current) => ({ ...current, reminderTime: formatReminderTime(wheelTime) }));
    setIsTimePickerOpen(false);
  };

  const cancelWheelTime = () => {
    setWheelTime(parseReminderTime(form.reminderTime ?? defaultReminderTime));
    setIsTimePickerOpen(false);
  };

  const updateSchedule = (schedule: HabitFrequency) => {
    setForm((current) => ({
      ...current,
      schedule,
      customDays: schedule === 'custom' ? current.customDays : [],
    }));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.field}>
        <ThemedText type="default">Habit Name</ThemedText>
        <TextInput
          autoCapitalize="words"
          onChangeText={(title) => {
            setSubmitError(null);
            setForm((current) => ({ ...current, title }));
          }}
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
          {allIconOptions.map((option) => {
            const selected = form.emoji === option.emoji;

            return (
              <IconOptionCard
                key={`${option.emoji}-${option.label}`}
                option={option}
                selected={selected}
                onPress={() => selectIcon(option)}
              />
            );
          })}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isCustomIconOpen }}
            onPress={() => setIsCustomIconOpen((current) => !current)}
            style={({ pressed }) => [
              styles.iconCard,
              {
                backgroundColor: isCustomIconOpen ? theme.accentSoft : theme.backgroundElement,
                borderColor: isCustomIconOpen ? theme.accent : theme.cardBorder,
              },
              pressed && styles.pressed,
            ]}>
            <View style={styles.iconStack}>
              <View style={styles.iconGlyphSlot}>
                <SymbolIcon color={theme.accent} name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }} size={30} />
              </View>
              <ThemedText numberOfLines={1} type="smallBold" style={styles.iconLabel}>
                Custom
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {isCustomIconOpen ? (
          <View style={[styles.customIconPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
            <View style={styles.customIconPreviewRow}>
              <View style={[styles.customIconPreview, { backgroundColor: `${customColor}24` }]}>
                <ThemedText style={styles.customEmojiPreview}>{customEmoji.trim() || '+'}</ThemedText>
              </View>
              <View style={styles.customIconInputs}>
                <TextInput
                  autoCapitalize="none"
                  maxLength={8}
                  onChangeText={(value) => {
                    setCustomIconError(null);
                    setCustomEmoji(value);
                  }}
                  placeholder="Emoji"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.compactInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={customEmoji}
                />
                <TextInput
                  autoCapitalize="words"
                  maxLength={24}
                  onChangeText={(value) => {
                    setCustomIconError(null);
                    setCustomLabel(value);
                  }}
                  placeholder="Label"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.compactInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={customLabel}
                />
              </View>
            </View>

            <View style={styles.colorRow}>
              {habitColors.map((color) => {
                const selected = color === customColor;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={color}
                    onPress={() => setCustomColor(color)}
                    style={[
                      styles.colorSwatchOuter,
                      {
                        borderColor: selected ? theme.accent : 'transparent',
                      },
                    ]}>
                    <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                  </Pressable>
                );
              })}
            </View>

            {customIconError ? (
              <ThemedText type="small" style={styles.errorText}>
                {customIconError}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!canSaveCustomIcon}
              onPress={handleSaveCustomIcon}
              style={({ pressed }) => [
                styles.inlineSaveButton,
                { backgroundColor: theme.accent },
                !canSaveCustomIcon && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.inlineSaveText}>
                Save icon
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
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
                onPress={() => updateSchedule(option.value)}
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
        <View style={[styles.repeatPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <View style={styles.repeatHeader}>
            <ThemedText type="smallBold">Repeat on</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {form.customDays.length ? `${form.customDays.length} selected` : 'Choose days'}
            </ThemedText>
          </View>
          <View style={styles.weekdayRow}>
            {orderedWeekdays.map((day) => {
              const selected = form.customDays.includes(day.value);

              return (
                <Pressable
                  accessibilityLabel={day.shortLabel}
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
                      backgroundColor: selected ? theme.accent : theme.inputBackground,
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
          {!hasCustomDays ? (
            <ThemedText type="small" style={styles.errorText}>
              Select at least one day for a custom frequency.
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.field}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText type="default">Reminder Time</ThemedText>
          <Switch
            ios_backgroundColor={theme.inactiveControl}
            onValueChange={toggleReminder}
            thumbColor={form.reminderTime ? theme.accent : theme.backgroundElement}
            trackColor={{ false: theme.inactiveControl, true: theme.accentSoft }}
            value={Boolean(form.reminderTime)}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!form.reminderTime}
          onPress={openTimePicker}
          style={({ pressed }) => [
            styles.inputRow,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: form.reminderTime ? theme.cardBorder : theme.inputBackground,
              opacity: form.reminderTime ? 1 : 0.58,
            },
            pressed && styles.pressed,
          ]}>
          <SymbolIcon color={theme.textSecondary} name={{ ios: 'alarm', android: 'alarm', web: 'alarm' }} size={22} />
          <ThemedText type="default" style={styles.reminderValue}>
            {form.reminderTime ?? 'Off'}
          </ThemedText>
          <SymbolIcon color={theme.textSecondary} name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} size={20} />
        </Pressable>

        {isTimePickerOpen ? (
          <View style={[styles.timePickerPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
            <View style={styles.timeWheel}>
              <WheelColumn
                label="Hour"
                onNext={() => setWheelTime((current) => ({ ...current, hour: wrapValue(current.hour + 1, 1, 12) }))}
                onPrevious={() => setWheelTime((current) => ({ ...current, hour: wrapValue(current.hour - 1, 1, 12) }))}
                value={`${wheelTime.hour}`}
              />
              <WheelColumn
                label="Minute"
                onNext={() =>
                  setWheelTime((current) => ({ ...current, minute: wrapValue(current.minute + 1, 0, 59) }))
                }
                onPrevious={() =>
                  setWheelTime((current) => ({ ...current, minute: wrapValue(current.minute - 1, 0, 59) }))
                }
                value={String(wheelTime.minute).padStart(2, '0')}
              />
              <WheelColumn
                label="Period"
                onNext={() =>
                  setWheelTime((current) => ({ ...current, period: current.period === 'AM' ? 'PM' : 'AM' }))
                }
                onPrevious={() =>
                  setWheelTime((current) => ({ ...current, period: current.period === 'AM' ? 'PM' : 'AM' }))
                }
                value={wheelTime.period}
              />
            </View>
            <View style={styles.timeActions}>
              <Pressable onPress={cancelWheelTime} style={({ pressed }) => [styles.timeActionButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={applyWheelTime}
                style={({ pressed }) => [
                  styles.timeActionButton,
                  styles.timeDoneButton,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={styles.inlineSaveText}>
                  Done
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
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

      {submitError ? (
        <ThemedText type="small" style={styles.errorText}>
          {submitError}
        </ThemedText>
      ) : null}

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

function IconOptionCard({
  onPress,
  option,
  selected,
}: {
  onPress: () => void;
  option: HabitIconOption;
  selected: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconCard,
        {
          backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.cardBorder,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.iconStack}>
        <View style={styles.iconGlyphSlot}>
          <HabitSymbolIcon color={option.color} symbol={option.emoji} size={30} />
        </View>
        <ThemedText numberOfLines={1} type="smallBold" style={styles.iconLabel}>
          {option.label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function WheelColumn({
  label,
  onNext,
  onPrevious,
  value,
}: {
  label: string;
  onNext: () => void;
  onPrevious: () => void;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wheelColumn}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable accessibilityRole="button" onPress={onPrevious} style={({ pressed }) => [styles.wheelButton, pressed && styles.pressed]}>
        <SymbolIcon color={theme.textSecondary} name={{ ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }} size={20} />
      </Pressable>
      <View style={[styles.wheelValueFrame, { backgroundColor: theme.inputBackground }]}>
        <ThemedText type="subtitle" style={styles.wheelValue}>
          {value}
        </ThemedText>
      </View>
      <Pressable accessibilityRole="button" onPress={onNext} style={({ pressed }) => [styles.wheelButton, pressed && styles.pressed]}>
        <SymbolIcon color={theme.textSecondary} name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} size={20} />
      </Pressable>
    </View>
  );
}

function parseReminderTime(value: string): ReminderTimeParts {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) {
    return { hour: 9, minute: 0, period: 'PM' };
  }

  return {
    hour: Math.max(1, Math.min(12, Number.parseInt(match[1], 10))),
    minute: Math.max(0, Math.min(59, Number.parseInt(match[2], 10))),
    period: match[3].toUpperCase() === 'AM' ? 'AM' : 'PM',
  };
}

function formatReminderTime(time: ReminderTimeParts) {
  return `${time.hour}:${String(time.minute).padStart(2, '0')} ${time.period}`;
}

function wrapValue(value: number, min: number, max: number) {
  if (value > max) {
    return min;
  }

  if (value < min) {
    return max;
  }

  return value;
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
    fontWeight: '600',
  },
  compactInput: {
    minHeight: 48,
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    fontWeight: '600',
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
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two,
    boxShadow: '0 5px 14px rgba(46, 38, 31, 0.04)',
  },
  iconStack: {
    height: 68,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  iconGlyphSlot: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    maxWidth: '94%',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  customIconPanel: {
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  customIconPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  customIconPreview: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customEmojiPreview: {
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
  },
  customIconInputs: {
    flex: 1,
    gap: Spacing.two,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  colorSwatchOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  inlineSaveButton: {
    minHeight: 46,
    borderRadius: 23,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSaveText: {
    color: '#FFFFFF',
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
  repeatPanel: {
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  repeatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dayChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
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
  reminderValue: {
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  timePickerPanel: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  timeWheel: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  wheelButton: {
    width: '100%',
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelValueFrame: {
    width: '100%',
    minHeight: 54,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelValue: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  timeActionButton: {
    minHeight: 42,
    borderRadius: 21,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  timeDoneButton: {
    minWidth: 92,
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
    fontWeight: '700',
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
  errorText: {
    color: '#EB5757',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
  },
});
