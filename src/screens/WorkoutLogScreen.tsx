import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, WorkoutEntry, Exercise } from '../types';
import { databaseService } from '../services/database';
import { LinearGradient } from 'expo-linear-gradient';

type WorkoutLogScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutLog'>;

const WorkoutLogScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutLogScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    type: 'cardio' as const,
    duration: '',
    calories: '',
    intensity: 'moderate' as const,
    notes: '',
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const workoutTypes = [
    { key: 'cardio', label: '🏃‍♂️ Cardio', color: '#FF3B30' },
    { key: 'strength', label: '💪 Strength', color: '#007AFF' },
    { key: 'flexibility', label: '🧘‍♀️ Flexibility', color: '#34C759' },
    { key: 'sports', label: '⚽ Sports', color: '#FF9500' },
    { key: 'other', label: '🏋️‍♀️ Other', color: '#5856D6' },
  ] as const;

  const intensityLevels = [
    { key: 'low', label: '😌 Low', color: '#34C759' },
    { key: 'moderate', label: '😤 Moderate', color: '#FF9500' },
    { key: 'high', label: '🔥 High', color: '#FF3B30' },
  ] as const;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
      sets: 0,
      reps: 0,
      weight: 0,
      duration: 0,
      distance: 0,
    };
    setExercises(prev => [...prev, newExercise]);
  };

  const updateExercise = (id: string, field: string, value: string | number) => {
    setExercises(prev =>
      prev.map(exercise =>
        exercise.id === id
          ? { ...exercise, [field]: typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value }
          : exercise
      )
    );
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(exercise => exercise.id !== id));
  };

  const calculateCalories = () => {
    const duration = Number(formData.duration) || 0;
    const baseCaloriesPerMinute = {
      cardio: 8,
      strength: 6,
      flexibility: 3,
      sports: 7,
      other: 5,
    };

    const intensityMultiplier = {
      low: 0.8,
      moderate: 1.0,
      high: 1.3,
    };

    const estimatedCalories = Math.round(
      duration * baseCaloriesPerMinute[formData.type] * intensityMultiplier[formData.intensity]
    );

    setFormData(prev => ({
      ...prev,
      calories: estimatedCalories.toString(),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a workout name');
      return false;
    }
    if (!formData.duration || isNaN(Number(formData.duration))) {
      Alert.alert('Validation Error', 'Please enter valid duration');
      return false;
    }
    if (!formData.calories || isNaN(Number(formData.calories))) {
      Alert.alert('Validation Error', 'Please enter valid calories');
      return false;
    }
    return true;
  };

  const saveWorkout = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const workoutEntry: WorkoutEntry = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        type: formData.type,
        duration: Number(formData.duration),
        calories: Number(formData.calories),
        intensity: formData.intensity,
        exercises: exercises.filter(ex => ex.name.trim()),
        notes: formData.notes.trim(),
        timestamp: Date.now(),
      };

      await databaseService.addWorkoutEntry(workoutEntry);

      Alert.alert(
        'Success!',
        'Workout has been logged successfully.',
        [
          {
            text: 'Log Another',
            onPress: () => {
              setFormData({
                name: '',
                type: 'cardio',
                duration: '',
                calories: '',
                intensity: 'moderate',
                notes: '',
              });
              setExercises([]);
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#fff', '#f8f9fa']}
          style={styles.card}
        >
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Workout Information
            </Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Workout Name *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#333' : '#f0f0f0',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#ddd'
                }]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="e.g., Morning Run, Push Day"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Duration (min) *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.duration}
                  onChangeText={(value) => handleInputChange('duration', value)}
                  placeholder="45"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                  onBlur={calculateCalories}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Calories *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.calories}
                  onChangeText={(value) => handleInputChange('calories', value)}
                  placeholder="Auto-calculated"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Workout Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Workout Type
            </Text>
            <View style={styles.typeContainer}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    formData.type === type.key && { backgroundColor: type.color },
                    formData.type !== type.key && {
                      backgroundColor: isDark ? '#333' : '#f0f0f0',
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  onPress={() => handleInputChange('type', type.key)}
                >
                  <Text style={[
                    styles.typeText,
                    formData.type === type.key 
                      ? { color: '#fff' }
                      : { color: isDark ? '#ccc' : '#666' }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Intensity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Intensity Level
            </Text>
            <View style={styles.intensityContainer}>
              {intensityLevels.map((level) => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.intensityButton,
                    formData.intensity === level.key && { backgroundColor: level.color },
                    formData.intensity !== level.key && {
                      backgroundColor: isDark ? '#333' : '#f0f0f0',
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  onPress={() => handleInputChange('intensity', level.key)}
                >
                  <Text style={[
                    styles.intensityText,
                    formData.intensity === level.key 
                      ? { color: '#fff' }
                      : { color: isDark ? '#ccc' : '#666' }
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exercises */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Exercises
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={addExercise}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            {exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseNumber, { color: isDark ? '#ccc' : '#666' }]}>
                    Exercise {index + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd',
                    marginBottom: 8
                  }]}
                  value={exercise.name}
                  onChangeText={(value) => updateExercise(exercise.id, 'name', value)}
                  placeholder="Exercise name"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />
                
                <View style={styles.exerciseDetailsGrid}>
                  <View style={styles.exerciseDetailItem}>
                    <Text style={[styles.exerciseDetailLabel, { color: isDark ? '#ccc' : '#666' }]}>Sets</Text>
                    <TextInput
                      style={[styles.input, styles.exerciseDetailInput, { 
                        backgroundColor: isDark ? '#333' : '#f0f0f0',
                        color: isDark ? '#fff' : '#000',
                        borderColor: isDark ? '#444' : '#ddd'
                      }]}
                      value={exercise.sets?.toString() || ''}
                      onChangeText={(value) => updateExercise(exercise.id, 'sets', value)}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.exerciseDetailItem}>
                    <Text style={[styles.exerciseDetailLabel, { color: isDark ? '#ccc' : '#666' }]}>Reps</Text>
                    <TextInput
                      style={[styles.input, styles.exerciseDetailInput, { 
                        backgroundColor: isDark ? '#333' : '#f0f0f0',
                        color: isDark ? '#fff' : '#000',
                        borderColor: isDark ? '#444' : '#ddd'
                      }]}
                      value={exercise.reps?.toString() || ''}
                      onChangeText={(value) => updateExercise(exercise.id, 'reps', value)}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.exerciseDetailItem}>
                    <Text style={[styles.exerciseDetailLabel, { color: isDark ? '#ccc' : '#666' }]}>Weight (kg)</Text>
                    <TextInput
                      style={[styles.input, styles.exerciseDetailInput, { 
                        backgroundColor: isDark ? '#333' : '#f0f0f0',
                        color: isDark ? '#fff' : '#000',
                        borderColor: isDark ? '#444' : '#ddd'
                      }]}
                      value={exercise.weight?.toString() || ''}
                      onChangeText={(value) => updateExercise(exercise.id, 'weight', value)}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ))}
            
            {exercises.length === 0 && (
              <TouchableOpacity style={styles.emptyExercisesContainer} onPress={addExercise}>
                <Ionicons name="add-circle-outline" size={40} color={isDark ? '#666' : '#999'} />
                <Text style={[styles.emptyExercisesText, { color: isDark ? '#666' : '#999' }]}>
                  Tap to add exercises
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Notes (Optional)
            </Text>
            <TextInput
              style={[styles.input, styles.notesInput, { 
                backgroundColor: isDark ? '#333' : '#f0f0f0',
                color: isDark ? '#fff' : '#000',
                borderColor: isDark ? '#444' : '#ddd'
              }]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="How did the workout feel? Any achievements?"
              placeholderTextColor={isDark ? '#666' : '#999'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={saveWorkout}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#007AFF', '#0051D0']}
            style={styles.saveButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="fitness" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Log Workout</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseDetailsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseDetailItem: {
    flex: 1,
  },
  exerciseDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseDetailInput: {
    textAlign: 'center',
    padding: 8,
  },
  emptyExercisesContainer: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 12,
  },
  emptyExercisesText: {
    marginTop: 8,
    fontSize: 14,
  },
  notesInput: {
    height: 80,
    paddingTop: 12,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutLogScreen; 