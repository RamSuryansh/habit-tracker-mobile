import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

type SymbolName = SymbolViewProps['name'];

type SymbolIconProps = {
  color: string;
  name: SymbolName;
  size?: number;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolViewProps['weight'];
};

export function SymbolIcon({ color, name, size = 24, style, weight = 'semibold' }: SymbolIconProps) {
  return (
    <SymbolView
      name={name}
      size={size}
      style={[{ height: size, width: size }, style]}
      tintColor={color}
      type="hierarchical"
      weight={weight}
    />
  );
}

export function HabitSymbolIcon({
  color,
  symbol,
  size = 30,
  style,
}: {
  color: string;
  symbol: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const symbolName = habitSymbolNames[symbol];

  if (symbolName) {
    return <SymbolIcon color={color} name={symbolName} size={size} style={style} />;
  }

  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          color,
          fontSize: Math.round(size * 0.78),
          height: size,
          includeFontPadding: false,
          lineHeight: size,
          textAlign: 'center',
          width: size,
        },
        style as StyleProp<TextStyle>,
      ]}>
      {symbol}
    </Text>
  );
}

const habitSymbolNames: Record<string, SymbolName> = {
  default: { ios: 'target', android: 'target', web: 'target' },
  '🧘': { ios: 'figure.mind.and.body', android: 'self_improvement', web: 'self_improvement' },
  '🎵': { ios: 'music.note', android: 'music_note', web: 'music_note' },
  '📚': { ios: 'book', android: 'menu_book', web: 'menu_book' },
  '🏃': { ios: 'figure.run', android: 'directions_run', web: 'directions_run' },
  '💤': { ios: 'moon.zzz', android: 'bedtime', web: 'bedtime' },
  '🎨': { ios: 'paintpalette', android: 'palette', web: 'palette' },
  '🚴': { ios: 'bicycle', android: 'pedal_bike', web: 'pedal_bike' },
  '💧': { ios: 'drop', android: 'water_drop', web: 'water_drop' },
};
