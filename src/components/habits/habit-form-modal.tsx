import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HabitComposer } from '@/components/habits/habit-composer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import type { HabitInput, HabitWithTodayStatus } from '@/lib/habits/database';

type HabitFormModalProps = {
  habit: HabitWithTodayStatus | null;
  visible: boolean;
  onArchive: (habitId: number) => Promise<void>;
  onClose: () => void;
  onSubmit: (input: HabitInput) => Promise<void>;
};

export function HabitFormModal({ habit, visible, onArchive, onClose, onSubmit }: HabitFormModalProps) {
  const handleArchive = () => {
    if (!habit) {
      return;
    }

    Alert.alert('Archive habit?', 'This removes it from Home but keeps past progress.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => onArchive(habit.id),
      },
    ]);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <ThemedView style={styles.modal}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <ThemedText type="subtitle" style={styles.headerIcon}>
                  ‹
                </ThemedText>
              </Pressable>
              <ThemedText selectable type="default" style={styles.headerTitle}>
                {habit ? 'Edit Habit' : 'New Habit'}
              </ThemedText>
              <View style={styles.circleButton}>
                <ThemedText type="subtitle" style={styles.headerIcon}>
                  ⋮
                </ThemedText>
              </View>
            </View>

            <HabitComposer
              habit={habit}
              onArchive={habit ? handleArchive : undefined}
              onCancel={onClose}
              onSubmit={onSubmit}
              submitLabel={habit ? 'Update Habit' : 'Save Habit'}
            />
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    lineHeight: 38,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.72,
  },
});
