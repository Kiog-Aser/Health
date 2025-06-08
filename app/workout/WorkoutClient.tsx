'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  X,
  Clock, 
  Target, 
  Dumbbell,
  Search,
  Timer,
  Check,
  Settings,
  MoreVertical,
  Activity,
  Calendar,
  Upload,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Eye,
  User
} from 'lucide-react';
import { databaseService } from '../services/database';
import { exerciseDatabase } from '../services/exerciseDatabase';
import { workoutHistoryService } from '../services/workoutHistory';
import { WorkoutEntry, Exercise } from '../types';
import AppLayout from '../components/layout/AppLayout';
import MuscleGroupVisualizer from '../components/MuscleGroupVisualizer';
import { 
  generateWorkoutName,
  formatWorkoutDuration,
  calculateWorkoutVolume,
  calculateWorkoutSets,
  calculateWorkoutReps,
  estimateWorkoutCalories,
  getMostTargetedMuscleGroups
} from '../utils/workoutUtils';

interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  isCompleted: boolean;
  isWarmup?: boolean;
  restTime?: number;
  notes?: string;
  isPR?: boolean;
}

interface ActiveExercise extends Exercise {
  sets: WorkoutSet[];
  isExpanded: boolean;
  notes?: string;
}

interface WorkoutSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration: number;
  exercises: ActiveExercise[];
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  calories?: number;
  notes?: string;
  workoutRating?: number; // 1-5 stars
  sleepRating?: number; // 1-5 stars
}

