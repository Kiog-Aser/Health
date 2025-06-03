'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  TextInput,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { databaseService } from '../services/database';
import { exerciseDatabase, Exercise, ExerciseSet } from '../services/exerciseDatabase';
import { WorkoutEntry, RootStackParamList } from '../types';

type WorkoutSessionNavigationProp = StackNavigationProp<RootStackParamList>;

interface WorkoutSessionParams {
  selectedExercises?: Exercise[];
  workoutType?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
}

interface ActiveExercise extends Exercise {
  sets: {
    id: string;
    reps: number;
    weight: number;
    restTime?: number;
    isCompleted: boolean;
    isWarmup?: boolean;
  }[];
  isExpanded: boolean;
}

const WorkoutSessionScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutSessionNavigationProp>();
  const route = useRoute();
  const params = route.params as WorkoutSessionParams;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [workoutStartTime, setWorkoutStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'most_used' | 'all'>('most_used');
  const [mostUsedExercises, setMostUsedExercises] = useState<Exercise[]>([]);
  
  // Show exercise selection if no exercises provided
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);

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
    restTimer: '#FF3B30',
    warmup: '#FF9500',
    completed: '#34C759',
  };

  useEffect(() => {
    loadAllExercises();
    
    if (params?.selectedExercises && params.selectedExercises.length > 0) {
      initializeWorkout(params.selectedExercises);
      setIsWorkoutActive(true);
    } else {
      // Show exercise selection screen
      setShowExerciseSelection(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - workoutStartTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, isPaused, workoutStartTime]);

  useEffect(() => {
    let restInterval: NodeJS.Timeout;
    if (isRestTimerActive && restTimeRemaining > 0) {
      restInterval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [isRestTimerActive, restTimeRemaining]);

  const loadAllExercises = async () => {
    try {
      const exercises = exerciseDatabase.getAllExercises();
      setAllExercises(exercises);
      
      // Get most used exercises
      const popular = exerciseDatabase.getPopularExercises(10);
      setMostUsedExercises(popular);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const startWorkoutWithExercises = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Exercises Selected', 'Please select at least one exercise to start your workout.');
      return;
    }
    
    initializeWorkout(selectedExercises);
    setShowExerciseSelection(false);
    setIsWorkoutActive(true);
    setWorkoutStartTime(Date.now());
  };

  const toggleExerciseSelection = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.find(e => e.id === exercise.id);
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const initializeWorkout = (exercises: Exercise[]) => {
    const initializedExercises: ActiveExercise[] = exercises.map(exercise => ({
      ...exercise,
      sets: [
        { id: 'warmup', reps: 0, weight: 0, isCompleted: false, isWarmup: true },
        { id: '1', reps: 0, weight: 0, isCompleted: false },
        { id: '2', reps: 0, weight: 0, isCompleted: false },
        { id: '3', reps: 0, weight: 0, isCompleted: false },
      ],
      isExpanded: false,
    }));
    setActiveExercises(initializedExercises);
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const newActiveExercise: ActiveExercise = {
      ...exercise,
      sets: [
        { id: 'warmup', reps: 0, weight: 0, isCompleted: false, isWarmup: true },
        { id: '1', reps: 0, weight: 0, isCompleted: false },
        { id: '2', reps: 0, weight: 0, isCompleted: false },
        { id: '3', reps: 0, weight: 0, isCompleted: false },
      ],
      isExpanded: false,
    };
    setActiveExercises([...activeExercises, newActiveExercise]);
    setShowAddExerciseModal(false);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...activeExercises];
    const newSetNumber = updated[exerciseIndex].sets.filter(s => !s.isWarmup).length + 1;
    updated[exerciseIndex].sets.push({
      id: newSetNumber.toString(),
      reps: 0,
      weight: 0,
      isCompleted: false,
    });
    setActiveExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setId: string, field: 'reps' | 'weight', value: number) => {
    const updated = [...activeExercises];
    const setIndex = updated[exerciseIndex].sets.findIndex(s => s.id === setId);
    if (setIndex !== -1) {
      updated[exerciseIndex].sets[setIndex][field] = value;
    }
    setActiveExercises(updated);
  };

  const completeSet = (exerciseIndex: number, setId: string) => {
    const updated = [...activeExercises];
    const setIndex = updated[exerciseIndex].sets.findIndex(s => s.id === setId);
    if (setIndex !== -1) {
      updated[exerciseIndex].sets[setIndex].isCompleted = true;
      // Start rest timer
      if (!updated[exerciseIndex].sets[setIndex].isWarmup) {
        setRestTimeRemaining(90); // 1.5 minutes default rest
        setIsRestTimerActive(true);
      }
    }
    setActiveExercises(updated);
  };

  const toggleExerciseExpanded = (exerciseIndex: number) => {
    const updated = [...activeExercises];
    updated[exerciseIndex].isExpanded = !updated[exerciseIndex].isExpanded;
    setActiveExercises(updated);
  };

  const finishWorkout = async () => {
    try {
      const workoutDuration = Math.floor(elapsedTime / (1000 * 60));
      const completedSets = activeExercises.reduce((total, exercise) => 
        total + exercise.sets.filter(set => set.isCompleted).length, 0
      );
      const totalReps = activeExercises.reduce((total, exercise) => 
        total + exercise.sets.filter(set => set.isCompleted).reduce((reps, set) => reps + set.reps, 0), 0
      );
      const heaviestWeight = Math.max(...activeExercises.flatMap(exercise => 
        exercise.sets.filter(set => set.isCompleted).map(set => set.weight)
      ));

      const workoutEntry: WorkoutEntry = {
        id: `workout_${Date.now()}`,
        name: `${params?.workoutType || 'Strength'} Workout`,
        type: params?.workoutType || 'strength',
        duration: workoutDuration,
        calories: Math.round(workoutDuration * 6), // Estimate
        intensity: 'moderate',
        timestamp: workoutStartTime,
        exercises: activeExercises.map(exercise => ({
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets.filter(set => set.isCompleted && !set.isWarmup).length,
          reps: exercise.sets.filter(set => set.isCompleted && !set.isWarmup).reduce((total, set) => total + set.reps, 0),
          weight: Math.max(...exercise.sets.filter(set => set.isCompleted).map(set => set.weight)),
        })),
      };

      await databaseService.addWorkoutEntry(workoutEntry);
      
      Alert.alert(
        'Workout Complete! 🎉',
        `Great job! You completed ${completedSets} sets, ${totalReps} reps, and lifted up to ${heaviestWeight}kg.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to save workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderWorkoutHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
        <Ionicons name="close" size={24} color={colors.danger} />
      </TouchableOpacity>
      
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: colors.text }]}>
          {formatTime(elapsedTime)}
        </Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity 
          onPress={() => setIsPaused(!isPaused)} 
          style={[styles.headerButton, { backgroundColor: colors.warning + '20' }]}
        >
          <Ionicons name={isPaused ? "play" : "pause"} size={20} color={colors.warning} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => {/* Settings */}} 
          style={styles.headerButton}
        >
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={finishWorkout} 
          style={[styles.headerButton, { backgroundColor: colors.accent + '20' }]}
        >
          <Ionicons name="checkmark" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRestTimer = () => {
    if (!isRestTimerActive) return null;
    
    return (
      <View style={[styles.restTimerContainer, { backgroundColor: colors.restTimer }]}>
        <Text style={styles.restTimerText}>Rest: {restTimeRemaining}s</Text>
        <TouchableOpacity onPress={() => setIsRestTimerActive(false)}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderExerciseCard = (exercise: ActiveExercise, exerciseIndex: number) => (
    <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <TouchableOpacity 
        onPress={() => toggleExerciseExpanded(exerciseIndex)}
        style={styles.exerciseHeader}
      >
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
            {exercise.sets.filter(s => s.isCompleted && !s.isWarmup).length}/{exercise.sets.filter(s => !s.isWarmup).length} sets
          </Text>
        </View>
        <Ionicons 
          name={exercise.isExpanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      {exercise.isExpanded && (
        <View style={styles.setsContainer}>
          {exercise.sets.map((set, setIndex) => (
            <View key={set.id} style={[styles.setRow, { borderBottomColor: colors.border }]}>
              <View style={styles.setLabel}>
                <Text style={[styles.setLabelText, { 
                  color: set.isWarmup ? colors.warning : colors.textSecondary 
                }]}>
                  {set.isWarmup ? '🔥' : set.id}
                </Text>
              </View>

              <View style={styles.setInputs}>
                {exercise.category === 'strength' && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>+ 0 kg</Text>
                      <TextInput
                        style={[styles.setInput, { 
                          backgroundColor: colors.surface, 
                          color: colors.text,
                          borderColor: colors.border 
                        }]}
                        value={set.weight.toString()}
                        onChangeText={(value) => updateSet(exerciseIndex, set.id, 'weight', parseInt(value) || 0)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>3 reps</Text>
                      <TextInput
                        style={[styles.setInput, { 
                          backgroundColor: colors.surface, 
                          color: colors.text,
                          borderColor: colors.border 
                        }]}
                        value={set.reps.toString()}
                        onChangeText={(value) => updateSet(exerciseIndex, set.id, 'reps', parseInt(value) || 0)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                onPress={() => completeSet(exerciseIndex, set.id)}
                style={[styles.completeButton, { 
                  backgroundColor: set.isCompleted ? colors.completed : colors.surface 
                }]}
                disabled={set.isCompleted}
              >
                <Ionicons 
                  name={set.isCompleted ? "checkmark" : "ellipse-outline"} 
                  size={20} 
                  color={set.isCompleted ? "white" : colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity 
            onPress={() => addSet(exerciseIndex)}
            style={[styles.addSetButton, { borderColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.addSetText, { color: colors.primary }]}>Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSummaryCard = () => {
    const completedSets = activeExercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.isCompleted && !set.isWarmup).length, 0
    );
    const totalReps = activeExercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.isCompleted && !set.isWarmup).reduce((reps, set) => reps + set.reps, 0), 0
    );
    const totalVolume = activeExercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.isCompleted && !set.isWarmup).reduce((vol, set) => vol + (set.reps * set.weight), 0), 0
    );
    const heaviestWeight = Math.max(0, ...activeExercises.flatMap(exercise => 
      exercise.sets.filter(set => set.isCompleted && !set.isWarmup).map(set => set.weight)
    ));

    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Exercises</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Sets</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Reps</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>0 kg</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Volume</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>0 kg</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Heaviest</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>0 kg</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average</Text>
          </View>
        </View>

        {/* Muscle visualization would go here */}
        <View style={styles.muscleVisualization}>
          <Text style={[styles.visualizationLabel, { color: colors.textSecondary }]}>
            Muscles worked visualization would go here
          </Text>
        </View>
      </View>
    );
  };

  const renderAddExerciseModal = () => (
    <Modal
      visible={showAddExerciseModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowAddExerciseModal(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Exercise</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
            value={exerciseSearch}
            onChangeText={setExerciseSearch}
          />
        </View>

        <ScrollView style={styles.exercisesList}>
          {allExercises
            .filter(exercise => 
              exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase())
            )
            .map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                onPress={() => addExerciseToWorkout(exercise)}
                style={[styles.exerciseOption, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.exerciseOptionName, { color: colors.text }]}>
                  {exercise.name}
                </Text>
                <Text style={[styles.exerciseOptionDetails, { color: colors.textSecondary }]}>
                  {exercise.muscleGroups.join(', ')}
                </Text>
              </TouchableOpacity>
            ))
          }
        </ScrollView>
      </View>
    </Modal>
  );

  const renderExerciseSelection = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.exerciseSelectionHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Exercises</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.exerciseSelectionContent, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
            value={exerciseSearch}
            onChangeText={setExerciseSearch}
          />
          <TouchableOpacity onPress={() => setExerciseSearch('')}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.copyFromLastWorkout, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          <Text style={[styles.copyText, { color: colors.text }]}>Copy sets from last workout</Text>
        </View>

        <View style={styles.categoryTabs}>
          <TouchableOpacity
            onPress={() => setSelectedCategory('most_used')}
            style={[styles.categoryTab, selectedCategory === 'most_used' && styles.activeTab]}
          >
            <Text style={[
              styles.categoryTabText,
              { color: selectedCategory === 'most_used' ? colors.primary : colors.textSecondary }
            ]}>
              Most used
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            style={[styles.categoryTab, selectedCategory === 'all' && styles.activeTab]}
          >
            <Text style={[
              styles.categoryTabText,
              { color: selectedCategory === 'all' ? colors.primary : colors.textSecondary }
            ]}>
              All exercises
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
          {(selectedCategory === 'most_used' ? mostUsedExercises : allExercises)
            .filter(exercise => 
              exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase())
            )
            .map(exercise => {
              const isSelected = selectedExercises.find(e => e.id === exercise.id);
              return (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => toggleExerciseSelection(exercise)}
                  style={[styles.exerciseItem, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.exerciseItemContent}>
                    <Text style={[styles.exerciseItemName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    <TouchableOpacity style={styles.exerciseInfoButton}>
                      <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {isSelected && (
                    <View style={[styles.selectionIndicator, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })
          }
        </ScrollView>
      </View>

      <View style={[styles.startWorkoutContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          onPress={startWorkoutWithExercises}
          style={[styles.startWorkoutButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.startWorkoutText}>Start workout ({selectedExercises.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showExerciseSelection) {
    return renderExerciseSelection();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {renderWorkoutHeader()}
      {renderRestTimer()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeExercises.map((exercise, index) => renderExerciseCard(exercise, index))}
        
        <TouchableOpacity 
          onPress={() => setShowAddExerciseModal(true)}
          style={[styles.addExerciseButton, { borderColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={[styles.addExerciseText, { color: colors.primary }]}>Exercise</Text>
        </TouchableOpacity>

        {renderSummaryCard()}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {renderAddExerciseModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  restTimerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
  },
  setsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  setLabel: {
    width: 40,
    alignItems: 'center',
  },
  setLabelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 16,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  setInput: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  addSetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 8,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  muscleVisualization: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  visualizationLabel: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  exercisesList: {
    flex: 1,
  },
  exerciseOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseOptionDetails: {
    fontSize: 14,
  },
  exerciseSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseSelectionContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  copyFromLastWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  copyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  categoryTab: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#007AFF',
  },
  categoryTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseInfoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  startWorkoutContainer: {
    padding: 20,
  },
  startWorkoutButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default WorkoutSessionScreen; 