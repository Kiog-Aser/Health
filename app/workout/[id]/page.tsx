'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Dumbbell } from 'lucide-react';
import { databaseService } from '../../services/database';
import { WorkoutEntry } from '../../types';
import AppLayout from '../../components/layout/AppLayout';
import MuscleGroupVisualizer from '../../components/MuscleGroupVisualizer';

interface WorkoutDetailPageProps {
  params: {
    id: string;
  };
}

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const [workout, setWorkout] = useState<WorkoutEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadWorkout();
  }, [params.id]);

  const loadWorkout = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      const workouts = await databaseService.getWorkoutEntries();
      const foundWorkout = workouts.find(w => w.id === params.id);
      
      if (foundWorkout) {
        setWorkout(foundWorkout);
      } else {
        // Workout not found, redirect back
        router.push('/workout');
      }
    } catch (error) {
      console.error('Failed to load workout:', error);
      router.push('/workout');
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetedMuscles = () => {
    if (!workout?.exercises) return [];
    
    const muscleCount: Record<string, number> = {};
    workout.exercises.forEach(exercise => {
      // For this simplified version, we'll map exercise names to muscle groups
      const exerciseMuscleMap: Record<string, string[]> = {
        'Pull-ups': ['Latissimus Dorsi', 'Biceps'],
        'Push-ups': ['Chest', 'Triceps'],
        'Squats': ['Quadriceps', 'Glutes'],
        'Deadlift': ['Hamstrings', 'Glutes', 'Lower Back'],
        'Bench Press': ['Chest', 'Triceps'],
        'Dips': ['Chest', 'Triceps'],
        // Add more mappings as needed
      };
      
      const muscles = exerciseMuscleMap[exercise.name] || ['Unknown'];
      muscles.forEach(muscle => {
        muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
      });
    });
    
    return Object.keys(muscleCount);
  };

  if (isLoading) {
    return (
      <AppLayout title="Workout Details">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!workout) {
    return (
      <AppLayout title="Workout Not Found">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-bold mb-4">Workout Not Found</h2>
          <p className="text-base-content/60 mb-6">The requested workout could not be found.</p>
          <button 
            onClick={() => router.push('/workout')}
            className="btn btn-primary"
          >
            Back to Workouts
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="">
      <div className="min-h-screen bg-base-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-base-200/50 backdrop-blur-sm sticky top-0 z-10">
          <button
            onClick={() => router.push('/workout')}
            className="btn btn-circle btn-ghost"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-xl font-bold">{workout.name}</h1>
          
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="p-4 space-y-6">
          {/* Workout Info */}
          <div className="bg-base-200/30 rounded-xl p-4">
            <div className="text-lg font-semibold mb-2">
              {new Date(workout.timestamp).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-base-content/60">
              Duration: {workout.duration} min • {workout.calories} cal
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-base-200/30 rounded-xl p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{workout.exercises?.length || 0}</div>
                <div className="text-sm text-base-content/60">Exercises</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {workout.exercises?.reduce((total, ex) => total + (ex.sets || 0), 0) || 0}
                </div>
                <div className="text-sm text-base-content/60">Sets</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {workout.exercises?.reduce((total, ex) => total + (ex.reps || 0), 0) || 0}
                </div>
                <div className="text-sm text-base-content/60">Reps</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center mt-4">
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((workout.exercises?.reduce((total, ex) => total + ((ex.weight || 0) * (ex.reps || 0)), 0) || 0))} 
                  <span className="text-sm font-normal">kg</span>
                </div>
                <div className="text-sm text-base-content/60">Volume</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.max(...(workout.exercises?.map(ex => ex.weight || 0) || [0]))} 
                  <span className="text-sm font-normal">kg</span>
                </div>
                <div className="text-sm text-base-content/60">Heaviest</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {workout.exercises?.length ? 
                    Math.round(workout.exercises.reduce((sum, ex) => sum + (ex.weight || 0), 0) / workout.exercises.length) 
                    : 0
                  } 
                  <span className="text-sm font-normal">kg</span>
                </div>
                <div className="text-sm text-base-content/60">Average</div>
              </div>
            </div>
          </div>

          {/* Exercise List */}
          {workout.exercises && workout.exercises.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                Exercises
              </h4>
              <div className="space-y-3">
                {workout.exercises.map((exercise, index) => (
                  <div key={index} className="bg-base-200/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <h5 className="font-medium flex-1">{exercise.name}</h5>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold">{exercise.sets || 0}</div>
                        <div className="text-base-content/60">Sets</div>
                      </div>
                      <div>
                        <div className="font-semibold">{exercise.reps || 0}</div>
                        <div className="text-base-content/60">Reps</div>
                      </div>
                      <div>
                        <div className="font-semibold">{exercise.weight || 0}kg</div>
                        <div className="text-base-content/60">Weight</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Muscle Group Visualization */}
          {getTargetedMuscles().length > 0 && (
            <div className="bg-base-200/30 rounded-xl p-4">
              <h4 className="font-semibold mb-4">Targeted Muscles</h4>
              <MuscleGroupVisualizer 
                targetedMuscles={getTargetedMuscles()} 
              />
            </div>
          )}

          {workout.notes && (
            <div className="bg-base-200/30 rounded-xl p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📝</span>
                Notes
              </h4>
              <p className="text-sm text-base-content/70">{workout.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 