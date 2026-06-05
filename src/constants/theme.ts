/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#F7F6F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFF2EC',
    textSecondary: '#6F6A66',
    accent: '#FF6F61',
    accentSoft: '#FFF0E8',
    accentWarm: '#FF9A72',
    cardBorder: '#EEE8E3',
    inputBackground: '#ECEBEA',
    inactiveControl: '#BDB8B3',
    navBackground: '#FFFFFF',
    statusBarBackdrop: 'rgba(46, 38, 31, 0.10)',
    success: '#8FC7B5',
    warning: '#F7C59F',
  },
  dark: {
    text: '#ffffff',
    background: '#171412',
    backgroundElement: '#24201D',
    backgroundSelected: '#3A2A25',
    textSecondary: '#D0C5BE',
    accent: '#FF8D68',
    accentSoft: '#3A251F',
    accentWarm: '#FFB08C',
    cardBorder: '#3C332F',
    inputBackground: '#302A26',
    inactiveControl: '#7C716A',
    navBackground: '#24201D',
    statusBarBackdrop: 'rgba(0, 0, 0, 0.32)',
    success: '#8FC7B5',
    warning: '#F7C59F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 118, android: 118, web: 118 }) ?? 118;
export const MaxContentWidth = 800;
