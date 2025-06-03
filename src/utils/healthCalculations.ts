import { UserProfile, DailyStats, FoodEntry, BiomarkerEntry } from '../types';

export class HealthCalculations {
  
  // Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
  static calculateBMR(profile: UserProfile, currentWeight: number): number {
    const { age, gender, height } = profile;
    
    if (gender === 'male') {
      return 10 * currentWeight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * currentWeight + 6.25 * height - 5 * age - 161;
    }
  }

  // Calculate Total Daily Energy Expenditure
  static calculateTDEE(bmr: number, activityLevel: string): number {
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extra_active': 1.9
    };

    return bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2);
  }

  // Calculate BMI
  static calculateBMI(weight: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
  }

  // Get BMI category
  static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  // Calculate ideal weight range using BMI
  static calculateIdealWeightRange(heightCm: number): { min: number; max: number } {
    const heightM = heightCm / 100;
    const min = 18.5 * heightM * heightM;
    const max = 24.9 * heightM * heightM;
    return { min: Math.round(min), max: Math.round(max) };
  }

  // Calculate macro targets based on goals
  static calculateMacroTargets(
    totalCalories: number,
    goal: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' = 'maintenance'
  ): { protein: number; carbs: number; fat: number } {
    let proteinPercent, carbPercent, fatPercent;

    switch (goal) {
      case 'weight_loss':
        proteinPercent = 0.35; // Higher protein for satiety and muscle preservation
        fatPercent = 0.30;
        carbPercent = 0.35;
        break;
      case 'muscle_gain':
        proteinPercent = 0.30; // High protein for muscle building
        fatPercent = 0.25;
        carbPercent = 0.45;
        break;
      case 'weight_gain':
        proteinPercent = 0.25;
        fatPercent = 0.35; // Higher fat for calorie density
        carbPercent = 0.40;
        break;
      default: // maintenance
        proteinPercent = 0.25;
        fatPercent = 0.30;
        carbPercent = 0.45;
    }

    return {
      protein: Math.round((totalCalories * proteinPercent) / 4), // 4 cal per gram
      carbs: Math.round((totalCalories * carbPercent) / 4), // 4 cal per gram
      fat: Math.round((totalCalories * fatPercent) / 9) // 9 cal per gram
    };
  }

  // Calculate water intake recommendation
  static calculateWaterIntake(weight: number, activityLevel: string): number {
    // Base: 35ml per kg of body weight
    let baseWater = weight * 35;
    
    // Add extra for activity level
    const activityMultipliers = {
      'sedentary': 1.0,
      'lightly_active': 1.1,
      'moderately_active': 1.2,
      'very_active': 1.3,
      'extra_active': 1.4
    };

    return Math.round(baseWater * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.0));
  }

  // Calculate body fat percentage (using Navy method as approximation)
  static calculateBodyFatPercentage(
    gender: string,
    waist: number,
    neck: number,
    hip?: number, // Required for females
    height?: number
  ): number {
    if (gender === 'male') {
      if (!height) return 0;
      return Math.round(495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450);
    } else {
      if (!hip || !height) return 0;
      return Math.round(495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450);
    }
  }

  // Calculate calorie deficit/surplus for weight goals
  static calculateCalorieAdjustment(
    currentWeight: number,
    targetWeight: number,
    targetDate: number,
    tdee: number
  ): { dailyCalories: number; weeklyChange: number } {
    const daysToTarget = Math.ceil((targetDate - Date.now()) / (1000 * 60 * 60 * 24));
    const weightChange = targetWeight - currentWeight;
    
    // 1 pound = 3500 calories, 1 kg = 7700 calories
    const caloriesPerKg = 7700;
    const totalCalorieChange = weightChange * caloriesPerKg;
    const dailyCalorieAdjustment = totalCalorieChange / daysToTarget;
    
    return {
      dailyCalories: Math.round(tdee + dailyCalorieAdjustment),
      weeklyChange: Math.round((weightChange / daysToTarget) * 7 * 10) / 10
    };
  }

  // Calculate heart rate zones
  static calculateHeartRateZones(age: number): {
    maxHR: number;
    zones: {
      zone1: { min: number; max: number; name: string };
      zone2: { min: number; max: number; name: string };
      zone3: { min: number; max: number; name: string };
      zone4: { min: number; max: number; name: string };
      zone5: { min: number; max: number; name: string };
    };
  } {
    const maxHR = 220 - age;
    
    return {
      maxHR,
      zones: {
        zone1: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6), name: 'Recovery' },
        zone2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), name: 'Aerobic Base' },
        zone3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), name: 'Aerobic' },
        zone4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), name: 'Threshold' },
        zone5: { min: Math.round(maxHR * 0.9), max: maxHR, name: 'VO2 Max' }
      }
    };
  }

  // Calculate sleep score based on duration and quality
  static calculateSleepScore(hours: number, quality: 'poor' | 'fair' | 'good' | 'excellent' = 'good'): number {
    let score = 0;

    // Duration score (0-70 points)
    if (hours >= 7 && hours <= 9) {
      score += 70; // Optimal range
    } else if (hours >= 6 && hours < 7) {
      score += 60; // Slightly short
    } else if (hours > 9 && hours <= 10) {
      score += 60; // Slightly long
    } else if (hours >= 5 && hours < 6) {
      score += 40; // Short
    } else if (hours > 10 && hours <= 11) {
      score += 40; // Long
    } else {
      score += 20; // Very short or very long
    }

    // Quality score (0-30 points)
    const qualityScores = { poor: 10, fair: 20, good: 25, excellent: 30 };
    score += qualityScores[quality];

    return Math.min(100, score);
  }

  // Calculate nutrition score
  static calculateNutritionScore(foodEntries: FoodEntry[], targetCalories: number): number {
    if (foodEntries.length === 0) return 0;

    const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const totalProtein = foodEntries.reduce((sum, entry) => sum + entry.protein, 0);
    const totalCarbs = foodEntries.reduce((sum, entry) => sum + entry.carbs, 0);
    const totalFat = foodEntries.reduce((sum, entry) => sum + entry.fat, 0);
    const totalFiber = foodEntries.reduce((sum, entry) => sum + entry.fiber, 0);
    const totalSodium = foodEntries.reduce((sum, entry) => sum + entry.sodium, 0);

    let score = 0;

    // Calorie accuracy (0-25 points)
    const calorieAccuracy = 1 - Math.abs(totalCalories - targetCalories) / targetCalories;
    score += Math.max(0, calorieAccuracy * 25);

    // Protein adequacy (0-25 points)
    const proteinTarget = targetCalories * 0.25 / 4; // 25% of calories from protein
    const proteinScore = Math.min(1, totalProtein / proteinTarget);
    score += proteinScore * 25;

    // Fiber adequacy (0-25 points)
    const fiberTarget = 25; // 25g daily target
    const fiberScore = Math.min(1, totalFiber / fiberTarget);
    score += fiberScore * 25;

    // Sodium moderation (0-25 points)
    const sodiumTarget = 2300; // 2300mg daily limit
    const sodiumScore = totalSodium <= sodiumTarget ? 1 : Math.max(0, 1 - (totalSodium - sodiumTarget) / sodiumTarget);
    score += sodiumScore * 25;

    return Math.round(score);
  }

  // Calculate overall health score
  static calculateHealthScore(
    nutritionScore: number,
    sleepScore: number,
    activityMinutes: number,
    stressLevel: number = 3 // 1-5 scale, 3 is neutral
  ): number {
    let score = 0;

    // Nutrition (30% weight)
    score += (nutritionScore / 100) * 30;

    // Sleep (25% weight)
    score += (sleepScore / 100) * 25;

    // Activity (25% weight)
    const activityTarget = 150; // 150 minutes per week WHO recommendation
    const activityScore = Math.min(1, activityMinutes / activityTarget);
    score += activityScore * 25;

    // Stress (20% weight)
    const stressScore = (6 - stressLevel) / 5; // Invert stress level (lower stress = higher score)
    score += stressScore * 20;

    return Math.round(score);
  }

  // Calculate trend from biomarker data
  static calculateTrend(entries: BiomarkerEntry[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (entries.length < 3) return 'insufficient_data';

    // Sort by timestamp
    const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Take first and last third of data
    const firstThird = sortedEntries.slice(0, Math.ceil(sortedEntries.length / 3));
    const lastThird = sortedEntries.slice(-Math.ceil(sortedEntries.length / 3));

    const firstAvg = firstThird.reduce((sum, entry) => sum + entry.value, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, entry) => sum + entry.value, 0) / lastThird.length;

    const changePercent = (lastAvg - firstAvg) / firstAvg;

    // Define improvement based on biomarker type
    const isImprovementPositive = (type: string): boolean => {
      const positiveChangeTypes = ['muscle_mass', 'sleep_hours', 'water_intake', 'steps'];
      return positiveChangeTypes.includes(type);
    };

    const threshold = 0.05; // 5% change threshold
    const biomarkerType = sortedEntries[0].type;

    if (Math.abs(changePercent) < threshold) {
      return 'stable';
    }

    if (isImprovementPositive(biomarkerType)) {
      return changePercent > 0 ? 'improving' : 'declining';
    } else {
      return changePercent < 0 ? 'improving' : 'declining';
    }
  }

  // Format date to YYYY-MM-DD
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get date range for periods
  static getDateRange(period: 'week' | 'month' | 'quarter' | 'year', fromDate?: Date): { start: Date; end: Date } {
    const end = fromDate || new Date();
    const start = new Date(end);

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  // Calculate percentage of goal completion
  static calculateGoalProgress(currentValue: number, targetValue: number, startValue?: number): number {
    if (startValue !== undefined) {
      const totalChange = targetValue - startValue;
      const currentChange = currentValue - startValue;
      return Math.round((currentChange / totalChange) * 100);
    } else {
      return Math.round((currentValue / targetValue) * 100);
    }
  }
} 