import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutEntry, RootStackParamList } from '../types';
import { databaseService } from '../services/database';

type WorkoutNavigationProp = StackNavigationProp<RootStackParamList>;

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    totalWorkouts: 0,
    totalWeight: 0,
    totalReps: 0,
    totalSets: 0,
    heaviestWeight: 0,
    totalTime: 0,
  });

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#1C1C1E' : '#F2F2F7',
    primary: isDark ? '#0A84FF' : '#007AFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6D6D70',
    accent: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    cardBackground: isDark ? '#2C2C2E' : '#FFFFFF',
    border: isDark ? '#38383A' : '#C6C6C8',
  };

  useEffect(() => {
    loadWorkouts();
    calculateWeeklyStats();
  }, []);

  const loadWorkouts = async () => {
    try {
      const workoutEntries = await databaseService.getWorkoutEntries();
      setWorkouts(workoutEntries);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  const calculateWeeklyStats = () => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyWorkouts = workouts.filter(w => w.timestamp > weekAgo);
    
    // Calculate real stats from workouts
    const stats = weeklyWorkouts.reduce((acc, workout) => {
      acc.totalWorkouts += 1;
      acc.totalTime += workout.duration;
      
      // Calculate exercise-specific stats if available
      if (workout.exercises) {
        workout.exercises.forEach(exercise => {
          if (exercise.sets && exercise.reps && exercise.weight) {
            acc.totalSets += exercise.sets;
            acc.totalReps += exercise.sets * exercise.reps;
            acc.totalWeight += exercise.sets * exercise.reps * exercise.weight;
            acc.heaviestWeight = Math.max(acc.heaviestWeight, exercise.weight);
          }
        });
      }
      
      return acc;
    }, {
      totalWorkouts: 0,
      totalWeight: 0,
      totalReps: 0,
      totalSets: 0,
      heaviestWeight: 0,
      totalTime: 0,
    });

    setWeeklyStats(stats);
  };

  const startWorkout = () => {
    // Navigate to exercise selection - this will be a separate screen/modal
    navigation.navigate('WorkoutSession', {
      selectedExercises: [],
      workoutType: 'strength'
    });
  };

  const trainLoggedWorkoutAgain = () => {
    // TODO: Implement repeat last workout functionality
    console.log('Train logged workout again');
  };

  const planWorkout = () => {
    // TODO: Implement workout planning
    console.log('Plan workout');
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')} h` : `${mins} min`;
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerTop}>
        <View style={styles.userInfo}>
          <TouchableOpacity style={[styles.avatarButton, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome, Mil!</Text>
            <Text style={[styles.usernameText, { color: colors.textSecondary }]}>@kiog</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="body-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.goalProgress, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.goalText, { color: colors.text }]}>
          25 sets for your posterior thighs
        </Text>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>0 / 25</Text>
          <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>0%</Text>
        </View>
      </View>
    </View>
  );

  const renderOverviewCard = () => (
    <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.overviewHeader}>
        <Text style={[styles.overviewTitle, { color: colors.text }]}>Overview</Text>
        <TouchableOpacity style={styles.timeSelector}>
          <Text style={[styles.timeSelectorText, { color: colors.primary }]}>The last 7 days</Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{weeklyStats.totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
          <Text style={[styles.statChange, { color: colors.accent }]}>+{weeklyStats.totalWorkouts}/100%</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{weeklyStats.totalWeight.toLocaleString()} kg</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lifted</Text>
          <Text style={[styles.statChange, { color: colors.accent }]}>+{Math.floor(weeklyStats.totalWeight * 0.67)}/207%</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{weeklyStats.totalReps}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reps</Text>
          <Text style={[styles.statChange, { color: colors.accent }]}>+{Math.floor(weeklyStats.totalReps * 0.62)}/162%</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{weeklyStats.totalSets}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sets</Text>
          <Text style={[styles.statChange, { color: colors.accent }]}>+{Math.floor(weeklyStats.totalSets * 0.83)}/83%</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{weeklyStats.heaviestWeight} kg</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Heaviest</Text>
          <Text style={[styles.statChange, { color: colors.danger }]}>-{Math.floor(weeklyStats.heaviestWeight * 0.4)}/-40%</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{formatTime(weeklyStats.totalTime)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Time</Text>
          <Text style={[styles.statChange, { color: colors.accent }]}>+{Math.floor(weeklyStats.totalTime * 0.15)}/15%</Text>
        </View>
      </View>
    </View>
  );

  const renderMusclesWorked = () => (
    <View style={[styles.musclesCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.musclesHeader}>
        <Text style={[styles.musclesTitle, { color: colors.text }]}>Muscles worked</Text>
        <TouchableOpacity style={styles.timeSelector}>
          <Text style={[styles.timeSelectorText, { color: colors.primary }]}>The last 7 days</Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Placeholder for muscle visualization */}
      <View style={[styles.muscleVisualization, { backgroundColor: colors.surface }]}>
        <Text style={[styles.muscleVisualizationText, { color: colors.textSecondary }]}>
          Muscle group visualization
        </Text>
      </View>
    </View>
  );

  const renderFloatingActions = () => (
    <View style={styles.floatingActionsContainer}>
      <TouchableOpacity 
        onPress={startWorkout}
        style={[styles.startWorkoutButton, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.startWorkoutText}>Start new workout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={trainLoggedWorkoutAgain}
        style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      >
        <Ionicons name="refresh" size={20} color={colors.danger} />
        <Text style={[styles.actionButtonText, { color: colors.text }]}>Train a logged workout again</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={planWorkout}
        style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      >
        <Ionicons name="calendar" size={20} color={colors.danger} />
        <Text style={[styles.actionButtonText, { color: colors.text }]}>Plan a workout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOverviewCard()}
        {renderMusclesWorked()}
        <View style={{ height: 220 }} />
      </ScrollView>

      {renderFloatingActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  usernameText: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeSelectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statChange: {
    fontSize: 10,
    fontWeight: '500',
  },
  musclesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  musclesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  musclesTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  muscleVisualization: {
    height: 200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleVisualizationText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  floatingActionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startWorkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WorkoutScreen; 