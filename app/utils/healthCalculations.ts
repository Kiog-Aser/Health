import { FoodEntry, UserProfile, DailyStats } from '../types';

export class HealthCalculations {
  // Date formatting utilities
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  static parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }

  static getDateRange(days: number): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  }

  // BMR and TDEE Calculations
  static calculateBMR(
    weight: number, // kg
    height: number, // cm
    age: number,
    gender: 'male' | 'female' | 'other'
  ): number {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      // Use female formula for 'female' and 'other'
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }

  static calculateTDEE(
    bmr: number,
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'
  ): number {
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };

    return bmr * activityMultipliers[activityLevel];
  }

  // Macro calculations
  static calculateMacroTargets(
    calories: number,
    goal: 'cutting' | 'bulking' | 'maintaining' = 'maintaining',
    proteinPerKg: number = 2.2
  ): { protein: number; carbs: number; fat: number } {
    // Adjust calories based on goal
    let adjustedCalories = calories;
    switch (goal) {
      case 'cutting':
        adjustedCalories = calories * 0.8; // 20% deficit
        break;
      case 'bulking':
        adjustedCalories = calories * 1.15; // 15% surplus
        break;
      case 'maintaining':
        // No adjustment
        break;
    }

    // Calculate protein (2.2g per kg of body weight is a reasonable default)
    const protein = proteinPerKg * 70; // Assuming 70kg average weight, should be customizable

    // Calculate fat (25% of total calories)
    const fat = (adjustedCalories * 0.25) / 9; // 9 calories per gram of fat

    // Calculate carbs (remaining calories)
    const carbs = (adjustedCalories - (protein * 4) - (fat * 9)) / 4; // 4 calories per gram of carbs

    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat)
    };
  }

  // Body composition calculations
  static calculateBMI(weight: number, height: number): number {
    // weight in kg, height in cm
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  static calculateBodyFatPercentage(
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female' | 'other'
  ): number {
    // Deurenberg formula
    const bmi = this.calculateBMI(weight, height);
    const genderFactor = gender === 'male' ? 1 : 0; // Use female formula for 'female' and 'other'
    
    return (1.2 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
  }

  static calculateLeanBodyMass(weight: number, bodyFatPercentage: number): number {
    return weight * (1 - bodyFatPercentage / 100);
  }

  // Calorie calculations
  static calculateCaloriesBurned(
    activity: string,
    duration: number, // minutes
    weight: number // kg
  ): number {
    // MET (Metabolic Equivalent of Task) values for common activities
    const metValues: Record<string, number> = {
      walking: 3.5,
      running: 8.0,
      cycling: 6.0,
      swimming: 6.0,
      strength_training: 3.5,
      yoga: 2.5,
      cardio: 7.0,
      sports: 6.0,
      flexibility: 2.0
    };

    const met = metValues[activity.toLowerCase()] || 4.0; // Default MET value
    
    // Calories = MET × weight (kg) × time (hours)
    return Math.round(met * weight * (duration / 60));
  }

  // Nutrition analysis
  static calculateNutritionScore(
    foodEntries: FoodEntry[],
    targetCalories: number
  ): number {
    if (foodEntries.length === 0) return 0;

    const totals = this.calculateDailyTotals(foodEntries);
    
    // Score components (each out of 25 points)
    let score = 0;

    // 1. Calorie accuracy (within ±10% of target)
    const calorieAccuracy = Math.max(0, 25 - Math.abs(totals.calories - targetCalories) / targetCalories * 100);
    score += calorieAccuracy;

    // 2. Protein adequacy (aim for 1.6-2.2g per kg body weight, assuming 70kg)
    const proteinTarget = 140; // 2g per kg for 70kg person
    const proteinScore = Math.min(25, (totals.protein / proteinTarget) * 25);
    score += proteinScore;

    // 3. Fiber intake (aim for 25-35g)
    const fiberScore = Math.min(25, (totals.fiber / 30) * 25);
    score += fiberScore;

    // 4. Variety score (number of different foods)
    const uniqueFoods = new Set(foodEntries.map(entry => entry.name.toLowerCase())).size;
    const varietyScore = Math.min(25, (uniqueFoods / 8) * 25); // 8 different foods = max score
    score += varietyScore;

    return Math.round(score);
  }

  static calculateDailyTotals(foodEntries: FoodEntry[]): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  } {
    return foodEntries.reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.calories,
        protein: totals.protein + entry.protein,
        carbs: totals.carbs + entry.carbs,
        fat: totals.fat + entry.fat,
        fiber: totals.fiber + entry.fiber,
        sugar: totals.sugar + entry.sugar,
        sodium: totals.sodium + entry.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
  }

  // Health scoring
  static calculateSleepScore(sleepHours: number): number {
    // Optimal sleep is 7-9 hours
    if (sleepHours >= 7 && sleepHours <= 9) return 100;
    if (sleepHours >= 6 && sleepHours <= 10) return 80;
    if (sleepHours >= 5 && sleepHours <= 11) return 60;
    return 40;
  }

  static calculateActivityScore(workoutMinutes: number, steps: number): number {
    let score = 0;
    
    // Workout minutes (up to 60 points for 30+ minutes)
    score += Math.min(60, (workoutMinutes / 30) * 60);
    
    // Steps (up to 40 points for 10,000+ steps)
    score += Math.min(40, (steps / 10000) * 40);
    
    return Math.round(score);
  }

  static calculateHealthScore(
    nutritionScore: number,
    sleepScore: number,
    workoutMinutes: number,
    steps: number = 0
  ): number {
    const activityScore = this.calculateActivityScore(workoutMinutes, steps);
    
    // Weighted average: 40% nutrition, 30% activity, 30% sleep
    const healthScore = (nutritionScore * 0.4) + (activityScore * 0.3) + (sleepScore * 0.3);
    
    return Math.round(healthScore);
  }

  // Water intake calculations
  static calculateWaterTarget(weight: number, activityLevel: string): number {
    // Base: 35ml per kg of body weight
    let baseWater = weight * 35; // ml
    
    // Adjust for activity level
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.0,
      lightly_active: 1.1,
      moderately_active: 1.2,
      very_active: 1.3,
      extra_active: 1.4
    };
    
    const multiplier = activityMultipliers[activityLevel] || 1.0;
    return Math.round((baseWater * multiplier) / 1000 * 10) / 10; // Convert to liters, round to 1 decimal
  }

  // Progress calculations
  static calculateWeightLossRate(
    currentWeight: number,
    targetWeight: number,
    timeframeWeeks: number
  ): {
    weeklyRate: number;
    dailyCalorieDeficit: number;
    isRealistic: boolean;
  } {
    const totalWeightLoss = currentWeight - targetWeight;
    const weeklyRate = totalWeightLoss / timeframeWeeks;
    
    // 1 pound = ~3500 calories, 1 kg = ~7700 calories
    const dailyCalorieDeficit = (weeklyRate * 7700) / 7; // For kg
    
    // Realistic rate: 0.5-1kg per week (1-2 lbs)
    const isRealistic = weeklyRate >= 0.25 && weeklyRate <= 1.0;
    
    return {
      weeklyRate: Math.round(weeklyRate * 100) / 100,
      dailyCalorieDeficit: Math.round(dailyCalorieDeficit),
      isRealistic
    };
  }

  // Streak calculations
  static calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    
    const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const today = this.formatDate(new Date());
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const dateStr of sortedDates) {
      const expectedDate = this.formatDate(currentDate);
      if (dateStr === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Goal progress calculations
  static calculateGoalProgress(
    currentValue: number,
    targetValue: number,
    startValue?: number
  ): number {
    if (startValue !== undefined) {
      const totalChange = targetValue - startValue;
      const currentChange = currentValue - startValue;
      return Math.round((currentChange / totalChange) * 100);
    } else {
      return Math.round((currentValue / targetValue) * 100);
    }
  }

  // Trend analysis
  static calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.05; // 5% threshold
    
    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  // Unit conversions
  static convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
    if (from === to) return value;
    
    if (from === 'kg' && to === 'lbs') {
      return Math.round(value * 2.20462 * 10) / 10;
    } else if (from === 'lbs' && to === 'kg') {
      return Math.round(value / 2.20462 * 10) / 10;
    }
    
    return value;
  }

  static convertHeight(value: number, from: 'cm' | 'inches', to: 'cm' | 'inches'): number {
    if (from === to) return value;
    
    if (from === 'cm' && to === 'inches') {
      return Math.round(value / 2.54 * 10) / 10;
    } else if (from === 'inches' && to === 'cm') {
      return Math.round(value * 2.54 * 10) / 10;
    }
    
    return value;
  }

  static convertVolume(value: number, from: 'ml' | 'oz' | 'liters', to: 'ml' | 'oz' | 'liters'): number {
    if (from === to) return value;
    
    // Convert to ml first
    let mlValue = value;
    if (from === 'oz') mlValue = value * 29.5735;
    if (from === 'liters') mlValue = value * 1000;
    
    // Convert from ml to target
    if (to === 'oz') return Math.round(mlValue / 29.5735 * 10) / 10;
    if (to === 'liters') return Math.round(mlValue / 1000 * 10) / 10;
    
    return Math.round(mlValue);
  }
} 