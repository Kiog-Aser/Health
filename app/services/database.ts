import { 
  FoodEntry, 
  WorkoutEntry, 
  BiomarkerEntry, 
  Goal, 
  UserProfile, 
  DailyStats, 
  HealthReport, 
  AIInsight,
  Exercise,
  ExerciseSet 
} from '../types';

class DatabaseService {
  private isInitialized = false;

  async init() {
    try {
      if (typeof window === 'undefined') {
        console.log('Database init skipped - server side');
        return;
      }
      
      // Initialize default data if needed
      await this.initializeDefaultData();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async initializeDefaultData() {
    // Initialize empty arrays for all data types if they don't exist
    const dataTypes = [
      'userProfile',
      'foodEntries',
      'workoutEntries',
      'biomarkerEntries',
      'goals',
      'dailyStats',
      'healthReports',
      'aiInsights',
      'customExercises',
      'exerciseSets'
    ];

    dataTypes.forEach(type => {
      if (!localStorage.getItem(type)) {
        if (type === 'userProfile') {
          // Don't initialize user profile by default
          return;
        } else {
          localStorage.setItem(type, JSON.stringify([]));
        }
      }
    });
  }

  // User Profile Methods
  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('userProfile');
    return data ? JSON.parse(data) : null;
  }

  // Food Entry Methods
  async addFoodEntry(entry: FoodEntry): Promise<void> {
    if (typeof window === 'undefined') return;
    const entries = await this.getFoodEntries();
    entries.push(entry);
    localStorage.setItem('foodEntries', JSON.stringify(entries));
  }

  async getFoodEntries(startDate?: number, endDate?: number): Promise<FoodEntry[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('foodEntries');
    let entries: FoodEntry[] = data ? JSON.parse(data) : [];

    if (startDate || endDate) {
      entries = entries.filter(entry => {
        const entryTime = entry.timestamp;
        if (startDate && entryTime < startDate) return false;
        if (endDate && entryTime > endDate) return false;
        return true;
      });
    }

    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateFoodEntry(entry: FoodEntry): Promise<void> {
    if (typeof window === 'undefined') return;
    const entries = await this.getFoodEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
      entries[index] = entry;
      localStorage.setItem('foodEntries', JSON.stringify(entries));
    }
  }

  async deleteFoodEntry(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const entries = await this.getFoodEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('foodEntries', JSON.stringify(filteredEntries));
  }

  // Workout Entry Methods
  async addWorkoutEntry(entry: WorkoutEntry): Promise<void> {
    if (typeof window === 'undefined') return;
    const entries = await this.getWorkoutEntries();
    entries.push(entry);
    localStorage.setItem('workoutEntries', JSON.stringify(entries));
  }

  async getWorkoutEntries(startDate?: number, endDate?: number): Promise<WorkoutEntry[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('workoutEntries');
    let entries: WorkoutEntry[] = data ? JSON.parse(data) : [];

    if (startDate || endDate) {
      entries = entries.filter(entry => {
        const entryTime = entry.timestamp;
        if (startDate && entryTime < startDate) return false;
        if (endDate && entryTime > endDate) return false;
        return true;
      });
    }

    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteWorkoutEntry(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const entries = await this.getWorkoutEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('workoutEntries', JSON.stringify(filteredEntries));
  }

  // Biomarker Entry Methods
  async addBiomarkerEntry(entry: BiomarkerEntry): Promise<void> {
    if (typeof window === 'undefined') return;
    const entries = await this.getBiomarkerEntries();
    entries.push(entry);
    localStorage.setItem('biomarkerEntries', JSON.stringify(entries));
  }

  async getBiomarkerEntries(type?: string, startDate?: number, endDate?: number): Promise<BiomarkerEntry[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('biomarkerEntries');
    let entries: BiomarkerEntry[] = data ? JSON.parse(data) : [];

    if (type) {
      entries = entries.filter(entry => entry.type === type);
    }

    if (startDate || endDate) {
      entries = entries.filter(entry => {
        const entryTime = entry.timestamp;
        if (startDate && entryTime < startDate) return false;
        if (endDate && entryTime > endDate) return false;
        return true;
      });
    }

    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteBiomarkerEntry(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const entries = await this.getBiomarkerEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('biomarkerEntries', JSON.stringify(filteredEntries));
  }

  // Goal Methods
  async addGoal(goal: Goal): Promise<void> {
    if (typeof window === 'undefined') return;
    const goals = await this.getGoals();
    goals.push(goal);
    localStorage.setItem('goals', JSON.stringify(goals));
  }

  async updateGoal(goal: Goal): Promise<void> {
    if (typeof window === 'undefined') return;
    const goals = await this.getGoals();
    const index = goals.findIndex(g => g.id === goal.id);
    if (index !== -1) {
      goals[index] = goal;
      localStorage.setItem('goals', JSON.stringify(goals));
    }
  }

  async getGoals(): Promise<Goal[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('goals');
    const goals: Goal[] = data ? JSON.parse(data) : [];
    return goals.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteGoal(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const goals = await this.getGoals();
    const filteredGoals = goals.filter(goal => goal.id !== id);
    localStorage.setItem('goals', JSON.stringify(filteredGoals));
  }

  // Daily Stats Methods
  async saveDailyStats(stats: DailyStats): Promise<void> {
    if (typeof window === 'undefined') return;
    const allStats = await this.getAllDailyStats();
    const existingIndex = allStats.findIndex(s => s.date === stats.date);
    
    if (existingIndex !== -1) {
      allStats[existingIndex] = stats;
    } else {
      allStats.push(stats);
    }
    
    localStorage.setItem('dailyStats', JSON.stringify(allStats));
  }

  async getDailyStats(date: string): Promise<DailyStats | null> {
    if (typeof window === 'undefined') return null;
    const allStats = await this.getAllDailyStats();
    return allStats.find(stats => stats.date === date) || null;
  }

  async getAllDailyStats(): Promise<DailyStats[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('dailyStats');
    return data ? JSON.parse(data) : [];
  }

  // AI Insights Methods
  async addAIInsight(insight: AIInsight): Promise<void> {
    if (typeof window === 'undefined') return;
    const insights = await this.getAIInsights();
    insights.unshift(insight); // Add to beginning for latest first
    localStorage.setItem('aiInsights', JSON.stringify(insights));
  }

  async getAIInsights(): Promise<AIInsight[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('aiInsights');
    return data ? JSON.parse(data) : [];
  }

  async markInsightAsRead(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const insights = await this.getAIInsights();
    const insight = insights.find(i => i.id === id);
    if (insight) {
      insight.isRead = true;
      localStorage.setItem('aiInsights', JSON.stringify(insights));
    }
  }

  async deleteInsight(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const insights = await this.getAIInsights();
    const filteredInsights = insights.filter(insight => insight.id !== id);
    localStorage.setItem('aiInsights', JSON.stringify(filteredInsights));
  }

  // Exercise Methods
  async addCustomExercise(exercise: Exercise): Promise<void> {
    if (typeof window === 'undefined') return;
    const exercises = await this.getCustomExercises();
    exercises.push(exercise);
    localStorage.setItem('customExercises', JSON.stringify(exercises));
  }

  async getCustomExercises(): Promise<Exercise[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('customExercises');
    return data ? JSON.parse(data) : [];
  }

  async deleteCustomExercise(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const exercises = await this.getCustomExercises();
    const filteredExercises = exercises.filter(exercise => exercise.id !== id);
    localStorage.setItem('customExercises', JSON.stringify(filteredExercises));
  }

  // Exercise Sets Methods
  async addExerciseSet(exerciseSet: ExerciseSet): Promise<void> {
    if (typeof window === 'undefined') return;
    const sets = await this.getAllExerciseSets();
    sets.push(exerciseSet);
    localStorage.setItem('exerciseSets', JSON.stringify(sets));
  }

  async getExerciseSets(workoutId: string): Promise<ExerciseSet[]> {
    if (typeof window === 'undefined') return [];
    const allSets = await this.getAllExerciseSets();
    return allSets.filter(set => set.workoutId === workoutId);
  }

  async getAllExerciseSets(): Promise<ExerciseSet[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('exerciseSets');
    return data ? JSON.parse(data) : [];
  }

  async getExerciseHistory(exerciseId: string, limit: number = 10): Promise<ExerciseSet[]> {
    if (typeof window === 'undefined') return [];
    const allSets = await this.getAllExerciseSets();
    return allSets
      .filter(set => set.exerciseId === exerciseId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Utility Methods
  async deleteOldData(olderThanDays: number = 365): Promise<void> {
    if (typeof window === 'undefined') return;
    const cutoffDate = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    // Clean up old insights
    const insights = await this.getAIInsights();
    const recentInsights = insights.filter(insight => insight.timestamp > cutoffDate);
    localStorage.setItem('aiInsights', JSON.stringify(recentInsights));
    
    // Clean up old food entries
    const foodEntries = await this.getFoodEntries();
    const recentFoodEntries = foodEntries.filter(entry => entry.timestamp > cutoffDate);
    localStorage.setItem('foodEntries', JSON.stringify(recentFoodEntries));
    
    // Clean up old workout entries
    const workoutEntries = await this.getWorkoutEntries();
    const recentWorkoutEntries = workoutEntries.filter(entry => entry.timestamp > cutoffDate);
    localStorage.setItem('workoutEntries', JSON.stringify(recentWorkoutEntries));
  }

  async exportData(): Promise<string> {
    if (typeof window === 'undefined') return '{}';
    const data = {
      userProfile: await this.getUserProfile(),
      foodEntries: await this.getFoodEntries(),
      workoutEntries: await this.getWorkoutEntries(),
      biomarkerEntries: await this.getBiomarkerEntries(),
      goals: await this.getGoals(),
      dailyStats: await this.getAllDailyStats(),
      aiInsights: await this.getAIInsights(),
      customExercises: await this.getCustomExercises(),
      exerciseSets: await this.getAllExerciseSets(),
      exportedAt: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userProfile) {
        await this.saveUserProfile(data.userProfile);
      }
      
      if (data.foodEntries) {
        localStorage.setItem('foodEntries', JSON.stringify(data.foodEntries));
      }
      
      if (data.workoutEntries) {
        localStorage.setItem('workoutEntries', JSON.stringify(data.workoutEntries));
      }
      
      if (data.biomarkerEntries) {
        localStorage.setItem('biomarkerEntries', JSON.stringify(data.biomarkerEntries));
      }
      
      if (data.goals) {
        localStorage.setItem('goals', JSON.stringify(data.goals));
      }
      
      if (data.dailyStats) {
        localStorage.setItem('dailyStats', JSON.stringify(data.dailyStats));
      }
      
      if (data.aiInsights) {
        localStorage.setItem('aiInsights', JSON.stringify(data.aiInsights));
      }
      
      if (data.customExercises) {
        localStorage.setItem('customExercises', JSON.stringify(data.customExercises));
      }
      
      if (data.exerciseSets) {
        localStorage.setItem('exerciseSets', JSON.stringify(data.exerciseSets));
      }
      
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService(); 