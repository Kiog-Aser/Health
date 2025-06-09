'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { databaseService } from '../services/database';
import { autoBackupService } from '../services/autoBackup';
import { FoodEntry, WorkoutEntry, BiomarkerEntry, DailyStats } from '../types';

interface WaterEntry {
  id: string;
  amount: number; // in liters
  timestamp: number;
}

interface HealthState {
  // Daily tracking
  todayStats: DailyStats | null;
  foodEntries: FoodEntry[];
  workoutEntries: WorkoutEntry[];
  biomarkerEntries: BiomarkerEntry[];
  waterEntries: WaterEntry[];
  
  // User goals
  nutritionGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  
  // Real-time calculations
  dailyProgress: {
    calories: { consumed: number; burned: number; remaining: number; };
    macros: { protein: number; carbs: number; fat: number; fiber: number; };
    water: number;
    steps: number;
    workoutMinutes: number;
  };
  
  // UI state
  isLoading: boolean;
  selectedDate: string;
  healthScore: number;
  
  // Achievements and streaks
  achievements: {
    currentStreak: number;
    bestStreak: number;
    totalDays: number;
    badges: string[];
  };
}

type HealthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_FOOD_ENTRIES'; payload: FoodEntry[] }
  | { type: 'ADD_FOOD_ENTRY'; payload: FoodEntry }
  | { type: 'REMOVE_FOOD_ENTRY'; payload: string }
  | { type: 'SET_WORKOUT_ENTRIES'; payload: WorkoutEntry[] }
  | { type: 'ADD_WORKOUT_ENTRY'; payload: WorkoutEntry }
  | { type: 'SET_WATER_ENTRIES'; payload: WaterEntry[] }
  | { type: 'ADD_WATER_ENTRY'; payload: WaterEntry }
  | { type: 'SET_NUTRITION_GOALS'; payload: HealthState['nutritionGoals'] }
  | { type: 'UPDATE_DAILY_PROGRESS' }
  | { type: 'CALCULATE_HEALTH_SCORE' }
  | { type: 'REFRESH_ALL_DATA' };

const initialState: HealthState = {
  todayStats: null,
  foodEntries: [],
  workoutEntries: [],
  biomarkerEntries: [],
  waterEntries: [],
  nutritionGoals: {
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73,
    fiber: 25,
  },
  dailyProgress: {
    calories: { consumed: 0, burned: 0, remaining: 2200 },
    macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
    water: 0,
    steps: 0,
    workoutMinutes: 0,
  },
  isLoading: true,
  selectedDate: new Date().toISOString().split('T')[0],
  healthScore: 0,
  achievements: {
    currentStreak: 0,
    bestStreak: 0,
    totalDays: 0,
    badges: [],
  },
};

function healthReducer(state: HealthState, action: HealthAction): HealthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload, isLoading: true };
      
    case 'SET_FOOD_ENTRIES':
      return { ...state, foodEntries: action.payload };
      
    case 'ADD_FOOD_ENTRY':
      return { 
        ...state, 
        foodEntries: [action.payload, ...state.foodEntries]
      };
      
    case 'REMOVE_FOOD_ENTRY':
      return {
        ...state,
        foodEntries: state.foodEntries.filter(entry => entry.id !== action.payload)
      };
      
    case 'SET_WORKOUT_ENTRIES':
      return { ...state, workoutEntries: action.payload };
      
    case 'ADD_WORKOUT_ENTRY':
      return {
        ...state,
        workoutEntries: [action.payload, ...state.workoutEntries]
      };
      
    case 'SET_WATER_ENTRIES':
      return { ...state, waterEntries: action.payload };
      
    case 'ADD_WATER_ENTRY':
      return {
        ...state,
        waterEntries: [action.payload, ...state.waterEntries]
      };
      
    case 'SET_NUTRITION_GOALS':
      return { ...state, nutritionGoals: action.payload };
      
    case 'UPDATE_DAILY_PROGRESS': {
      const totalCalories = state.foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
      const totalProtein = state.foodEntries.reduce((sum, entry) => sum + entry.protein, 0);
      const totalCarbs = state.foodEntries.reduce((sum, entry) => sum + entry.carbs, 0);
      const totalFat = state.foodEntries.reduce((sum, entry) => sum + entry.fat, 0);
      const totalFiber = state.foodEntries.reduce((sum, entry) => sum + entry.fiber, 0);
      
      const caloriesBurned = state.workoutEntries.reduce((sum, entry) => sum + entry.calories, 0);
      
      const workoutMinutes = state.workoutEntries.reduce((sum, entry) => sum + entry.duration, 0);
      const totalWater = state.waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      return {
        ...state,
        dailyProgress: {
          calories: {
            consumed: totalCalories,
            burned: caloriesBurned,
            remaining: state.nutritionGoals.calories - totalCalories + caloriesBurned,
          },
          macros: {
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
            fiber: totalFiber,
          },
          water: totalWater,
          steps: 0,  // This would come from step tracking
          workoutMinutes,
        }
      };
    }
    
    case 'CALCULATE_HEALTH_SCORE': {
      let score = 0;
      const progress = state.dailyProgress;
      const goals = state.nutritionGoals;
      
      // Calorie balance (30 points)
      const calorieAccuracy = Math.abs(progress.calories.consumed - goals.calories) / goals.calories;
      score += Math.max(0, 30 - (calorieAccuracy * 30));
      
      // Protein intake (25 points)
      const proteinRatio = Math.min(progress.macros.protein / goals.protein, 1.5);
      score += Math.min(25, proteinRatio * 25);
      
      // Exercise (25 points)
      score += Math.min(25, (progress.workoutMinutes / 60) * 25);
      
      // Consistency bonus (20 points)
      score += Math.min(20, state.achievements.currentStreak * 2);
      
      return { ...state, healthScore: Math.round(score) };
    }
    
    case 'REFRESH_ALL_DATA':
      return { ...state, isLoading: true };
      
    default:
      return state;
  }
}

