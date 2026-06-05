import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppSettings } from '@/lib/habits/hooks';

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, updateSetting } = useAppSettings();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText selectable type="subtitle">
            Settings
          </ThemedText>
          <ThemedText selectable themeColor="textSecondary">
            Small preferences saved on this device.
          </ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.group}>
          <SettingRow
            description="Play subtle feedback when a habit is checked."
            label="Haptics"
            control={
              <Switch
                onValueChange={(value) => updateSetting('hapticsEnabled', value)}
                value={settings.hapticsEnabled}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
          <SettingRow
            description="Use tighter habit rows on the Home screen."
            label="Compact layout"
            control={
              <Switch
                onValueChange={(value) => updateSetting('compactLayout', value)}
                value={settings.compactLayout}
              />
            }
          />
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.group}>
          <View style={styles.weekHeader}>
            <ThemedText selectable type="smallBold">
              Week starts on
            </ThemedText>
            <ThemedText selectable type="small" themeColor="textSecondary">
              Used for weekly summaries later.
            </ThemedText>
          </View>
          <View style={styles.segmented}>
            <WeekStartButton
              label="Monday"
              selected={settings.weekStartsOn === 'monday'}
              onPress={() => updateSetting('weekStartsOn', 'monday')}
            />
            <WeekStartButton
              label="Sunday"
              selected={settings.weekStartsOn === 'sunday'}
              onPress={() => updateSetting('weekStartsOn', 'sunday')}
            />
          </View>
        </ThemedView>
      </View>
    </ScrollView>
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

function WeekStartButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        selected && styles.segmentButtonSelected,
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" themeColor={selected ? undefined : 'textSecondary'}>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  group: {
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.three,
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
  weekHeader: {
    gap: Spacing.one,
  },
  segmented: {
    borderRadius: 16,
    borderCurve: 'continuous',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: '#2F80ED22',
  },
  pressed: {
    opacity: 0.72,
  },
});
