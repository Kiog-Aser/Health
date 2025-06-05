export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  imageUri?: string;
  timestamp: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence?: number; // AI confidence score
  aiAnalysis?: string;
}

export interface WorkoutEntry {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';
  duration: number; // in minutes
  calories: number;
  intensity: 'low' | 'moderate' | 'high';
  exercises?: WorkoutExercise[];
  notes?: string;
  timestamp: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  distance?: number;
  duration?: number;
}

export interface BiomarkerEntry {
  id: string;
  type: BiomarkerType;
  value: number;
  unit: string;
  timestamp: number;
  notes?: string;
}

export type BiomarkerType = 
  | 'weight'
  | 'height' 
  | 'body_fat'
  | 'muscle_mass'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'heart_rate'
  | 'blood_glucose'
  | 'cholesterol'
  | 'sleep_hours'
  | 'water_intake'
  | 'steps'
  | 'custom';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'fitness' | 'biomarker' | 'custom';
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: number;
  createdAt: number;
  isCompleted: boolean;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  targetValue: number;
  achievedAt?: number;
  isCompleted: boolean;
}

export interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'general';
  priority: 'low' | 'medium' | 'high';
  isPersonalized: boolean;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  preferences: UserPreferences;
  createdAt: number;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    mealReminders: boolean;
    workoutReminders: boolean;
    goalReminders: boolean;
    weeklyReports: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
  };
  apiKeys: {
    geminiApiKey?: string;
  };
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  calories: {
    consumed: number;
    burned: number;
    target: number;
  };
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  water: number;
  steps: number;
  workoutMinutes: number;
  sleepHours: number;
}

export interface HealthReport {
  id: string;
  type: 'weekly' | 'monthly' | 'custom';
  startDate: number;
  endDate: number;
  summary: {
    totalCalories: number;
    avgCalories: number;
    totalWorkouts: number;
    avgWorkoutDuration: number;
    weightChange: number;
    achievements: string[];
    improvements: string[];
    recommendations: string[];
  };
  generatedAt: number;
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
  isRead: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  caloriesPerMinute: number;
  description: string;
  tips?: string[];
  variations?: string[];
  safetyNotes?: string[];
}

export interface ExerciseSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  restTime?: number;
  notes?: string;
  timestamp: number;
}

// Navigation types for Next.js
export interface NavigationProps {
  push: (href: string) => void;
  back: () => void;
  replace: (href: string) => void;
} 