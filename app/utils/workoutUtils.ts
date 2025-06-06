import { Exercise } from '../types';

// Get the most targeted muscle groups from exercises
export function getMostTargetedMuscleGroups(exercises: Exercise[]): string[] {
  const muscleGroupCount: Record<string, number> = {};
  
  exercises.forEach(exercise => {
    exercise.muscleGroups.forEach(muscleGroup => {
      muscleGroupCount[muscleGroup] = (muscleGroupCount[muscleGroup] || 0) + 1;
    });
  });
  
  // Sort by count and return top 3
  return Object.entries(muscleGroupCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
}

// Generate workout name based on targeted muscle groups and day
export function generateWorkoutName(exercises: Exercise[]): string {
  if (exercises.length === 0) {
    return getTimeBasedWorkoutName();
  }
  
  const targetedMuscles = getMostTargetedMuscleGroups(exercises);
  const dayName = getDayName();
  
  if (targetedMuscles.length === 0) {
    return `${dayName} Workout`;
  }
  
  // Create a concise name based on primary muscle groups
  const muscleNames = targetedMuscles.map(muscle => {
    // Simplify muscle group names
    const simplifiedNames: Record<string, string> = {
      'Latissimus Dorsi': 'Back',
      'Quadriceps': 'Legs',
      'Hamstrings': 'Legs',
      'Rhomboids': 'Back',
      'Lower Back': 'Back',
      'Abdominals': 'Core',
      'Triceps': 'Arms',
      'Biceps': 'Arms',
      'Forearms': 'Arms',
    };
    
    return simplifiedNames[muscle] || muscle;
  });
  
  // Remove duplicates and limit to 2-3 muscle groups
  const uniqueMuscles = [...new Set(muscleNames)].slice(0, 2);
  
  if (uniqueMuscles.length === 1) {
    return `${dayName}: ${uniqueMuscles[0]}`;
  } else if (uniqueMuscles.length === 2) {
    return `${dayName}: ${uniqueMuscles.join(' & ')}`;
  } else {
    return `${dayName}: ${uniqueMuscles[0]} & ${uniqueMuscles[1]}`;
  }
}

// Get current day name
export function getDayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  return dayAbbrevs[today.getDay()];
}

// Get time-based workout name when no exercises are selected
export function getTimeBasedWorkoutName(): string {
  const hour = new Date().getHours();
  const dayName = getDayName();
  
  if (hour < 12) {
    return `${dayName} Morning Workout`;
  } else if (hour < 17) {
    return `${dayName} Afternoon Workout`;
  } else {
    return `${dayName} Evening Workout`;
  }
}

// Format workout duration
export function formatWorkoutDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate total volume for a workout
export function calculateWorkoutVolume(exercises: any[], userBodyweight: number = 70): number {
  return exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets
      .filter((set: any) => set.isCompleted && !set.isWarmup)
      .reduce((setTotal: number, set: any) => {
        const baseWeight = exercise.equipment?.includes('Bodyweight') ? userBodyweight : 0;
        const setWeight = set.weight || 0;
        const totalWeight = baseWeight + setWeight;
        return setTotal + (totalWeight * set.reps);
      }, 0);
    return total + exerciseVolume;
  }, 0);
}

// Calculate total sets for a workout
export function calculateWorkoutSets(exercises: any[]): number {
  return exercises.reduce((total, exercise) => {
    const completedSets = exercise.sets.filter((set: any) => set.isCompleted && !set.isWarmup).length;
    return total + completedSets;
  }, 0);
}

// Calculate total reps for a workout
export function calculateWorkoutReps(exercises: any[]): number {
  return exercises.reduce((total, exercise) => {
    const exerciseReps = exercise.sets
      .filter((set: any) => set.isCompleted && !set.isWarmup)
      .reduce((setTotal: number, set: any) => setTotal + set.reps, 0);
    return total + exerciseReps;
  }, 0);
}

// Estimate calories burned during workout
export function estimateWorkoutCalories(exercises: any[], durationMinutes: number, userBodyweight: number = 70): number {
  // Base calculation: average of 6-8 calories per minute for strength training
  const baseCaloriesPerMinute = 7;
  const baseCalories = durationMinutes * baseCaloriesPerMinute;
  
  // Adjust based on intensity (volume and sets)
  const totalVolume = calculateWorkoutVolume(exercises, userBodyweight);
  const totalSets = calculateWorkoutSets(exercises);
  
  // Intensity multiplier based on volume (rough estimation)
  let intensityMultiplier = 1;
  if (totalVolume > 5000) intensityMultiplier = 1.2; // High volume
  else if (totalVolume > 2000) intensityMultiplier = 1.1; // Moderate volume
  
  // Adjust for number of sets
  if (totalSets > 20) intensityMultiplier *= 1.1;
  else if (totalSets > 30) intensityMultiplier *= 1.2;
  
  return Math.round(baseCalories * intensityMultiplier);
} 