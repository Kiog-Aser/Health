'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  Clock, 
  Target, 
  Dumbbell,
  Search,
  ChevronDown,
  ChevronUp,
  Timer,
  Check,
  X,
  RotateCcw,
  TrendingUp
} from 'lucide-react';
import { databaseService } from '../services/database';
import { exerciseDatabase } from '../services/exerciseDatabase';
import { HealthCalculations } from '../utils/healthCalculations';
import { WorkoutEntry, Exercise, ExerciseSet } from '../types';
import AppLayout from '../components/layout/AppLayout';

interface ActiveExercise extends Exercise {
  sets: {
    id: string;
    reps: number;
    weight: number;
    restTime?: number;
    isCompleted: boolean;
    isWarmup?: boolean;
    actualRestTime?: number;
  }[];
  isExpanded: boolean;
  notes?: string;
}

interface WorkoutSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number;
  exercises: ActiveExercise[];
  totalVolume: number;
  totalSets: number;
  calories?: number;
  notes?: string;
}

export default function WorkoutClient() {
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  // Data state
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutEntry[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const categories = exerciseDatabase.getCategories();
  const muscleGroups = exerciseDatabase.getMuscleGroups();

  useEffect(() => {
    loadData();
  }, []);

  // Workout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive && !isPaused && workoutSession) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - workoutSession.startTime);
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
            // Play notification sound or vibration here
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [isRestTimerActive, restTimeRemaining]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const workouts = await databaseService.getWorkoutEntries();
      setRecentWorkouts(workouts.slice(0, 5)); // Last 5 workouts
      
      const exercises = exerciseDatabase.getAllExercises();
      setAllExercises(exercises);
    } catch (error) {
      console.error('Failed to load workout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startWorkout = () => {
    const session: WorkoutSession = {
      id: Date.now().toString(),
      startTime: Date.now(),
      duration: 0,
      exercises: [],
      totalVolume: 0,
      totalSets: 0,
    };
    
    setWorkoutSession(session);
    setIsWorkoutActive(true);
    setIsPaused(false);
    setElapsedTime(0);
    setActiveExercises([]);
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
  };

  const finishWorkout = async () => {
    if (!workoutSession) return;

    const finalSession = {
      ...workoutSession,
      endTime: Date.now(),
      duration: elapsedTime,
      exercises: activeExercises,
      totalVolume: calculateTotalVolume(),
      totalSets: calculateTotalSets(),
      calories: estimateCalories(),
    };

    setWorkoutSession(finalSession);
    setShowWorkoutSummary(true);
  };

  const saveWorkout = async () => {
    if (!workoutSession) return;

    try {
      const workoutEntry: WorkoutEntry = {
        id: workoutSession.id,
        type: 'strength',
        name: `Workout ${new Date().toLocaleDateString()}`,
        duration: Math.round(workoutSession.duration / (1000 * 60)), // Convert to minutes
        calories: workoutSession.calories || 0,
        intensity: 'moderate' as const,
        exercises: workoutSession.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets.filter(set => set.isCompleted && !set.isWarmup).length,
          reps: ex.sets.filter(set => set.isCompleted && !set.isWarmup)
            .reduce((total, set) => total + set.reps, 0) / 
            ex.sets.filter(set => set.isCompleted && !set.isWarmup).length || 0,
          weight: ex.sets.filter(set => set.isCompleted && !set.isWarmup)
            .reduce((total, set) => total + set.weight, 0) / 
            ex.sets.filter(set => set.isCompleted && !set.isWarmup).length || 0,
        })),
        timestamp: workoutSession.startTime,
        notes: workoutSession.notes,
      };

      await databaseService.addWorkoutEntry(workoutEntry);
      
      // Update exercise usage stats
      workoutSession.exercises.forEach(exercise => {
        exerciseDatabase.recordExerciseUsage(exercise.id);
      });

      // Reset workout state
      setWorkoutSession(null);
      setIsWorkoutActive(false);
      setActiveExercises([]);
      setShowWorkoutSummary(false);
      
      // Reload recent workouts
      loadData();
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
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
      isExpanded: true,
    };
    
    setActiveExercises(prev => [...prev, newActiveExercise]);
    setShowExerciseModal(false);
  };

  const removeExerciseFromWorkout = (exerciseIndex: number) => {
    setActiveExercises(prev => prev.filter((_, index) => index !== exerciseIndex));
  };

  const addSet = (exerciseIndex: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const newSetNumber = updated[exerciseIndex].sets.filter(s => !s.isWarmup).length + 1;
      updated[exerciseIndex].sets.push({
        id: newSetNumber.toString(),
        reps: 0,
        weight: 0,
        isCompleted: false,
      });
      return updated;
    });
  };

  const updateSet = (exerciseIndex: number, setId: string, field: 'reps' | 'weight', value: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const setIndex = updated[exerciseIndex].sets.findIndex(s => s.id === setId);
      if (setIndex !== -1) {
        updated[exerciseIndex].sets[setIndex][field] = value;
      }
      return updated;
    });
  };

  const completeSet = (exerciseIndex: number, setId: string) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const setIndex = updated[exerciseIndex].sets.findIndex(s => s.id === setId);
      if (setIndex !== -1) {
        updated[exerciseIndex].sets[setIndex].isCompleted = true;
        updated[exerciseIndex].sets[setIndex].actualRestTime = targetRestTime;
      }
      return updated;
    });

    // Start rest timer
    if (!isRestTimerActive) {
      setRestTimeRemaining(targetRestTime);
      setIsRestTimerActive(true);
    }
  };

  const toggleExerciseExpanded = (exerciseIndex: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].isExpanded = !updated[exerciseIndex].isExpanded;
      return updated;
    });
  };

  const calculateTotalVolume = (): number => {
    return activeExercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets
        .filter(set => set.isCompleted && !set.isWarmup)
        .reduce((vol, set) => vol + (set.reps * set.weight), 0);
      return total + exerciseVolume;
    }, 0);
  };

  const calculateTotalSets = (): number => {
    return activeExercises.reduce((total, exercise) => {
      return total + exercise.sets.filter(set => set.isCompleted && !set.isWarmup).length;
    }, 0);
  };

  const estimateCalories = (): number => {
    const totalVolume = calculateTotalVolume();
    const duration = elapsedTime / (1000 * 60); // minutes
    // Simple estimation: 0.1 calories per kg volume + 5 calories per minute
    return Math.round((totalVolume * 0.1) + (duration * 5));
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getFilteredExercises = () => {
    let filtered = allExercises;

    if (exerciseSearch) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.muscleGroups.some(mg => mg.toLowerCase().includes(exerciseSearch.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }

    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(exercise => 
        exercise.muscleGroups.includes(selectedMuscleGroup)
      );
    }

    return filtered;
  };

  if (isLoading) {
    return (
      <AppLayout title="💪 Workouts">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="💪 Workouts">
      <div className="space-y-6">
        {/* Workout Status Header */}
        {isWorkoutActive && workoutSession ? (
          <div className="health-card p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-primary">Active Workout</h2>
                <p className="text-base-content/70">Started {new Date(workoutSession.startTime).toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                <div className="text-sm text-base-content/60">
                  {calculateTotalSets()} sets • {Math.round(calculateTotalVolume())} kg
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={pauseWorkout}
                className={`btn btn-sm ${isPaused ? 'btn-accent' : 'btn-warning'}`}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => setShowExerciseModal(true)}
                className="btn btn-sm btn-primary"
              >
                <Plus className="w-4 h-4" />
                Add Exercise
              </button>
              <button
                onClick={finishWorkout}
                className="btn btn-sm btn-error"
                disabled={activeExercises.length === 0}
              >
                <Square className="w-4 h-4" />
                Finish
              </button>
            </div>
          </div>
        ) : (
          // Start Workout Section
          <div className="health-card p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Start New Workout</h2>
                <p className="text-base-content/60">Begin tracking your exercises and progress</p>
              </div>
              <button
                onClick={startWorkout}
                className="btn btn-primary"
              >
                <Play className="w-4 h-4" />
                Start Workout
              </button>
            </div>
          </div>
        )}

        {/* Rest Timer */}
        {isRestTimerActive && (
          <div className="health-card p-4 bg-error/10 border-error/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Timer className="w-6 h-6 text-error" />
                <div>
                  <h3 className="font-semibold text-error">Rest Timer</h3>
                  <p className="text-sm text-base-content/60">Time remaining between sets</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-error">{formatTime(restTimeRemaining * 1000)}</div>
                <button
                  onClick={() => setIsRestTimerActive(false)}
                  className="btn btn-sm btn-ghost text-error"
                >
                  <X className="w-4 h-4" />
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Exercises */}
        {isWorkoutActive && activeExercises.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exercises</h3>
            {activeExercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="health-card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{exercise.name}</h4>
                      <span className="badge badge-sm badge-outline">
                        {exercise.category}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/60">
                      {exercise.muscleGroups.join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleExerciseExpanded(exerciseIndex)}
                      className="btn btn-ghost btn-sm"
                    >
                      {exercise.isExpanded ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => removeExerciseFromWorkout(exerciseIndex)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {exercise.isExpanded && (
                  <div className="space-y-3">
                    {/* Sets Table */}
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Set</th>
                            <th>Reps</th>
                            <th>Weight (kg)</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, setIndex) => (
                            <tr key={set.id} className={set.isCompleted ? 'bg-success/10' : ''}>
                              <td>
                                <span className={`badge badge-sm ${set.isWarmup ? 'badge-warning' : 'badge-neutral'}`}>
                                  {set.isWarmup ? 'W' : set.id}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-xs input-bordered w-16"
                                  value={set.reps}
                                  onChange={(e) => updateSet(exerciseIndex, set.id, 'reps', parseInt(e.target.value) || 0)}
                                  disabled={set.isCompleted}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.5"
                                  className="input input-xs input-bordered w-20"
                                  value={set.weight}
                                  onChange={(e) => updateSet(exerciseIndex, set.id, 'weight', parseFloat(e.target.value) || 0)}
                                  disabled={set.isCompleted}
                                />
                              </td>
                              <td>
                                {set.isCompleted ? (
                                  <Check className="w-4 h-4 text-success" />
                                ) : (
                                  <button
                                    onClick={() => completeSet(exerciseIndex, set.id)}
                                    className="btn btn-xs btn-success"
                                    disabled={set.reps === 0}
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={() => addSet(exerciseIndex)}
                      className="btn btn-sm btn-outline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Set
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent Workouts */}
        {!isWorkoutActive && recentWorkouts.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Workouts</h3>
              <button className="btn btn-sm btn-ghost">
                View All
              </button>
            </div>
            
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="health-card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{workout.name}</h4>
                    <p className="text-sm text-base-content/60">
                      {new Date(workout.timestamp).toLocaleDateString()} • {formatTime(workout.duration)}
                    </p>
                    <div className="flex gap-4 text-xs text-base-content/60 mt-1">
                      <span>{workout.exercises?.length || 0} exercises</span>
                      <span>{Math.round(calculateTotalVolume())} kg total</span>
                      {workout.calories && <span>{workout.calories} cal</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm">
                      <RotateCcw className="w-4 h-4" />
                      Repeat
                    </button>
                    <button className="btn btn-ghost btn-sm">
                      <TrendingUp className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Exercise Selection Modal */}
        {showExerciseModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-4xl">
              <h3 className="font-bold text-lg mb-4">Add Exercise</h3>
              
              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                      <input
                        type="text"
                        placeholder="Search exercises..."
                        className="input input-bordered w-full pl-10"
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <select
                    className="select select-bordered"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <select
                    className="select select-bordered"
                    value={selectedMuscleGroup}
                    onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                  >
                    <option value="all">All Muscle Groups</option>
                    {muscleGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exercise List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {getFilteredExercises().map((exercise) => (
                  <div key={exercise.id} className="border rounded-lg p-3 hover:bg-base-200 cursor-pointer" onClick={() => addExerciseToWorkout(exercise)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-base-content/60">{exercise.muscleGroups.join(', ')}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="badge badge-xs badge-outline">{exercise.category}</span>
                          <span className="badge badge-xs badge-outline">{exercise.difficulty}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addExerciseToWorkout(exercise);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowExerciseModal(false)}
                  className="btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workout Summary Modal */}
        {showWorkoutSummary && workoutSession && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Workout Complete! 🎉</h3>
              
              <div className="space-y-4">
                <div className="stats stats-vertical w-full">
                  <div className="stat">
                    <div className="stat-title">Duration</div>
                    <div className="stat-value text-lg">{formatTime(workoutSession.duration)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Total Volume</div>
                    <div className="stat-value text-lg">{workoutSession.totalVolume} kg</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Sets Completed</div>
                    <div className="stat-value text-lg">{workoutSession.totalSets}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Estimated Calories</div>
                    <div className="stat-value text-lg">{workoutSession.calories}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Exercises</h4>
                  <div className="space-y-2">
                    {workoutSession.exercises.map((exercise) => {
                      const completedSets = exercise.sets.filter(set => set.isCompleted && !set.isWarmup);
                      return (
                        <div key={exercise.id} className="flex justify-between items-center p-2 bg-base-200 rounded">
                          <span>{exercise.name}</span>
                          <span className="badge">{completedSets.length} sets</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button
                  onClick={() => {
                    setShowWorkoutSummary(false);
                    setWorkoutSession(null);
                    setIsWorkoutActive(false);
                    setActiveExercises([]);
                  }}
                  className="btn"
                >
                  Discard
                </button>
                <button
                  onClick={saveWorkout}
                  className="btn btn-primary"
                >
                  Save Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 