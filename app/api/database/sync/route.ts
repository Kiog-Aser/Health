import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, type, data } = await request.json();

    if (!connectionString || !type || !data) {
      return NextResponse.json(
        { error: 'Connection string, type, and data are required' },
        { status: 400 }
      );
    }

    if (type !== 'postgresql') {
      return NextResponse.json(
        { error: 'Only PostgreSQL is supported currently' },
        { status: 400 }
      );
    }

    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 10000, // 10 second timeout for sync
    });

    try {
      await client.connect();
      
      // Initialize schema if needed
      await initializeSchema(client);
      
      // Sync all data
      const syncedCounts = await syncAllData(client, data);
      
      await client.end();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Data synced successfully to your database!',
        syncedCounts
      });

    } catch (dbError: any) {
      console.error('Database sync failed:', dbError);
      
      try {
        await client.end();
      } catch (endError) {
        // Ignore cleanup errors
      }
      
      return NextResponse.json(
        { error: `Sync failed: ${dbError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

async function initializeSchema(client: Client) {
  const schema = `
    CREATE TABLE IF NOT EXISTS user_profiles (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      age INTEGER,
      gender VARCHAR(20),
      height REAL,
      activity_level VARCHAR(50),
      preferences JSONB,
      created_at BIGINT,
      updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    CREATE TABLE IF NOT EXISTS food_entries (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      calories REAL,
      protein REAL,
      carbs REAL,
      fat REAL,
      fiber REAL,
      sugar REAL,
      sodium REAL,
      image_uri TEXT,
      timestamp BIGINT,
      meal_type VARCHAR(50),
      confidence REAL,
      ai_analysis TEXT,
      portion_multiplier REAL,
      portion_unit VARCHAR(50),
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    CREATE TABLE IF NOT EXISTS workout_entries (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50),
      duration INTEGER,
      calories REAL,
      intensity VARCHAR(20),
      exercises JSONB,
      notes TEXT,
      timestamp BIGINT,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    CREATE TABLE IF NOT EXISTS biomarker_entries (
      id VARCHAR(255) PRIMARY KEY,
      type VARCHAR(50),
      value REAL,
      unit VARCHAR(20),
      timestamp BIGINT,
      notes TEXT,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      type VARCHAR(50),
      target_value REAL,
      current_value REAL,
      unit VARCHAR(20),
      target_date BIGINT,
      created_at BIGINT,
      is_completed BOOLEAN,
      milestones JSONB,
      updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    CREATE INDEX IF NOT EXISTS idx_food_entries_timestamp ON food_entries(timestamp);
    CREATE INDEX IF NOT EXISTS idx_workout_entries_timestamp ON workout_entries(timestamp);
    CREATE INDEX IF NOT EXISTS idx_biomarker_entries_timestamp ON biomarker_entries(timestamp);
    CREATE INDEX IF NOT EXISTS idx_biomarker_entries_type ON biomarker_entries(type);
  `;

  // Execute schema creation (split by semicolon to handle multiple statements)
  const statements = schema.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await client.query(statement);
    }
  }
}

async function syncAllData(client: Client, data: any) {
  const syncedCounts = {
    userProfile: 0,
    foodEntries: 0,
    workoutEntries: 0,
    biomarkerEntries: 0,
    goals: 0
  };

  // Sync user profile
  if (data.userProfile) {
    await client.query(`
      INSERT INTO user_profiles (id, name, age, gender, height, activity_level, preferences, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height = EXCLUDED.height,
        activity_level = EXCLUDED.activity_level,
        preferences = EXCLUDED.preferences,
        updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
    `, [
      data.userProfile.id,
      data.userProfile.name,
      data.userProfile.age,
      data.userProfile.gender,
      data.userProfile.height,
      data.userProfile.activityLevel,
      JSON.stringify(data.userProfile.preferences),
      data.userProfile.createdAt
    ]);
    syncedCounts.userProfile = 1;
  }

  // Sync food entries
  for (const entry of data.foodEntries || []) {
    await client.query(`
      INSERT INTO food_entries (
        id, name, calories, protein, carbs, fat, fiber, sugar, sodium,
        image_uri, timestamp, meal_type, confidence, ai_analysis,
        portion_multiplier, portion_unit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO NOTHING
    `, [
      entry.id, entry.name, entry.calories, entry.protein, entry.carbs,
      entry.fat, entry.fiber, entry.sugar, entry.sodium, entry.imageUri,
      entry.timestamp, entry.mealType, entry.confidence, entry.aiAnalysis,
      entry.portionMultiplier, entry.portionUnit
    ]);
    syncedCounts.foodEntries++;
  }

  // Sync workout entries
  for (const entry of data.workoutEntries || []) {
    await client.query(`
      INSERT INTO workout_entries (
        id, name, type, duration, calories, intensity, exercises, notes, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      entry.id, entry.name, entry.type, entry.duration, entry.calories,
      entry.intensity, JSON.stringify(entry.exercises), entry.notes, entry.timestamp
    ]);
    syncedCounts.workoutEntries++;
  }

  // Sync biomarker entries
  for (const entry of data.biomarkerEntries || []) {
    await client.query(`
      INSERT INTO biomarker_entries (id, type, value, unit, timestamp, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      entry.id, entry.type, entry.value, entry.unit, entry.timestamp, entry.notes
    ]);
    syncedCounts.biomarkerEntries++;
  }

  // Sync goals
  for (const goal of data.goals || []) {
    await client.query(`
      INSERT INTO goals (
        id, title, description, type, target_value, current_value,
        unit, target_date, created_at, is_completed, milestones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        current_value = EXCLUDED.current_value,
        is_completed = EXCLUDED.is_completed,
        updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
    `, [
      goal.id, goal.title, goal.description, goal.type, goal.targetValue,
      goal.currentValue, goal.unit, goal.targetDate, goal.createdAt,
      goal.isCompleted, JSON.stringify(goal.milestones)
    ]);
    syncedCounts.goals++;
  }

  return syncedCounts;
} 