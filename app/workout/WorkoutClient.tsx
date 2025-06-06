'use client';

import { useState, useEffect } from 'react';
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
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<Exercise | null>(null);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutEntry | null>(null);

  // UI state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const categories = ['Most used', 'All exercises'];

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
      totalVolume: calculateWorkoutVolume(activeExercises),
      totalSets: calculateWorkoutSets(activeExercises),
      totalReps: calculateWorkoutReps(activeExercises),
      calories: estimateWorkoutCalories(activeExercises, Math.round(elapsedTime / (1000 * 60))),
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
        exercises: session.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets.filter(set => set.isCompleted && !set.isWarmup).length,
          reps: Math.round(ex.sets.filter(set => set.isCompleted && !set.isWarmup)
            .reduce((total, set) => total + set.reps, 0) / 
            ex.sets.filter(set => set.isCompleted && !set.isWarmup).length) || 0,
          weight: Math.round(ex.sets.filter(set => set.isCompleted && !set.isWarmup)
            .reduce((total, set) => total + set.weight, 0) / 
            ex.sets.filter(set => set.isCompleted && !set.isWarmup).length) || 0,
        })),
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
      }));
    } else {
      // Default empty set
      initialSets = [
        { id: `${exercise.id}_${Date.now()}`, reps: 0, weight: 0, isCompleted: false }
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
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      // Add random component to make ID more unique and prevent duplicates
      const newSetId = `${exercise.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      exercise.sets.push({
        id: newSetId,
        reps: 0,
        weight: 0,
        isCompleted: false,
        isWarmup
      });
      
      return updated;
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
    setActiveExercises(prev => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      const set = exercise.sets.find(s => s.id === setId);
      if (set) {
        set.isCompleted = !set.isCompleted;
        
        // Start rest timer if set is completed
        if (set.isCompleted && !set.isWarmup) {
          setRestTimeRemaining(targetRestTime);
          setIsRestTimerActive(true);
        }
      }
      return updated;
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

  const viewWorkoutDetail = (workout: WorkoutEntry) => {
    setSelectedWorkout(workout);
    setShowWorkoutDetail(true);
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
                        className="btn btn-circle btn-ghost btn-sm"
                      >
                        <MoreVertical className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="px-4 pb-4">
                    {/* Warmup sets */}
                    {exercise.sets.filter(set => set.isWarmup).length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-base-content/60 mb-2 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Warm-up
                        </div>
                        {exercise.sets.filter(set => set.isWarmup).map((set, setIndex) => (
                          <div key={set.id} className="flex items-center gap-3 p-3 bg-base-300/30 rounded-lg mb-2">
                            <div className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-semibold">
                              W
                            </div>
                            
                            <div className="text-sm">BW</div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-base-content/60">+</span>
                              <span className="font-semibold">{set.weight}</span>
                              <span className="text-sm text-base-content/60">kg</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{set.reps}</span>
                              <span className="text-sm text-base-content/60">reps</span>
                            </div>
                            
                            <button
                              onClick={() => completeSet(exerciseIndex, set.id)}
                              className={`btn btn-circle ml-auto w-12 h-12 ${
                                set.isCompleted ? 'bg-success border-success text-success-content hover:bg-success/90' : 'btn-outline'
                              }`}
                            >
                              <Check className="w-6 h-6" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Working sets */}
                    {exercise.sets.filter(set => !set.isWarmup).map((set, setIndex) => (
                      <div key={set.id} className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                        set.isCompleted ? 'bg-success/10' : 'bg-base-300/30'
                      }`}>
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                          {exercise.sets.filter(s => !s.isWarmup).findIndex(s => s.id === set.id) + 1}
                        </div>
                        
                        <div className="text-sm">BW</div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-base-content/60">+</span>
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(exerciseIndex, set.id, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-transparent text-center font-semibold focus:outline-none focus:bg-base-100 rounded px-1"
                            placeholder="0"
                            disabled={set.isCompleted}
                          />
                          <span className="text-sm text-base-content/60">kg</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(exerciseIndex, set.id, 'reps', parseInt(e.target.value) || 0)}
                            className="w-12 bg-transparent text-center font-semibold focus:outline-none focus:bg-base-100 rounded px-1"
                            placeholder="0"
                            disabled={set.isCompleted}
                          />
                          <span className="text-sm text-base-content/60">reps</span>
                        </div>
                        
                        {set.notes && (
                          <div className="flex-1 text-sm text-base-content/60 px-2">
                            {set.notes}
                          </div>
                        )}
                        
                        <button
                          onClick={() => removeSet(exerciseIndex, set.id)}
                          className="btn btn-circle btn-ghost btn-sm text-error"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => completeSet(exerciseIndex, set.id)}
                          className={`btn btn-circle w-12 h-12 ${
                            set.isCompleted ? 'bg-success border-success text-success-content hover:bg-success/90' : 'btn-outline'
                          }`}
                        >
                          <Check className="w-6 h-6" />
                        </button>
                      </div>
                    ))}

                    {/* Add Set Buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => addSet(exerciseIndex, true)}
                        className="flex-1 btn btn-outline btn-sm gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Warm-up
                      </button>
                      <button
                        onClick={() => addSet(exerciseIndex)}
                        className="flex-1 btn btn-outline btn-sm gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Set
                      </button>
                    </div>
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
                  <div className="text-2xl font-bold">{Math.round(calculateWorkoutVolume(activeExercises))} <span className="text-sm font-normal">kg</span></div>
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
              <div className="w-full bg-base-100 rounded-t-xl p-4">
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

                <div className="space-y-3">
                  <button className="w-full btn btn-outline justify-start gap-3">
                    <Upload className="w-5 h-5" />
                    Upload video
                  </button>
                  
                  <button className="w-full btn btn-outline justify-start gap-3">
                    <Eye className="w-5 h-5" />
                    Reorder exercises
                  </button>
                  
                  <button className="w-full btn btn-outline justify-start gap-3">
                    <RotateCcw className="w-5 h-5" />
                    Move set
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

        {/* Workout Detail Modal */}
        {showWorkoutDetail && selectedWorkout && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedWorkout.name}</h3>
                <button
                  onClick={() => setShowWorkoutDetail(false)}
                  className="btn btn-circle btn-ghost btn-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-base-200/50 rounded-lg p-4">
                  <div className="text-sm text-base-content/60 mb-2">
                    {new Date(selectedWorkout.timestamp).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-sm text-base-content/60">
                    Duration: {selectedWorkout.duration} min • {selectedWorkout.calories} cal
                  </div>
                </div>

                {/* Exercise List */}
                {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Exercises</h4>
                    <div className="space-y-3">
                      {selectedWorkout.exercises.map((exercise, index) => (
                        <div key={index} className="bg-base-200/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl font-semibold text-primary">?</span>
                            <h5 className="font-medium">{exercise.name}</h5>
                          </div>
                          <div className="text-sm text-base-content/70">
                            {exercise.sets && (
                              <div>Sets: {exercise.sets}</div>
                            )}
                            {exercise.reps && (
                              <div>Reps: {exercise.reps}</div>
                            )}
                            {exercise.weight && (
                              <div>Weight: {exercise.weight}kg</div>
                            )}
                            {exercise.duration && (
                              <div>Duration: {exercise.duration} min</div>
                            )}
                            {exercise.distance && (
                              <div>Distance: {exercise.distance}km</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Summary */}
                <div className="bg-base-200/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{selectedWorkout.exercises?.length || 0}</div>
                      <div className="text-sm text-base-content/60">Exercises</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{selectedWorkout.duration}</div>
                      <div className="text-sm text-base-content/60">Minutes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{selectedWorkout.calories}</div>
                      <div className="text-sm text-base-content/60">Calories</div>
                    </div>
                  </div>
                </div>

                {selectedWorkout.notes && (
                  <div className="bg-base-200/30 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-base-content/70">{selectedWorkout.notes}</p>
                  </div>
                )}
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