import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitComposer } from '@/components/habits/habit-composer';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HabitInput } from '@/lib/habits/database';

type HabitFormDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  onSubmit: (input: HabitInput) => Promise<void>;
};

export function HabitFormDrawer({ visible, onClose, onDismissed, onSubmit }: HabitFormDrawerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const closeDistance = Math.max(height, 480);
  const drawerMaxHeight = Math.max(420, height - Math.max(insets.top + Spacing.three, Spacing.four));
  const translateY = useRef(new Animated.Value(closeDistance)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const constrainedDragY = dragY.interpolate({
    inputRange: [0, closeDistance],
    outputRange: [0, closeDistance],
    extrapolate: 'clamp',
  });
  const drawerTranslateY = Animated.add(translateY, constrainedDragY);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (visible) {
      dragY.setValue(0);
      translateY.setValue(closeDistance);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: closeDistance,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        dragY.setValue(0);
        setIsMounted(false);
        onDismissed?.();
      }
    });
  }, [backdropOpacity, closeDistance, dragY, isMounted, onDismissed, translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          dragY.stopAnimation();
        },
        onPanResponderMove: (_, gesture) => {
          dragY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 72 || gesture.vy > 0.85) {
            onClose();
            return;
          }

          Animated.spring(dragY, {
            toValue: 0,
            damping: 18,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            damping: 18,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY, onClose]
  );

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={isMounted}>
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
        <Pressable accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.keyboardAvoiding}>
          <Animated.View
            style={[
              styles.drawer,
              {
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
                maxHeight: drawerMaxHeight,
                paddingBottom: Math.max(insets.bottom, Spacing.three),
                transform: [{ translateY: drawerTranslateY }],
              },
            ]}>
            <View
              accessible
              accessibilityHint="Hold and pull down to close"
              accessibilityLabel="New habit drawer handle"
              accessibilityRole="adjustable"
              style={styles.notchArea}
              {...panResponder.panHandlers}>
              <View style={[styles.notch, { backgroundColor: theme.inactiveControl }]} />
            </View>

            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}>
              <View style={styles.container}>
                <View style={styles.header}>
                  <ThemedText selectable type="default" style={styles.headerTitle}>
                    New Habit
                  </ThemedText>
                </View>

                <HabitComposer onCancel={onClose} onSubmit={onSubmit} />
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 13, 11, 0.36)',
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  drawer: {
    width: '100%',
    alignSelf: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    overflow: 'hidden',
    boxShadow: '0 -18px 42px rgba(46, 38, 31, 0.16)',
  },
  notchArea: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notch: {
    width: 68,
    height: 6,
    borderRadius: 999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
});
