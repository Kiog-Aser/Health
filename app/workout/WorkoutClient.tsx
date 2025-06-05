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
  TrendingUp,
  Zap,
  Trophy,
  Activity
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
      await loadData();
      
      // Reset workout state
      setWorkoutSession(null);
      setIsWorkoutActive(false);
      setActiveExercises([]);
      setShowWorkoutSummary(false);
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const activeExercise: ActiveExercise = {
      ...exercise,
      sets: [
        { id: Date.now().toString(), reps: 0, weight: 0, isCompleted: false }
      ],
      isExpanded: true,
    };
    
    setActiveExercises([...activeExercises, activeExercise]);
    setShowExerciseSelection(false);
  };

  const removeExerciseFromWorkout = (exerciseIndex: number) => {
    setActiveExercises(activeExercises.filter((_, index) => index !== exerciseIndex));
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...activeExercises];
    const newSet = {
      id: Date.now().toString(),
      reps: 0,
      weight: 0,
      isCompleted: false,
    };
    updated[exerciseIndex].sets.push(newSet);
    setActiveExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setId: string, field: 'reps' | 'weight', value: number) => {
    const updated = [...activeExercises];
    const setIndex = updated[exerciseIndex].sets.findIndex(set => set.id === setId);
    if (setIndex !== -1) {
      updated[exerciseIndex].sets[setIndex][field] = value;
      setActiveExercises(updated);
    }
  };

  const completeSet = (exerciseIndex: number, setId: string) => {
    const updated = [...activeExercises];
    const setIndex = updated[exerciseIndex].sets.findIndex(set => set.id === setId);
    if (setIndex !== -1) {
      updated[exerciseIndex].sets[setIndex].isCompleted = !updated[exerciseIndex].sets[setIndex].isCompleted;
      setActiveExercises(updated);
      
      // Start rest timer if set is completed
      if (updated[exerciseIndex].sets[setIndex].isCompleted) {
        setRestTimeRemaining(targetRestTime);
        setIsRestTimerActive(true);
      }
    }
  };

  const toggleExerciseExpanded = (exerciseIndex: number) => {
    const updated = [...activeExercises];
    updated[exerciseIndex].isExpanded = !updated[exerciseIndex].isExpanded;
    setActiveExercises(updated);
  };

  const calculateTotalVolume = (): number => {
    return activeExercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets
        .filter(set => set.isCompleted && !set.isWarmup)
        .reduce((exTotal, set) => exTotal + (set.reps * set.weight), 0);
      return total + exerciseVolume;
    }, 0);
  };

  const calculateTotalSets = (): number => {
    return activeExercises.reduce((total, exercise) => {
      return total + exercise.sets.filter(set => set.isCompleted && !set.isWarmup).length;
    }, 0);
  };

  const estimateCalories = (): number => {
    // Simple estimation based on exercise type and duration
    const durationMinutes = elapsedTime / (1000 * 60);
    return Math.round(durationMinutes * 8); // Rough estimate: 8 calories per minute
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getFilteredExercises = () => {
    return allExercises.filter(exercise => {
      const matchesSearch = exerciseSearch === '' || 
        exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(exerciseSearch.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      const matchesMuscleGroup = selectedMuscleGroup === 'all' || exercise.muscleGroups.includes(selectedMuscleGroup);
      
      return matchesSearch && matchesCategory && matchesMuscleGroup;
    });
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
        {/* Workout Status Card */}
        {isWorkoutActive && workoutSession && (
          <div className="health-card bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary mb-1">Active Workout</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{calculateTotalSets()} sets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      <span>{Math.round(calculateTotalVolume())} kg</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={pauseWorkout}
                  className={`btn ${isPaused ? 'btn-success' : 'btn-warning'} btn-sm gap-2`}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={() => setShowExerciseSelection(true)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </button>
                <button
                  onClick={finishWorkout}
                  className="btn btn-success btn-sm gap-2"
                >
                  <Square className="w-4 h-4" />
                  Finish
                </button>
              </div>
            </div>

            {/* Rest Timer */}
            {isRestTimerActive && (
              <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-warning" />
                    <span className="text-warning font-semibold">Rest Timer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl text-warning">
                      {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => setIsRestTimerActive(false)}
                      className="btn btn-ghost btn-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Start Section */}
        {!isWorkoutActive && (
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

            {/* Quick Stats */}
            <div className="health-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentWorkouts.length > 0 ? (
                  recentWorkouts.slice(0, 3).map((workout, index) => (
                    <div key={workout.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                      <div>
                        <div className="font-medium">{workout.name}</div>
                        <div className="text-sm text-base-content/60">
                          {workout.duration} min • {workout.calories} cal
                        </div>
                      </div>
                      <div className="text-sm text-base-content/60">
                        {new Date(workout.timestamp).toLocaleDateString()}
                      </div>
                    </div>
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
        )}

        {/* Active Exercises */}
        {isWorkoutActive && activeExercises.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Exercises
            </h3>
            
            {activeExercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="health-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{exercise.name}</h4>
                    <div className="flex gap-1">
                      {exercise.muscleGroups.map(mg => (
                        <span key={mg} className="badge badge-primary badge-sm">{mg}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExerciseExpanded(exerciseIndex)}
                      className="btn btn-ghost btn-sm btn-circle"
                    >
                      {exercise.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeExerciseFromWorkout(exerciseIndex)}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {exercise.isExpanded && (
                  <>
                    <div className="w-full overflow-x-auto">
                      <table className="table table-sm w-full min-w-full">
                        <thead>
                          <tr>
                            <th className="w-12">Set</th>
                            <th className="w-20">Reps</th>
                            <th className="w-24">Weight (kg)</th>
                            <th className="w-16">Done</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, setIndex) => (
                            <tr key={set.id} className={set.isCompleted ? 'bg-success/10' : ''}>
                              <td>
                                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-xs sm:text-sm font-semibold">
                                  {setIndex + 1}
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={set.reps || ''}
                                  onChange={(e) => updateSet(exerciseIndex, set.id, 'reps', parseInt(e.target.value) || 0)}
                                  className="input input-sm input-bordered w-16 sm:w-20"
                                  placeholder="0"
                                  disabled={set.isCompleted}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={set.weight || ''}
                                  onChange={(e) => updateSet(exerciseIndex, set.id, 'weight', parseFloat(e.target.value) || 0)}
                                  className="input input-sm input-bordered w-20 sm:w-24"
                                  placeholder="0"
                                  step="0.5"
                                  disabled={set.isCompleted}
                                />
                              </td>
                              <td>
                                <button
                                  onClick={() => completeSet(exerciseIndex, set.id)}
                                  className={`btn btn-sm btn-circle ${
                                    set.isCompleted ? 'btn-success' : 'btn-outline'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => addSet(exerciseIndex)}
                        className="btn btn-outline btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Set
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Exercise Selection Modal */}
        {showExerciseSelection && (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Add Exercise</h3>
                <button
                  onClick={() => setShowExerciseSelection(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    className="input input-bordered w-full pl-10"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    className="select select-bordered select-sm w-full"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <select
                    className="select select-bordered select-sm w-full"
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getFilteredExercises().map(exercise => (
                  <div
                    key={exercise.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-200/50 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{exercise.name}</h4>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="badge badge-outline badge-sm">{exercise.category}</span>
                        {exercise.muscleGroups.slice(0, 3).map(mg => (
                          <span key={mg} className="badge badge-primary badge-sm">{mg}</span>
                        ))}
                        {exercise.muscleGroups.length > 3 && (
                          <span className="badge badge-neutral badge-sm">+{exercise.muscleGroups.length - 3}</span>
                        )}
                      </div>
                      {exercise.description && (
                        <p className="text-sm text-base-content/60 mt-1 line-clamp-2">{exercise.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => addExerciseToWorkout(exercise)}
                      className="btn btn-primary btn-sm gap-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Workout Summary Modal */}
        {showWorkoutSummary && workoutSession && (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-2xl mx-4">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-success text-success-content">
                  <Trophy className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Workout Complete!</h3>
                <p className="text-base-content/60">Great job on your training session</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="text-center p-4 bg-base-200/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatTime(workoutSession.duration)}</div>
                  <div className="text-sm text-base-content/60">Duration</div>
                </div>
                <div className="text-center p-4 bg-base-200/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{calculateTotalSets()}</div>
                  <div className="text-sm text-base-content/60">Sets Completed</div>
                </div>
                <div className="text-center p-4 bg-base-200/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{Math.round(calculateTotalVolume())}</div>
                  <div className="text-sm text-base-content/60">Total Volume (kg)</div>
                </div>
                <div className="text-center p-4 bg-base-200/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{estimateCalories()}</div>
                  <div className="text-sm text-base-content/60">Est. Calories</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveWorkout}
                  className="btn btn-primary flex-1 gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Workout
                </button>
                <button
                  onClick={() => setShowWorkoutSummary(false)}
                  className="btn btn-outline flex-1"
                >
                  Continue Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 