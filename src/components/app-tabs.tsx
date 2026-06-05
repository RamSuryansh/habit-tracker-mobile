import { Tabs, TabList, TabSlot, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SymbolIcon } from '@/components/symbol-icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ComponentProps<typeof SymbolIcon>['name'];
  label: string;
  variant?: 'default' | 'add';
};

const tabItems = [
  {
    name: 'home',
    href: '/',
    label: 'Home',
    icon: { ios: 'house', android: 'home', web: 'home' },
  },
  {
    name: 'calendar',
    href: '/calendar',
    label: 'Calendar',
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  },
  {
    name: 'new-habit',
    href: '/new-habit',
    label: 'Add',
    icon: { ios: 'plus', android: 'add', web: 'add' },
    variant: 'add',
  },
  {
    name: 'analytics',
    href: '/analytics',
    label: 'Analytics',
    icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
  },
  {
    name: 'profile',
    href: '/profile',
    label: 'Profile',
    icon: { ios: 'person', android: 'person', web: 'person' },
  },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          {tabItems.map((item) => (
            <TabTrigger name={item.name} href={item.href} asChild key={item.name}>
              <TabButton {...item} />
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  isFocused,
  label,
  variant = 'default',
  ...props
}: TabButtonProps) {
  const theme = useTheme();
  const isAdd = variant === 'add';
  const tintColor = isAdd ? '#FFFFFF' : isFocused ? theme.accent : theme.textSecondary;

  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      {isAdd ? (
        <View style={styles.addButton}>
          <SymbolIcon color={tintColor} name={icon} size={28} />
        </View>
      ) : (
        <View style={styles.tabButton}>
          <View style={styles.tabPill}>
            <SymbolIcon color={tintColor} name={icon} size={22} />
            <ThemedText
              numberOfLines={1}
              type="small"
              style={[styles.tabLabel, isFocused && [styles.tabLabelActive, { color: theme.accent }]]}>
              {label}
            </ThemedText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tabListContainer,
        {
          bottom: Math.max(insets.bottom, Spacing.two),
          paddingHorizontal: Spacing.three,
        },
      ]}>
      <View
        {...props}
        style={[
          styles.innerContainer,
          {
            backgroundColor: theme.navBackground,
            borderColor: theme.cardBorder,
          },
        ]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.four,
    minHeight: 76,
    borderRadius: 38,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    boxShadow: '0 18px 38px rgba(46, 38, 31, 0.12)',
  },
  tabPressable: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: '100%',
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    minWidth: 76,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 999,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.two,
    overflow: 'hidden',
  },
  addButton: {
    width: 58,
    height: 58,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: Colors.light.accent,
    boxShadow: '0 12px 24px rgba(255, 111, 97, 0.28)',
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#5F5A57',
  },
  tabLabelActive: {
    color: Colors.light.accent,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.72,
  },
});