export default function WorkoutClient() {
  const router = useRouter();
  
  // Workout session state
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);

  // Rest timer state
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [targetRestTime, setTargetRestTime] = useState(90); // seconds

  // Exercise selection state
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Most used');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showAllExercises, setShowAllExercises] = useState(false);

  // Data state
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutEntry[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [popularExercises, setPopularExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [selectedExerciseForMenu, setSelectedExerciseForMenu] = useState<number | null>(null);
  const [selectedSetForMenu, setSelectedSetForMenu] = useState<{exerciseIndex: number, setId: string} | null>(null);
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
  const [customExerciseData, setCustomExerciseData] = useState({
    name: '',
    primaryMuscles: [] as string[],
    secondaryMuscles: [] as string[],
    equipment: [] as string[],
    description: ''
  });
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<Exercise | null>(null);

  // UI state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [userBodyweight, setUserBodyweight] = useState(70); // Default, will be loaded from profile

  const categories = ['Most used', 'All exercises'];
  
  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Traps',
    'Latissimus Dorsi', 'Rhomboids', 'Rear Delts', 'Side Delts',
    'Upper Chest', 'Lower Back', 'Hip Flexors', 'Obliques'
  ];
  
  const equipmentTypes = [
    'Bodyweight', 'Barbell', 'Dumbbells', 'Cable Machine', 'Pull-up Bar',
    'Bench', 'Incline Bench', 'Squat Rack', 'Dip Bars', 'Parallel Bars',
    'Leg Press Machine', 'Lat Pulldown Bar', 'Resistance Bands', 'Kettlebell'
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Workout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive && !isPaused && workoutSession) {
      interval = setInterval(() => {
        const newElapsedTime = Date.now() - workoutSession.startTime;
        setElapsedTime(newElapsedTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, isPaused, workoutSession]);

  // Rest timer effect
  useEffect(() => {
    let restInterval: NodeJS.Timeout;
    if (isRestTimerActive && restTimeRemaining > 0) {
      restInterval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            // Could add notification here
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [isRestTimerActive, restTimeRemaining]);

  // Update workout name when exercises change
  useEffect(() => {
    if (activeExercises.length > 0) {
      const autoName = generateWorkoutName(activeExercises);
      setWorkoutName(autoName);
      
      if (workoutSession) {
        setWorkoutSession({
          ...workoutSession,
          name: autoName,
          exercises: activeExercises
        });
      }
    }
  }, [activeExercises]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const workouts = await databaseService.getWorkoutEntries();
      setRecentWorkouts(workouts.slice(0, 5));
      
      const exercises = exerciseDatabase.getAllExercises();
      setAllExercises(exercises);
      
      const popular = exerciseDatabase.getPopularExercises(20);
      setPopularExercises(popular);
      
      // Load user bodyweight from latest weight entry
      const weightEntries = await databaseService.getBiomarkerEntries('weight');
      if (weightEntries.length > 0) {
        setUserBodyweight(weightEntries[0].value);
      }
    } catch (error) {
      console.error('Failed to load workout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startWorkout = () => {
    const session: WorkoutSession = {
      id: Date.now().toString(),
      name: generateWorkoutName([]),
      startTime: Date.now(),
      duration: 0,
      exercises: [],
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
    };
    
    setWorkoutSession(session);
    setIsWorkoutActive(true);
    setIsPaused(false);
    setElapsedTime(0);
    setActiveExercises([]);
    setWorkoutName(session.name);
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
  };

  const finishWorkout = async () => {
    if (!workoutSession) return;

    const finalSession: WorkoutSession = {
      ...workoutSession,
      endTime: Date.now(),
      duration: elapsedTime,
      exercises: activeExercises,
      totalVolume: calculateWorkoutVolume(activeExercises, userBodyweight),
      totalSets: calculateWorkoutSets(activeExercises),
      totalReps: calculateWorkoutReps(activeExercises),
      calories: estimateWorkoutCalories(activeExercises, Math.round(elapsedTime / (1000 * 60)), userBodyweight),
      name: workoutName || generateWorkoutName(activeExercises),
      notes: workoutNotes,
    };

    setWorkoutSession(finalSession);
    setIsWorkoutActive(false);
    setShowWorkoutSummary(true);
  };

  const saveWorkout = async (session: WorkoutSession) => {
    try {
      const workoutEntry: WorkoutEntry = {
        id: session.id,
        type: 'strength',
        name: session.name,
        duration: Math.round(session.duration / (1000 * 60)),
        calories: session.calories || 0,
        intensity: 'moderate' as const,
        exercises: session.exercises.map(ex => {
          const completedSets = ex.sets.filter(set => set.isCompleted && !set.isWarmup);
          return {
            id: ex.id,
            name: ex.name,
            sets: completedSets.length,
            reps: completedSets.reduce((total, set) => total + set.reps, 0),
            weight: completedSets.length > 0 
              ? Math.round((completedSets.reduce((total, set) => total + set.weight, 0) / completedSets.length) * 10) / 10
              : 0,
          };
        }),
        timestamp: session.startTime,
        notes: session.notes,
      };

      await databaseService.addWorkoutEntry(workoutEntry);
      
      // Record exercise usage and update history
      await Promise.all(session.exercises.map(async (exercise) => {
        exerciseDatabase.recordExerciseUsage(exercise.id);
        await workoutHistoryService.updateExerciseHistory(
          exercise.id,
          exercise.name,
          exercise.sets,
          session.id
        );
      }));

      setShowWorkoutSummary(false);
      setWorkoutSession(null);
      setActiveExercises([]);
      setWorkoutName('');
      setWorkoutNotes('');
      await loadData();
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  const addExerciseToWorkout = async (exercise: Exercise) => {
    // Get suggested sets from previous workouts
    const suggestedSets = await workoutHistoryService.getSuggestedSets(exercise.id);
    
    let initialSets: WorkoutSet[];
    if (suggestedSets.length > 0) {
      // Use previous sets as suggestions
      initialSets = suggestedSets.map((set, index) => ({
        id: `${exercise.id}_${Date.now()}_${index}`,
        reps: set.reps,
        weight: set.weight,
        isCompleted: false,
        isWarmup: false
      }));
    } else {
      // Default empty set
      initialSets = [
        { id: `${exercise.id}_${Date.now()}`, reps: 0, weight: 0, isCompleted: false, isWarmup: false }
      ];
    }

    const activeExercise: ActiveExercise = {
      ...exercise,
      sets: initialSets,
      isExpanded: true,
      notes: '',
    };
    
    setActiveExercises(prev => [...prev, activeExercise]);
    setShowExerciseSelection(false);
  };

  const removeExerciseFromWorkout = (exerciseIndex: number) => {
    setActiveExercises(prev => prev.filter((_, index) => index !== exerciseIndex));
  };

  const addSet = (exerciseIndex: number, isWarmup: boolean = false) => {
    setActiveExercises(prev => {
      const updatedExercises = [...prev];
      const exercise = { 
        ...updatedExercises[exerciseIndex],
        sets: [...updatedExercises[exerciseIndex].sets]
      };

      const now = Date.now();
      if (exercise.sets.length > 0) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const idParts = lastSet.id.split('_');
        if (idParts.length > 1) {
          const lastSetTimestampStr = idParts[idParts.length - 2];
          const lastSetTimestamp = parseInt(lastSetTimestampStr, 10);
          if (!isNaN(lastSetTimestamp) && now - lastSetTimestamp < 300) {
            return prev;
          }
        }
      }

      const setsOfSameType = exercise.sets.filter(set => set.isWarmup === isWarmup);
      const lastSet = setsOfSameType[setsOfSameType.length - 1];
      
      const newSet = {
        id: `${exercise.id}_${now}_${Math.random().toString(36).substr(2, 9)}`,
        reps: lastSet ? lastSet.reps : 0,
        weight: lastSet ? lastSet.weight : 0,
        isCompleted: false,
        isPR: false,
        isWarmup
      };

      exercise.sets.push(newSet);
      updatedExercises[exerciseIndex] = exercise;
      
      return updatedExercises;
    });
  };

  const removeSet = (exerciseIndex: number, setId: string) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      exercise.sets = exercise.sets.filter(set => set.id !== setId);
      return updated;
    });
  };

  const updateSet = (exerciseIndex: number, setId: string, field: 'reps' | 'weight', value: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      const set = exercise.sets.find(s => s.id === setId);
      if (set) {
        set[field] = value;
      }
      return updated;
    });
  };

  const completeSet = (exerciseIndex: number, setId: string) => {
    console.log(`Completing set: exerciseIndex=${exerciseIndex}, setId=${setId}`);
    
    setActiveExercises(prev => {
      // Create a completely new array and objects to ensure React detects the change
      const newExercises = prev.map((exercise, idx) => {
        if (idx !== exerciseIndex) {
          return exercise; // Return unchanged exercise
        }

        // Create new exercise object with new sets array
        const newSets = exercise.sets.map(set => {
          if (set.id !== setId) {
            return set; // Return unchanged set
          }

          // Create completely new set object with toggled completion
          const isNowCompleted = !set.isCompleted;
          console.log(`Set ${setId} completion changing from ${set.isCompleted} to ${isNowCompleted}`);

          const newSet = {
            ...set,
            isCompleted: isNowCompleted,
            isPR: false // Reset PR flag initially
          };

          // Handle PR detection and rest timer for working sets being completed
          if (isNowCompleted && !set.isWarmup) {
            // Check if this is a new PR
            const otherCompletedSets = exercise.sets.filter(s => 
              s.id !== setId && !s.isWarmup && s.isCompleted
            );
            const previousMaxWeight = otherCompletedSets.length > 0 
              ? Math.max(...otherCompletedSets.map(s => s.weight))
              : 0;
            
            if (set.weight > previousMaxWeight) {
              newSet.isPR = true;
            }

            // Start rest timer
            setRestTimeRemaining(targetRestTime);
            setIsRestTimerActive(true);
          }

          return newSet;
        });

        return {
          ...exercise,
          sets: newSets
        };
      });

      console.log('New exercises state:', newExercises);
      return newExercises;
    });
  };

  const toggleExerciseExpanded = (exerciseIndex: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].isExpanded = !updated[exerciseIndex].isExpanded;
      return updated;
    });
  };

  const getFilteredExercises = () => {
    const exercisesToShow = showAllExercises ? allExercises : popularExercises;
    
    return exercisesToShow.filter(exercise => {
      const matchesSearch = exerciseSearch === '' || 
        exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(exerciseSearch.toLowerCase());
      
      return matchesSearch;
    });
  };

  const getTargetedMuscles = () => {
    return getMostTargetedMuscleGroups(activeExercises);
  };

  const isBodyweightExercise = (exercise: Exercise) => {
    return exercise.equipment.includes('Bodyweight') || 
           exercise.equipment.includes('Pull-up Bar') ||
           exercise.equipment.includes('Dip Bars') ||
           exercise.equipment.includes('Parallel Bars') ||
           exercise.name.toLowerCase().includes('push-up') ||
           exercise.name.toLowerCase().includes('pull-up') ||
           exercise.name.toLowerCase().includes('chin-up') ||
           exercise.name.toLowerCase().includes('dip');
  };

  const viewWorkoutDetail = (workout: WorkoutEntry) => {
    // Navigate to full page workout detail instead of modal
    router.push(`/workout/${workout.id}`);
  };

  const createCustomExercise = () => {
    if (!customExerciseData.name.trim()) return;
    
    const customExercise: Exercise = {
      id: `custom_${Date.now()}`,
      name: customExerciseData.name,
      category: 'Custom',
      muscleGroups: [...customExerciseData.primaryMuscles, ...customExerciseData.secondaryMuscles],
      equipment: customExerciseData.equipment.length > 0 ? customExerciseData.equipment : ['Bodyweight'],
      instructions: ['Custom exercise - add your own instructions'],
      difficulty: 'beginner',
      caloriesPerMinute: 5,
      description: customExerciseData.description || 'Custom exercise',
      tips: [],
      variations: [],
      safetyNotes: []
    };
    
    // Add to exercise database
    exerciseDatabase.addCustomExercise(customExercise);
    
    // Add to workout immediately
    addExerciseToWorkout(customExercise);
    
    // Reset form and close modal
    setCustomExerciseData({
      name: '',
      primaryMuscles: [],
      secondaryMuscles: [],
      equipment: [],
      description: ''
    });
    setShowCustomExerciseModal(false);
  };

  const toggleMuscleSelection = (muscle: string, type: 'primary' | 'secondary') => {
    setCustomExerciseData(prev => {
      const field = type === 'primary' ? 'primaryMuscles' : 'secondaryMuscles';
      const muscles = prev[field];
      const isSelected = muscles.includes(muscle);
      
      return {
        ...prev,
        [field]: isSelected 
          ? muscles.filter(m => m !== muscle)
          : [...muscles, muscle]
      };
    });
  };

  const toggleEquipmentSelection = (equipment: string) => {
    setCustomExerciseData(prev => {
      const isSelected = prev.equipment.includes(equipment);
      return {
        ...prev,
        equipment: isSelected 
          ? prev.equipment.filter(e => e !== equipment)
          : [...prev.equipment, equipment]
      };
    });
  };

  // Persist activeExercises to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('activeExercises');
    if (saved) {
      try {
        setActiveExercises(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved exercises', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('activeExercises', JSON.stringify(activeExercises));
  }, [activeExercises]);

  // Compute quick stats for exercise settings menu
  const exerciseStats = selectedExerciseForMenu !== null ? (() => {
    const ex = activeExercises[selectedExerciseForMenu];
    const completedSets = ex.sets.filter(s => !s.isWarmup && s.isCompleted);
    if (completedSets.length === 0) {
      return { estimated1RM: 0, repPRWeight: 0, avgWeight: 0, pct1RM: 0, pctPR: 0, pct2PR: 0 };
    }
    const weights = completedSets.map(s => s.weight);
    const repPRWeight = Math.max(...weights);
    const estimated1RM = Math.round(Math.max(...completedSets.map(s => s.weight * (1 + s.reps / 30))));
    const avgWeight = Math.round(weights.reduce((sum, w) => sum + w, 0) / weights.length);
    const pct1RM = estimated1RM ? Math.round(avgWeight / estimated1RM * 100) : 0;
    const pctPR = repPRWeight ? Math.round(avgWeight / repPRWeight * 100) : 0;
    const pct2PR = repPRWeight ? Math.round(avgWeight / (2 * repPRWeight) * 100) : 0;
    return { estimated1RM, repPRWeight, avgWeight, pct1RM, pctPR, pct2PR };
  })() : { estimated1RM: 0, repPRWeight: 0, avgWeight: 0, pct1RM: 0, pctPR: 0, pct2PR: 0 };

  if (isLoading) {
    return (
      <AppLayout title="💪 Workouts">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // Active workout interface
  if (isWorkoutActive && workoutSession) {
    return (
      <AppLayout title="">
        <div className="min-h-screen bg-base-100 text-base-content">
          {/* Header with timer and controls */}
          <div className="flex items-center justify-between p-4 bg-base-200/50 backdrop-blur-sm sticky top-0 z-10">
            <button
              onClick={finishWorkout}
              className="btn btn-circle btn-ghost text-error"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-mono font-bold">
                {formatWorkoutDuration(elapsedTime)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={pauseWorkout}
                className="btn btn-circle btn-ghost"
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </button>
              
              <button className="btn btn-circle btn-ghost">
                <Settings className="w-6 h-6" />
              </button>
              
              <button
                onClick={finishWorkout}
                className="btn btn-circle btn-ghost text-success"
              >
                <Check className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Active Exercises List */}
          <div className="p-4 space-y-4">
            {activeExercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="bg-base-200/30 rounded-xl overflow-hidden">
                  {/* Exercise header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                        {exerciseIndex + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{exercise.name}</h4>
                        {exercise.notes && (
                          <p className="text-sm text-base-content/60">{exercise.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedExerciseInfo(exercise)}
                        className="btn btn-circle btn-ghost btn-sm"
                      >
                        <span className="text-xl font-semibold text-primary">?</span>
                      </button>
                      <button
                        onClick={() => setSelectedExerciseForMenu(exerciseIndex)}
                        className="btn btn-circle btn-ghost"
                      >
                        <MoreVertical className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="px-4 pb-4">
                    {/* Add Warmup Set Link */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addSet(exerciseIndex, true);
                      }}
                      className="text-sm text-orange-500 mb-2 flex items-center gap-2 hover:text-orange-600"
                    >
                      <Plus className="w-4 h-4" />
                      Warm-up
                    </button>

                    {/* Warmup sets */}
                    {exercise.sets.filter(set => set.isWarmup).map((set) => (
                      <div key={set.id} className="flex items-center gap-3 p-2 rounded-lg bg-orange-500/5 mb-2">
                        <button
                          onClick={() => completeSet(exerciseIndex, set.id)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${set.isCompleted ? 'bg-success text-success-content' : 'bg-base-content/10 hover:bg-base-content/20'}`}
                        >
                          <Activity className={`w-4 h-4 ${set.isCompleted ? 'text-success-content' : 'text-orange-500'}`} />
                        </button>
                        {isBodyweightExercise(exercise) && <span className="text-sm font-semibold text-gray-500">BW</span>}
                        <div className="flex-1 grid grid-cols-2 gap-4 items-center text-sm pr-2">
                          <div className="flex items-center gap-0.5 justify-end">
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => updateSet(exerciseIndex, set.id, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-12 bg-transparent text-center font-semibold focus:outline-none"
                              placeholder="0"
                              disabled={set.isCompleted}
                            />
                            <span className="text-base-content/60">kg</span>
                          </div>
                          <div className="flex items-center gap-0.5 justify-end">
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exerciseIndex, set.id, 'reps', parseInt(e.target.value) || 0)}
                              className="w-10 bg-transparent text-center font-semibold focus:outline-none"
                              placeholder="0"
                              disabled={set.isCompleted}
                            />
                            <span className="text-base-content/60">reps</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSetForMenu({exerciseIndex, setId: set.id})}
                          className="btn btn-circle btn-ghost btn-xs"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Working sets */}
                    {exercise.sets.filter(set => !set.isWarmup).map((set) => (
                      <div key={set.id} className="flex items-center gap-3 p-2 rounded-lg bg-base-content/5 mb-2">
                        <div className="relative">
                          {set.isPR && (
                            <span className="absolute -top-2 right-0 text-xs font-bold text-red-500">PR!</span>
                          )}
                          <button
                            onClick={() => completeSet(exerciseIndex, set.id)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${set.isCompleted ? 'bg-success text-success-content' : 'bg-base-content/10 hover:bg-base-content/20'}`}
                          >
                            <span className={`text-sm font-bold ${set.isCompleted ? 'text-success-content' : 'text-primary'}`}>
                              {exercise.sets.filter(s => !s.isWarmup).findIndex(s => s.id === set.id) + 1}
                            </span>
                          </button>
                        </div>
                        {isBodyweightExercise(exercise) && <span className="text-sm font-semibold text-gray-500">BW</span>}
                        <div className="flex-1 grid grid-cols-2 gap-4 items-center text-sm pr-2">
                          <div className="flex items-center gap-0.5 justify-end">
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => updateSet(exerciseIndex, set.id, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-12 bg-transparent text-center font-semibold focus:outline-none"
                              placeholder="0"
                              disabled={set.isCompleted}
                            />
                            <span className="text-base-content/60">kg</span>
                          </div>
                          <div className="flex items-center gap-0.5 justify-end">
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exerciseIndex, set.id, 'reps', parseInt(e.target.value) || 0)}
                              className="w-10 bg-transparent text-center font-semibold focus:outline-none"
                              placeholder="0"
                              disabled={set.isCompleted}
                            />
                            <span className="text-base-content/60">reps</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSetForMenu({exerciseIndex, setId: set.id})}
                          className="btn btn-circle btn-ghost btn-xs"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add Working Set Link */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addSet(exerciseIndex);
                      }}
                      className="text-sm text-primary mt-2 flex items-center gap-2 hover:text-primary/80"
                    >
                      <Plus className="w-4 h-4" />
                      Set
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add Exercise button */}
              <button
                onClick={() => setShowExerciseSelection(true)}
                className="w-full btn btn-outline btn-lg gap-2 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/10 mt-4"
              >
                <Plus className="w-5 h-5 text-primary" />
                <span className="text-primary">Exercise</span>
              </button>
            </div>

          {/* Summary Section - Bottom */}
          <div className="p-4">
            <div className="bg-base-200/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Summary</h3>
                <button className="btn btn-circle btn-ghost btn-sm">
                  <span className="text-xl font-semibold text-primary">?</span>
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-sm text-base-content/60">Exercises</div>
                  <div className="text-2xl font-bold">{activeExercises.length}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">Sets</div>
                  <div className="text-2xl font-bold">{calculateWorkoutSets(activeExercises)}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">Reps</div>
                  <div className="text-2xl font-bold">{calculateWorkoutReps(activeExercises)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div>
                  <div className="text-sm text-base-content/60">Volume</div>
                  <div className="text-2xl font-bold">{Math.round(calculateWorkoutVolume(activeExercises, userBodyweight))} <span className="text-sm font-normal">kg</span></div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">Heaviest</div>
                  <div className="text-2xl font-bold">
                    {activeExercises.length > 0 ? 
                      Math.max(...activeExercises.flatMap(ex => ex.sets.map(s => s.weight)).filter(w => w > 0)) || 0
                      : 0
                    } <span className="text-sm font-normal">kg</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">Average</div>
                  <div className="text-2xl font-bold">
                    {activeExercises.length > 0 ? 
                      Math.round(activeExercises.flatMap(ex => ex.sets.map(s => s.weight)).filter(w => w > 0)
                        .reduce((sum, weight, _, arr) => sum + weight / arr.length, 0)) || 0
                      : 0
                    } <span className="text-sm font-normal">kg</span>
                  </div>
                </div>
              </div>

              {/* Muscle Group Visualization */}
              {activeExercises.length > 0 && (
                <MuscleGroupVisualizer 
                  targetedMuscles={getTargetedMuscles()} 
                  className="mb-4"
                />
              )}
            </div>
          </div>

          {/* Rest Timer */}
          {isRestTimerActive && (
            <div className="fixed bottom-4 left-4 right-4 bg-warning text-warning-content rounded-xl p-4 shadow-lg z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  <span className="font-semibold">Rest Timer</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold">
                    {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setIsRestTimerActive(false)}
                    className="btn btn-circle btn-ghost btn-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exercise Selection Modal */}
          {showExerciseSelection && (
            <div className="fixed inset-0 bg-base-100 z-50">
              <div className="flex items-center justify-between p-4 bg-base-200/50 backdrop-blur-sm">
                <button
                  onClick={() => setShowExerciseSelection(false)}
                  className="btn btn-circle btn-ghost"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="flex-1 mx-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    className="input input-bordered w-full pl-10"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Category toggle */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="tabs tabs-boxed">
                    <button
                      className={`tab ${!showAllExercises ? 'tab-active' : ''}`}
                      onClick={() => setShowAllExercises(false)}
                    >
                      Most used
                    </button>
                    <button
                      className={`tab ${showAllExercises ? 'tab-active' : ''}`}
                      onClick={() => setShowAllExercises(true)}
                    >
                      All exercises
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowCustomExerciseModal(true)}
                    className="btn btn-outline btn-sm gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Custom
                  </button>
                </div>
              </div>

              {/* Exercise List */}
              <div className="px-4 pb-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                {getFilteredExercises().map(exercise => (
                  <div key={exercise.id} className="flex items-center justify-between p-4 bg-base-200/30 rounded-xl">
                    <button
                      onClick={() => addExerciseToWorkout(exercise)}
                      className="flex-1 text-left"
                    >
                      <h4 className="font-semibold">{exercise.name}</h4>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExerciseInfo(exercise);
                      }}
                      className="btn btn-circle btn-ghost btn-sm"
                    >
                      <span className="text-xl font-semibold text-primary">?</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Info Modal */}
          {selectedExerciseInfo && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-base-100 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{selectedExerciseInfo.name}</h3>
                  <button
                    onClick={() => setSelectedExerciseInfo(null)}
                    className="btn btn-circle btn-ghost btn-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-base-content/70">{selectedExerciseInfo.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Target Muscles</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExerciseInfo.muscleGroups.map(muscle => (
                        <span key={muscle} className="badge badge-primary badge-sm">{muscle}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Equipment</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExerciseInfo.equipment.map(eq => (
                        <span key={eq} className="badge badge-outline badge-sm">{eq}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ol className="text-sm text-base-content/70 space-y-1">
                      {selectedExerciseInfo.instructions.map((instruction, index) => (
                        <li key={index}>{index + 1}. {instruction}</li>
                      ))}
                    </ol>
                  </div>

                  {selectedExerciseInfo.tips && (
                    <div>
                      <h4 className="font-semibold mb-2">Tips</h4>
                      <ul className="text-sm text-base-content/70 space-y-1">
                        {selectedExerciseInfo.tips.map((tip, index) => (
                          <li key={index}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Exercise Settings Menu */}
          {selectedExerciseForMenu !== null && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
              <div className="w-full bg-base-100 rounded-t-xl p-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {activeExercises[selectedExerciseForMenu]?.name}
                  </h3>
                  <button
                    onClick={() => setSelectedExerciseForMenu(null)}
                    className="btn btn-circle btn-ghost btn-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick Stats Section */}
                <div className="bg-base-200/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Quick stats</h4>
                    <div className="text-sm text-base-content/60">
                      {activeExercises[selectedExerciseForMenu]?.sets.filter(s => !s.isWarmup).length || 0} sets, {activeExercises[selectedExerciseForMenu]?.sets.filter(s => s.isCompleted && !s.isWarmup).length || 0} completed
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-base-content/60">Estimated 1RM</div>
                      <div className="text-lg font-bold">{exerciseStats.estimated1RM} <span className="text-sm font-normal">kg</span></div>
                    </div>
                    <div>
                      <div className="text-sm text-base-content/60">Rep-PR on weight</div>
                      <div className="text-lg font-bold">{exerciseStats.repPRWeight} <span className="text-sm font-normal">kg</span></div>
                    </div>
                    <div>
                      <div className="text-sm text-base-content/60">Average on weight</div>
                      <div className="text-lg font-bold">{exerciseStats.avgWeight} <span className="text-sm font-normal">kg</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center mt-4">
                    <div>
                      <div className="text-sm text-base-content/60">% of 1RM</div>
                      <div className="text-lg font-bold">{exerciseStats.pct1RM}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-base-content/60">% of 1PR</div>
                      <div className="text-lg font-bold">{exerciseStats.pctPR}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-base-content/60">% of 2PR</div>
                      <div className="text-lg font-bold">{exerciseStats.pct2PR}%</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full btn btn-outline justify-start gap-3">
                    <Upload className="w-5 h-5" />
                    Upload video
                  </button>
                  
                  <button className="w-full btn btn-outline justify-start gap-3">
                    <Activity className="w-5 h-5" />
                    Reorder exercises
                  </button>
                  
                  <button
                    onClick={() => {
                      removeExerciseFromWorkout(selectedExerciseForMenu);
                      setSelectedExerciseForMenu(null);
                    }}
                    className="w-full btn btn-outline btn-error justify-start gap-3"
                  >
                    <X className="w-5 h-5" />
                    Remove exercise
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Set Menu */}
          {selectedSetForMenu && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
              <div className="w-full bg-base-100 rounded-t-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Set Options</h3>
                  <button
                    onClick={() => setSelectedSetForMenu(null)}
                    className="btn btn-circle btn-ghost btn-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      // Add note functionality here
                      setSelectedSetForMenu(null);
                    }}
                    className="w-full btn btn-outline justify-start gap-3"
                  >
                    <span className="text-xl">💬</span>
                    Add comment
                  </button>
                  
                  <button
                    onClick={() => {
                      if (selectedSetForMenu) {
                        removeSet(selectedSetForMenu.exerciseIndex, selectedSetForMenu.setId);
                        setSelectedSetForMenu(null);
                      }
                    }}
                    className="w-full btn btn-outline btn-error justify-start gap-3"
                  >
                    <X className="w-5 h-5" />
                    Remove set
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Exercise Modal */}
          {showCustomExerciseModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Create Custom Exercise</h3>
                  <button
                    onClick={() => setShowCustomExerciseModal(false)}
                    className="btn btn-circle btn-ghost btn-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Exercise Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Exercise Name *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Reverse Fly with Cables"
                      className="input input-bordered"
                      value={customExerciseData.name}
                      onChange={(e) => setCustomExerciseData(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>

                  {/* Primary Muscles */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Primary Muscles *</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {muscleGroups.map(muscle => (
                        <button
                          key={muscle}
                          onClick={() => toggleMuscleSelection(muscle, 'primary')}
                          className={`badge badge-lg cursor-pointer ${
                            customExerciseData.primaryMuscles.includes(muscle)
                              ? 'badge-primary'
                              : 'badge-outline'
                          }`}
                        >
                          {muscle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Muscles */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Secondary Muscles</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {muscleGroups.map(muscle => (
                        <button
                          key={muscle}
                          onClick={() => toggleMuscleSelection(muscle, 'secondary')}
                          className={`badge badge-lg cursor-pointer ${
                            customExerciseData.secondaryMuscles.includes(muscle)
                              ? 'badge-secondary'
                              : 'badge-outline'
                          }`}
                        >
                          {muscle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Equipment</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {equipmentTypes.map(equipment => (
                        <button
                          key={equipment}
                          onClick={() => toggleEquipmentSelection(equipment)}
                          className={`badge badge-lg cursor-pointer ${
                            customExerciseData.equipment.includes(equipment)
                              ? 'badge-accent'
                              : 'badge-outline'
                          }`}
                        >
                          {equipment}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Description</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered"
                      placeholder="Describe how to perform this exercise..."
                      rows={3}
                      value={customExerciseData.description}
                      onChange={(e) => setCustomExerciseData(prev => ({...prev, description: e.target.value}))}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowCustomExerciseModal(false)}
                      className="btn btn-outline flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createCustomExercise}
                      disabled={!customExerciseData.name.trim() || customExerciseData.primaryMuscles.length === 0}
                      className="btn btn-primary flex-1 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create & Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          
      </div>
    </AppLayout>
  );
}

  // Main workout screen (when not active)
  return (
    <AppLayout title="💪 Workouts">
      <div className="space-y-6">
        {/* Quick Start Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Start Workout Card */}
          <div className="health-card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-primary text-primary-content">
                <Play className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Start Workout</h3>
              <p className="text-base-content/60 mb-6">Begin tracking your exercise session</p>
              <button
                onClick={startWorkout}
                className="btn btn-primary btn-lg gap-2"
              >
                <Play className="w-5 h-5" />
                Start New Workout
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="health-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentWorkouts.length > 0 ? (
                recentWorkouts.slice(0, 3).map((workout, index) => (
                  <button
                    key={workout.id}
                    onClick={() => viewWorkoutDetail(workout)}
                    className="w-full flex items-center justify-between p-3 bg-base-200/50 rounded-lg hover:bg-base-200/70 transition-colors"
                  >
                    <div className="text-left">
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-base-content/60">
                        {workout.duration} min • {workout.calories} cal
                      </div>
                    </div>
                    <div className="text-sm text-base-content/60">
                      {new Date(workout.timestamp).toLocaleDateString()}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-base-content/60">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent workouts</p>
                  <p className="text-sm">Start your first workout above!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workout Summary Modal */}
        {showWorkoutSummary && workoutSession && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-xl p-6 w-full max-w-md">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-4">Finish workout</h3>
                
                {/* Time and basic stats */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-base-content/60">Time of workout?</div>
                    <div className="bg-base-200 rounded-lg p-4 mt-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-base-content/60">Start</div>
                          <div>{new Date(workoutSession.startTime).toLocaleDateString()}</div>
                          <div>{new Date(workoutSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Finish</div>
                          <div>{new Date().toLocaleDateString()}</div>
                          <div>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <div className="text-base-content/60">Paused time</div>
                        <div>00h 00m</div>
                        <div className="text-sm text-base-content/60 mt-1">
                          Duration: {formatWorkoutDuration(workoutSession.duration)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-base-content/60 mb-2">Name the workout</div>
                    <input
                      type="text"
                      value={workoutName}
                      onChange={(e) => setWorkoutName(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="Workout name"
                    />
                  </div>

                  <div>
                    <div className="text-sm text-base-content/60 mb-2">Would you like to add a comment?</div>
                    <textarea
                      value={workoutNotes}
                      onChange={(e) => setWorkoutNotes(e.target.value)}
                      className="textarea textarea-bordered w-full"
                      placeholder="Add comment"
                      rows={3}
                    />
                  </div>

                  {/* Rating sliders */}
                  <div>
                    <div className="text-sm text-base-content/60 mb-2">How did it feel?</div>
                    <div className="px-4">
                      <input type="range" min="1" max="5" className="range range-primary" />
                      <div className="flex justify-between text-xs text-base-content/60 mt-1">
                        <span>Poor</span>
                        <span>Normal</span>
                        <span>Good</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-base-content/60 mb-2">Rate the quality of your sleep last night</div>
                    <div className="px-4">
                      <input type="range" min="1" max="5" className="range range-primary" />
                      <div className="flex justify-between text-xs text-base-content/60 mt-1">
                        <span>Poor</span>
                        <span>Normal</span>
                        <span>Good</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWorkoutSummary(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveWorkout(workoutSession)}
                    className="btn btn-primary flex-1 gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 