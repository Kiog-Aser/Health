import * as SQLite from 'expo-sqlite';
import { FoodEntry, WorkoutEntry, BiomarkerEntry, Goal, UserProfile, DailyStats, HealthReport, AIInsight } from '../types';
import { Exercise, ExerciseSet } from './exerciseDatabase';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('healthtracker.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // User Profile Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        height REAL NOT NULL,
        activity_level TEXT NOT NULL,
        preferences TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // Food Entries Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS food_entries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL NOT NULL,
        sugar REAL NOT NULL,
        sodium REAL NOT NULL,
        image_uri TEXT,
        timestamp INTEGER NOT NULL,
        meal_type TEXT NOT NULL,
        confidence REAL,
        ai_analysis TEXT
      );
    `);

    // Workout Entries Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_entries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        calories REAL NOT NULL,
        intensity TEXT NOT NULL,
        exercises TEXT,
        notes TEXT,
        timestamp INTEGER NOT NULL
      );
    `);

    // Custom Exercises Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        muscle_groups TEXT NOT NULL,
        equipment TEXT NOT NULL,
        instructions TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        calories_per_minute REAL NOT NULL,
        description TEXT NOT NULL,
        tips TEXT,
        variations TEXT,
        safety_notes TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    // Exercise Sets Table (for tracking individual exercise performance)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercise_sets (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        sets INTEGER,
        reps INTEGER,
        weight REAL,
        duration INTEGER,
        distance REAL,
        rest_time INTEGER,
        notes TEXT,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workout_entries (id)
      );
    `);

    // Biomarker Entries Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS biomarker_entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        notes TEXT
      );
    `);

    // Goals Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL NOT NULL,
        unit TEXT NOT NULL,
        target_date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        is_completed BOOLEAN NOT NULL,
        milestones TEXT
      );
    `);

    // Daily Stats Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        calories_consumed REAL NOT NULL,
        calories_burned REAL NOT NULL,
        calories_target REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL NOT NULL,
        water REAL NOT NULL,
        steps INTEGER NOT NULL,
        workout_minutes INTEGER NOT NULL,
        sleep_hours REAL NOT NULL
      );
    `);

    // Health Reports Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS health_reports (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        summary TEXT NOT NULL,
        generated_at INTEGER NOT NULL
      );
    `);

    // AI Insights Table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        timestamp INTEGER NOT NULL,
        is_read BOOLEAN NOT NULL
      );
    `);
  }

  // User Profile Methods
  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_profile 
       (id, name, age, gender, height, activity_level, preferences, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.name,
        profile.age,
        profile.gender,
        profile.height,
        profile.activityLevel,
        JSON.stringify(profile.preferences),
        profile.createdAt
      ]
    );
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(
      'SELECT * FROM user_profile LIMIT 1'
    ) as any;

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      age: result.age,
      gender: result.gender,
      height: result.height,
      activityLevel: result.activity_level,
      preferences: JSON.parse(result.preferences),
      createdAt: result.created_at
    };
  }

  // Food Entry Methods
  async addFoodEntry(entry: FoodEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO food_entries 
       (id, name, calories, protein, carbs, fat, fiber, sugar, sodium, image_uri, timestamp, meal_type, confidence, ai_analysis) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.name,
        entry.calories,
        entry.protein,
        entry.carbs,
        entry.fat,
        entry.fiber,
        entry.sugar,
        entry.sodium,
        entry.imageUri || null,
        entry.timestamp,
        entry.mealType,
        entry.confidence || null,
        entry.aiAnalysis || null
      ]
    );
  }

  async getFoodEntries(startDate?: number, endDate?: number): Promise<FoodEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = 'SELECT * FROM food_entries';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE timestamp BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE timestamp >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' WHERE timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC';

    const result = await this.db.getAllAsync(query, params);
    
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      sodium: row.sodium,
      imageUri: row.image_uri,
      timestamp: row.timestamp,
      mealType: row.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      confidence: row.confidence,
      aiAnalysis: row.ai_analysis
    }));
  }

  async deleteFoodEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
  }

  // Workout Entry Methods
  async addWorkoutEntry(entry: WorkoutEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO workout_entries 
       (id, name, type, duration, calories, intensity, exercises, notes, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.name,
        entry.type,
        entry.duration,
        entry.calories,
        entry.intensity,
        JSON.stringify(entry.exercises || []),
        entry.notes || null,
        entry.timestamp
      ]
    );
  }

  async getWorkoutEntries(startDate?: number, endDate?: number): Promise<WorkoutEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = 'SELECT * FROM workout_entries';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE timestamp BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY timestamp DESC';

    const results = await this.db.getAllAsync(query, params) as any[];

    return results.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      duration: row.duration,
      calories: row.calories,
      intensity: row.intensity,
      exercises: JSON.parse(row.exercises || '[]'),
      notes: row.notes,
      timestamp: row.timestamp
    }));
  }

  // Biomarker Entry Methods
  async addBiomarkerEntry(entry: BiomarkerEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO biomarker_entries (id, type, value, unit, timestamp, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.type, entry.value, entry.unit, entry.timestamp, entry.notes || null]
    );
  }

  async getBiomarkerEntries(type?: string, startDate?: number, endDate?: number): Promise<BiomarkerEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = 'SELECT * FROM biomarker_entries';
    const params: any[] = [];

    const conditions: string[] = [];
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    if (startDate && endDate) {
      conditions.push('timestamp BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp DESC';

    const results = await this.db.getAllAsync(query, params) as any[];

    return results.map(row => ({
      id: row.id,
      type: row.type,
      value: row.value,
      unit: row.unit,
      timestamp: row.timestamp,
      notes: row.notes
    }));
  }

  // Goal Methods
  async addGoal(goal: Goal): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO goals 
       (id, title, description, type, target_value, current_value, unit, target_date, created_at, is_completed, milestones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.title,
        goal.description,
        goal.type,
        goal.targetValue,
        goal.currentValue,
        goal.unit,
        goal.targetDate,
        goal.createdAt,
        goal.isCompleted ? 1 : 0,
        JSON.stringify(goal.milestones || [])
      ]
    );
  }

  async updateGoal(goal: Goal): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `UPDATE goals SET 
       title = ?, description = ?, target_value = ?, current_value = ?, 
       unit = ?, target_date = ?, is_completed = ?, milestones = ?
       WHERE id = ?`,
      [
        goal.title,
        goal.description,
        goal.targetValue,
        goal.currentValue,
        goal.unit,
        goal.targetDate,
        goal.isCompleted ? 1 : 0,
        JSON.stringify(goal.milestones || []),
        goal.id
      ]
    );
  }

  async getGoals(): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync('SELECT * FROM goals ORDER BY created_at DESC') as any[];

    return results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      targetValue: row.target_value,
      currentValue: row.current_value,
      unit: row.unit,
      targetDate: row.target_date,
      createdAt: row.created_at,
      isCompleted: Boolean(row.is_completed),
      milestones: JSON.parse(row.milestones || '[]')
    }));
  }

  // Daily Stats Methods
  async saveDailyStats(stats: DailyStats): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO daily_stats 
       (date, calories_consumed, calories_burned, calories_target, protein, carbs, fat, fiber, water, steps, workout_minutes, sleep_hours) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stats.date,
        stats.calories.consumed,
        stats.calories.burned,
        stats.calories.target,
        stats.macros.protein,
        stats.macros.carbs,
        stats.macros.fat,
        stats.macros.fiber,
        stats.water,
        stats.steps,
        stats.workoutMinutes,
        stats.sleepHours
      ]
    );
  }

  async getDailyStats(date: string): Promise<DailyStats | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(
      'SELECT * FROM daily_stats WHERE date = ?',
      [date]
    ) as any;

    if (!result) return null;

    return {
      date: result.date,
      calories: {
        consumed: result.calories_consumed,
        burned: result.calories_burned,
        target: result.calories_target
      },
      macros: {
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber
      },
      water: result.water,
      steps: result.steps,
      workoutMinutes: result.workout_minutes,
      sleepHours: result.sleep_hours
    };
  }

  // AI Insights Methods
  async addAIInsight(insight: AIInsight): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO ai_insights (id, type, title, message, data, timestamp, is_read) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        insight.id,
        insight.type,
        insight.title,
        insight.message,
        JSON.stringify(insight.data || {}),
        insight.timestamp,
        insight.isRead ? 1 : 0
      ]
    );
  }

  async getAIInsights(): Promise<AIInsight[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync(
      'SELECT * FROM ai_insights ORDER BY timestamp DESC LIMIT 50'
    ) as any[];

    return results.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: JSON.parse(row.data || '{}'),
      timestamp: row.timestamp,
      isRead: Boolean(row.is_read)
    }));
  }

  async markInsightAsRead(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'UPDATE ai_insights SET is_read = 1 WHERE id = ?',
      [id]
    );
  }

  // Cleanup and maintenance
  async deleteOldData(olderThanDays: number = 365): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const cutoffDate = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    await this.db.runAsync('DELETE FROM food_entries WHERE timestamp < ?', [cutoffDate]);
    await this.db.runAsync('DELETE FROM workout_entries WHERE timestamp < ?', [cutoffDate]);
    await this.db.runAsync('DELETE FROM biomarker_entries WHERE timestamp < ?', [cutoffDate]);
    await this.db.runAsync('DELETE FROM ai_insights WHERE timestamp < ?', [cutoffDate]);
  }

  // Custom Exercise Methods
  async addCustomExercise(exercise: Exercise): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO custom_exercises 
       (id, name, category, muscle_groups, equipment, instructions, difficulty, calories_per_minute, description, tips, variations, safety_notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exercise.id,
        exercise.name,
        exercise.category,
        JSON.stringify(exercise.muscleGroups),
        JSON.stringify(exercise.equipment),
        JSON.stringify(exercise.instructions),
        exercise.difficulty,
        exercise.caloriesPerMinute,
        exercise.description,
        JSON.stringify(exercise.tips || []),
        JSON.stringify(exercise.variations || []),
        JSON.stringify(exercise.safetyNotes || []),
        Date.now()
      ]
    );
  }

  async getCustomExercises(): Promise<Exercise[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync('SELECT * FROM custom_exercises ORDER BY created_at DESC') as any[];

    return results.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      muscleGroups: JSON.parse(row.muscle_groups),
      equipment: JSON.parse(row.equipment),
      instructions: JSON.parse(row.instructions),
      difficulty: row.difficulty,
      caloriesPerMinute: row.calories_per_minute,
      description: row.description,
      tips: JSON.parse(row.tips || '[]'),
      variations: JSON.parse(row.variations || '[]'),
      safetyNotes: JSON.parse(row.safety_notes || '[]')
    }));
  }

  async deleteCustomExercise(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync('DELETE FROM custom_exercises WHERE id = ?', [id]);
  }

  // Exercise Set Methods
  async addExerciseSet(workoutId: string, exerciseSet: ExerciseSet): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const setId = `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.runAsync(
      `INSERT INTO exercise_sets 
       (id, workout_id, exercise_id, sets, reps, weight, duration, distance, rest_time, notes, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        setId,
        workoutId,
        exerciseSet.exerciseId,
        exerciseSet.sets || null,
        exerciseSet.reps || null,
        exerciseSet.weight || null,
        exerciseSet.duration || null,
        exerciseSet.distance || null,
        exerciseSet.restTime || null,
        exerciseSet.notes || null,
        Date.now()
      ]
    );
  }

  async getExerciseSets(workoutId: string): Promise<ExerciseSet[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync(
      'SELECT * FROM exercise_sets WHERE workout_id = ? ORDER BY timestamp ASC',
      [workoutId]
    ) as any[];

    return results.map(row => ({
      exerciseId: row.exercise_id,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      duration: row.duration,
      distance: row.distance,
      restTime: row.rest_time,
      notes: row.notes
    }));
  }

  async getExerciseHistory(exerciseId: string, limit: number = 10): Promise<ExerciseSet[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync(
      'SELECT * FROM exercise_sets WHERE exercise_id = ? ORDER BY timestamp DESC LIMIT ?',
      [exerciseId, limit]
    ) as any[];

    return results.map(row => ({
      exerciseId: row.exercise_id,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      duration: row.duration,
      distance: row.distance,
      restTime: row.rest_time,
      notes: row.notes
    }));
  }
}

export const databaseService = new DatabaseService(); 