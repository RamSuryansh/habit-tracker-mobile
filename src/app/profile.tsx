import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserProfile } from '@/lib/habits/database';
import { getTodayKey } from '@/lib/habits/dates';
import { useAppSettings, useHabitAnalytics, useUserProfile } from '@/lib/habits/hooks';

export default function ProfileScreen() {
  const theme = useTheme();
  const today = useMemo(() => getTodayKey(), []);
  const { analytics } = useHabitAnalytics(today);
  const { profile, saveProfile } = useUserProfile();
  const { settings, updateSetting } = useAppSettings();
  const [draft, setDraft] = useState<UserProfile | null>(profile);
  const [weeklyGoal, setWeeklyGoal] = useState(`${profile?.weeklyGoal ?? 21}`);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(profile);
    setWeeklyGoal(`${profile?.weeklyGoal ?? 21}`);
  }, [profile]);

  const handleSave = async () => {
    if (!draft) {
      return;
    }

    setIsSaving(true);

    try {
      await saveProfile({
        ...draft,
        weeklyGoal: Number.parseInt(weeklyGoal, 10) || draft.weeklyGoal,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <View style={[styles.hero, { backgroundColor: theme.accentSoft }]}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.avatarText}>{profile?.avatarEmoji ?? '🙂'}</ThemedText>
          </View>
          <View style={styles.heroCopy}>
            <ThemedText selectable type="subtitle" style={styles.heroTitle}>
              {profile?.displayName ?? 'Profile'}
            </ThemedText>
            <ThemedText selectable type="default" themeColor="textSecondary">
              {profile?.subtitle ?? 'Building better days'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <MetricPill label="Active" value={`${analytics?.activeHabitCount ?? 0}`} />
          <MetricPill label="Today" value={`${analytics?.completedToday ?? 0}/${analytics?.dueToday ?? 0}`} />
          <MetricPill label="Goal" value={`${profile?.weeklyGoal ?? 21}`} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <ThemedText selectable type="default" style={styles.sectionTitle}>
            Personal
          </ThemedText>
          <View style={styles.field}>
            <ThemedText type="smallBold">Avatar</ThemedText>
            <TextInput
              maxLength={2}
              onChangeText={(avatarEmoji) => setDraft((current) => (current ? { ...current, avatarEmoji } : current))}
              placeholder="🙂"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.avatarInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
              value={draft?.avatarEmoji ?? ''}
            />
          </View>
          <View style={styles.field}>
            <ThemedText type="smallBold">Name</ThemedText>
            <TextInput
              onChangeText={(displayName) => setDraft((current) => (current ? { ...current, displayName } : current))}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
              value={draft?.displayName ?? ''}
            />
          </View>
          <View style={styles.field}>
            <ThemedText type="smallBold">Subtitle</ThemedText>
            <TextInput
              onChangeText={(subtitle) => setDraft((current) => (current ? { ...current, subtitle } : current))}
              placeholder="Building better days"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
              value={draft?.subtitle ?? ''}
            />
          </View>
          <View style={styles.field}>
            <ThemedText type="smallBold">Weekly goal</ThemedText>
            <TextInput
              inputMode="numeric"
              keyboardType="number-pad"
              onChangeText={setWeeklyGoal}
              placeholder="21"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
              value={weeklyGoal}
            />
          </View>
          <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.saveButtonText}>
              {isSaving ? 'Saving' : 'Save Profile'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <ThemedText selectable type="default" style={styles.sectionTitle}>
            Preferences
          </ThemedText>
          <SettingRow
            description="Play subtle feedback when a habit is checked."
            label="Haptics"
            control={
              <Switch
                onValueChange={(value) => updateSetting('hapticsEnabled', value)}
                trackColor={{ false: theme.inputBackground, true: theme.accentSoft }}
                thumbColor={settings.hapticsEnabled ? theme.accent : theme.textSecondary}
                value={settings.hapticsEnabled}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <SettingRow
            description="Use tighter habit rows on Home and Calendar."
            label="Compact layout"
            control={
              <Switch
                onValueChange={(value) => updateSetting('compactLayout', value)}
                trackColor={{ false: theme.inputBackground, true: theme.accentSoft }}
                thumbColor={settings.compactLayout ? theme.accent : theme.textSecondary}
                value={settings.compactLayout}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.weekChooser}>
            <View style={styles.settingText}>
              <ThemedText selectable type="smallBold">
                Week starts on
              </ThemedText>
              <ThemedText selectable type="small" themeColor="textSecondary">
                Used by Calendar and weekly analytics.
              </ThemedText>
            </View>
            <View style={styles.segmented}>
              <WeekButton label="Sun" selected={settings.weekStartsOn === 'sunday'} onPress={() => updateSetting('weekStartsOn', 'sunday')} />
              <WeekButton label="Mon" selected={settings.weekStartsOn === 'monday'} onPress={() => updateSetting('weekStartsOn', 'monday')} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.metricPill, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
      <ThemedText selectable type="subtitle" style={styles.metricValue}>
        {value}
      </ThemedText>
      <ThemedText selectable type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function SettingRow({
  control,
  description,
  label,
}: {
  control: ReactNode;
  description: string;
  label: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <ThemedText selectable type="smallBold">
          {label}
        </ThemedText>
        <ThemedText selectable type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      {control}
    </View>
  );
}

function WeekButton({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.weekButton,
        { backgroundColor: selected ? theme.accent : theme.inputBackground },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={selected && styles.weekButtonSelected}>
        {label}
      </ThemedText>
    </Pressable>
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
  hero: {
    minHeight: 178,
    borderRadius: 28,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 44,
    lineHeight: 52,
  },
  heroCopy: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricPill: {
    flex: 1,
    minHeight: 98,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 36,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontWeight: 600,
  },
  avatarInput: {
    textAlign: 'center',
    fontSize: 28,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 27,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  settingRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  settingText: {
    flex: 1,
    gap: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  weekChooser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  segmented: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  weekButton: {
    minWidth: 52,
    minHeight: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekButtonSelected: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.72,
  },
});