const HealthContext = createContext<{
  state: HealthState;
  dispatch: React.Dispatch<HealthAction>;
  actions: {
    addFoodEntry: (entry: FoodEntry) => Promise<void>;
    removeFoodEntry: (id: string) => Promise<void>;
    addWorkoutEntry: (entry: WorkoutEntry) => Promise<void>;
    addWaterEntry: (amount: number) => Promise<void>;
    setDate: (date: string) => void;
    refreshData: () => Promise<void>;
    setNutritionGoals: (goals: HealthState['nutritionGoals']) => void;
  };
} | null>(null);

export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(healthReducer, initialState);

  // Load data when date changes
  useEffect(() => {
    loadDataForDate(state.selectedDate);
  }, [state.selectedDate]);

  // Update calculations when entries change
  useEffect(() => {
    dispatch({ type: 'UPDATE_DAILY_PROGRESS' });
    dispatch({ type: 'CALCULATE_HEALTH_SCORE' });
  }, [state.foodEntries, state.workoutEntries, state.waterEntries, state.nutritionGoals]);

  const loadDataForDate = async (date: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.init();
      
      const startOfDay = new Date(date).setHours(0, 0, 0, 0);
      const endOfDay = new Date(date).setHours(23, 59, 59, 999);
      
      const [foodEntries, workoutEntries, biomarkerEntries] = await Promise.all([
        databaseService.getFoodEntries(startOfDay, endOfDay),
        databaseService.getWorkoutEntries(startOfDay, endOfDay),
        databaseService.getBiomarkerEntries(undefined, startOfDay, endOfDay),
      ]);
      
      // Extract water entries from biomarker entries
      const waterEntries: WaterEntry[] = biomarkerEntries
        .filter(entry => entry.type === 'water_intake')
        .map(entry => ({
          id: entry.id,
          amount: entry.value,
          timestamp: entry.timestamp
        }));
      
      dispatch({ type: 'SET_FOOD_ENTRIES', payload: foodEntries });
      dispatch({ type: 'SET_WORKOUT_ENTRIES', payload: workoutEntries });
      dispatch({ type: 'SET_WATER_ENTRIES', payload: waterEntries });
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const actions = {
    addFoodEntry: async (entry: FoodEntry) => {
      try {
        await databaseService.addFoodEntry(entry);
        dispatch({ type: 'ADD_FOOD_ENTRY', payload: entry });
        // Trigger auto backup after data change
        autoBackupService.triggerBackupOnDataChange();
      } catch (error) {
        console.error('Failed to add food entry:', error);
        throw error;
      }
    },

    removeFoodEntry: async (id: string) => {
      try {
        await databaseService.deleteFoodEntry(id);
        dispatch({ type: 'REMOVE_FOOD_ENTRY', payload: id });
      } catch (error) {
        console.error('Failed to remove food entry:', error);
        throw error;
      }
    },

    addWorkoutEntry: async (entry: WorkoutEntry) => {
      try {
        await databaseService.addWorkoutEntry(entry);
        dispatch({ type: 'ADD_WORKOUT_ENTRY', payload: entry });
        // Trigger auto backup after data change
        autoBackupService.triggerBackupOnDataChange();
      } catch (error) {
        console.error('Failed to add workout entry:', error);
        throw error;
      }
    },

    addWaterEntry: async (amount: number) => {
      try {
        const waterEntry: WaterEntry = {
          id: Date.now().toString(),
          amount,
          timestamp: Date.now()
        };
        
        // For now, we'll store water as biomarker entries until we have dedicated water storage
        const biomarkerEntry: BiomarkerEntry = {
          id: waterEntry.id,
          type: 'water_intake',
          value: amount,
          unit: 'L',
          timestamp: waterEntry.timestamp
        };
        
        await databaseService.addBiomarkerEntry(biomarkerEntry);
        dispatch({ type: 'ADD_WATER_ENTRY', payload: waterEntry });
        // Trigger auto backup after data change
        autoBackupService.triggerBackupOnDataChange();
      } catch (error) {
        console.error('Failed to add water entry:', error);
        throw error;
      }
    },

    setDate: (date: string) => {
      dispatch({ type: 'SET_DATE', payload: date });
    },

    refreshData: async () => {
      await loadDataForDate(state.selectedDate);
    },

    setNutritionGoals: (goals: HealthState['nutritionGoals']) => {
      dispatch({ type: 'SET_NUTRITION_GOALS', payload: goals });
      // Persist to database
      // TODO: Implement user profile update
    },
  };

  return (
    <HealthContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
} 