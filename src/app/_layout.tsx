import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { migrateDatabase } from '@/lib/habits/database';

const sqliteOptions = { enableChangeListener: process.env.EXPO_OS !== 'web' };

export default function TabLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider value={DefaultTheme}>
        <SQLiteProvider databaseName="habit-tracker.db" onInit={migrateDatabase} options={sqliteOptions}>
          <AppChrome />
        </SQLiteProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppChrome() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const topInset = Math.max(insets.top, 0);
  const topBarHeight = topInset ? topInset + Spacing.two : 0;

  return (
    <>
      <StatusBar style="dark" />
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.appFrame, { marginTop: topBarHeight }]}>
          <AppTabs />
        </View>
        <TopStatusBarBackdrop height={topBarHeight} />
        <AnimatedSplashOverlay />
      </View>
    </>
  );
}

function TopStatusBarBackdrop({ height }: { height: number }) {
  const theme = useTheme();

  if (!height) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.statusBarBackdrop,
        {
          backgroundColor: theme.statusBarBackdrop,
          borderBottomColor: theme.cardBorder,
          height,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  appFrame: {
    flex: 1,
    overflow: 'hidden',
  },
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 8px 20px rgba(46, 38, 31, 0.08)',
  },
});
