import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HabitFormDrawer } from '@/components/habits/habit-form-drawer';
import { useTheme } from '@/hooks/use-theme';
import type { HabitInput } from '@/lib/habits/database';
import { getTodayKey } from '@/lib/habits/dates';
import { useHabits } from '@/lib/habits/hooks';

function handleNewHabitDrawerDismissed() {
  router.replace('/');
}

export default function NewHabitScreen() {
  const theme = useTheme();
  const { createHabit } = useHabits(getTodayKey());
  const [isDrawerVisible, setIsDrawerVisible] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsDrawerVisible(true);
    }, [])
  );

  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleSubmit = async (input: HabitInput) => {
    await createHabit(input);
    closeDrawer();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <HabitFormDrawer
        onClose={closeDrawer}
        onDismissed={handleNewHabitDrawerDismissed}
        onSubmit={handleSubmit}
        visible={isDrawerVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
