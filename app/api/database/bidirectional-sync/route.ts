import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Helper function to safely parse JSON data
function safeJsonParse(data: any): any {
  if (data === null || data === undefined) {
    return undefined;
  }
  
  // If it's already an object, return it as is
  if (typeof data === 'object') {
    return data;
  }
  
  // If it's a string, try to parse it
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing JSON:', error, 'Data:', data);
      return undefined;
    }
  }
  
  return undefined;
}

// Helper function to safely stringify JSON data
function safeJsonStringify(data: any): string | null {
  if (data === null || data === undefined) {
    return null;
  }
  
  // If it's already a string, return it as is
  if (typeof data === 'string') {
    return data;
  }
  
  // If it's an object, stringify it
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error stringifying JSON:', error, 'Data:', data);
    return null;
  }
}

interface SyncData {
  foodEntries: any[];
  workoutEntries: any[];
  biomarkerEntries: any[];
  goals: any[];
  userProfile: any;
}

export async function POST(request: NextRequest) {
  try {
    const { connectionString, type, localData, lastSyncTimestamp } = await request.json();

    console.log('=== SYNC DEBUG INFO ===');
    console.log('lastSyncTimestamp:', lastSyncTimestamp);
    console.log('lastSyncTimestamp as date:', new Date(lastSyncTimestamp));
    console.log('Current time:', Date.now());
    console.log('Current time as date:', new Date());
    console.log('Local data food entries count:', localData.foodEntries?.length || 0);
    console.log('Local data goals count:', localData.goals?.length || 0);
    
    // Check if this is a first sync (lastSyncTimestamp is 0 or very old)
    const isFirstSync = lastSyncTimestamp < (Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    console.log('Is first sync?', isFirstSync);

    // Create database connection
    const client = new Client({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Database connection successful');

    // Ensure tables exist
    await ensureTablesExist(client);
    console.log('Tables ensured');

    // Perform the bidirectional sync
    const result = await performBidirectionalSync(client, localData, lastSyncTimestamp, isFirstSync);
    
    await client.end();

    console.log('=== SYNC RESULT ===');
    console.log('Synced counts:', result.syncedCounts);
    console.log('Pulled counts:', result.pullCounts);

    return NextResponse.json({
      success: true,
      message: 'Bidirectional sync completed successfully',
      syncedCounts: result.syncedCounts,
      pullCounts: result.pullCounts,
      pulledData: result.pulledData
    });

  } catch (error) {
    console.error('Bidirectional sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Sync failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function ensureTablesExist(client: Client) {
  const createTableQueries = [
    `CREATE TABLE IF NOT EXISTS food_entries (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      calories DECIMAL NOT NULL,
      protein DECIMAL NOT NULL,
      carbs DECIMAL NOT NULL,
      fat DECIMAL NOT NULL,
      fiber DECIMAL NOT NULL,
      sugar DECIMAL NOT NULL,
      sodium DECIMAL NOT NULL,
      image_uri TEXT,
      timestamp BIGINT NOT NULL,
      meal_type VARCHAR NOT NULL,
      confidence DECIMAL,
      ai_analysis TEXT,
      portion_multiplier DECIMAL,
      portion_unit VARCHAR,
      base_calories DECIMAL,
      base_protein DECIMAL,
      base_carbs DECIMAL,
      base_fat DECIMAL,
      base_fiber DECIMAL,
      base_sugar DECIMAL,
      base_sodium DECIMAL,
      show_manual_nutrition BOOLEAN,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    )`,
    
    `CREATE TABLE IF NOT EXISTS workout_entries (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      duration INTEGER NOT NULL,
      calories DECIMAL NOT NULL,
      intensity VARCHAR NOT NULL,
      exercises JSONB,
      notes TEXT,
      timestamp BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    )`,
    
    `CREATE TABLE IF NOT EXISTS biomarker_entries (
      id VARCHAR PRIMARY KEY,
      type VARCHAR NOT NULL,
      value DECIMAL NOT NULL,
      unit VARCHAR NOT NULL,
      timestamp BIGINT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    )`,
    
    `CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR PRIMARY KEY,
      title VARCHAR NOT NULL,
      description TEXT,
      type VARCHAR NOT NULL,
      target_value DECIMAL NOT NULL,
      current_value DECIMAL DEFAULT 0,
      unit VARCHAR NOT NULL,
      target_date BIGINT NOT NULL,
      created_at_timestamp BIGINT NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      milestones JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    )`,
    
    `CREATE TABLE IF NOT EXISTS user_profiles (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      age INTEGER,
      gender VARCHAR,
      height DECIMAL,
      activity_level VARCHAR,
      preferences JSONB,
      created_at_timestamp BIGINT NOT NULL,
      updated_at_timestamp BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    )`
  ];

  // Execute table creation
  for (const query of createTableQueries) {
    await client.query(query);
  }

  // Add missing columns to existing tables (migration)
  await migrateDatabaseSchema(client);

  // Create indexes for better performance
  const indexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_food_entries_timestamp ON food_entries(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_food_entries_meal_type ON food_entries(meal_type)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_entries_timestamp ON workout_entries(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_biomarker_entries_timestamp ON biomarker_entries(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_biomarker_entries_type ON biomarker_entries(type)`,
    `CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at_timestamp)`
  ];

  for (const query of indexQueries) {
    await client.query(query);
  }
}

async function migrateDatabaseSchema(client: Client) {
  console.log('Checking for database schema migrations...');
  
  // Helper function to check if column exists and its type
  const checkColumnType = async (tableName: string, columnName: string): Promise<string | null> => {
    try {
      const result = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, columnName]);
      
      return result.rows.length > 0 ? result.rows[0].data_type : null;
    } catch (error) {
      return null;
    }
  };

  // Helper function to safely add or convert updated_at column
  const ensureUpdatedAtColumn = async (tableName: string) => {
    const columnType = await checkColumnType(tableName, 'updated_at');
    console.log(`Table ${tableName}: updated_at column type is ${columnType}`);
    
    if (columnType === null) {
      // Column doesn't exist, add it as BIGINT for consistency
      await client.query(`ALTER TABLE ${tableName} ADD COLUMN updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000`);
      console.log(`Added updated_at column to ${tableName}`);
    } else if (columnType === 'timestamp with time zone' || columnType === 'timestamp without time zone') {
      // Column exists as TIMESTAMP, need to drop and recreate as BIGINT
      console.log(`Converting ${tableName}.updated_at from TIMESTAMP to BIGINT...`);
      
      // For a more reliable conversion, let's drop the column and recreate it
      // This is safer than trying to convert with existing constraints
      await client.query(`ALTER TABLE ${tableName} DROP COLUMN updated_at`);
      await client.query(`ALTER TABLE ${tableName} ADD COLUMN updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000`);
      
      console.log(`Successfully recreated updated_at column in ${tableName} as BIGINT`);
    } else if (columnType === 'bigint') {
      // Column already exists as BIGINT, ensure default value
      console.log(`${tableName}.updated_at is already BIGINT`);
      try {
        await client.query(`ALTER TABLE ${tableName} ALTER COLUMN updated_at SET DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000`);
        console.log(`Updated default value for updated_at column in ${tableName}`);
      } catch (e) {
        console.log(`Default value already set for updated_at column in ${tableName}`);
      }
    }
  };
  
  // Add missing columns to food_entries table
  const foodEntriesMigrations = [
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS base_calories DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS base_protein DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS base_carbs DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS base_fat DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS base_fiber DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS base_sugar DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS base_sodium DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS show_manual_nutrition BOOLEAN',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS portion_multiplier DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS portion_unit VARCHAR',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS confidence DECIMAL',
    'ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS ai_analysis TEXT'
  ];

  // Add missing columns to other tables
  const otherMigrations = [
    'ALTER TABLE goals ADD COLUMN IF NOT EXISTS created_at_timestamp BIGINT',
    'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at_timestamp BIGINT',
    'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at_timestamp BIGINT'
  ];

  // Execute all migrations first
  const allMigrations = [...foodEntriesMigrations, ...otherMigrations];
  
  for (const migration of allMigrations) {
    try {
      await client.query(migration);
    } catch (error: any) {
      // Ignore "column already exists" errors
      if (!error.message.includes('already exists')) {
        console.error('Migration error:', migration, error.message);
      }
    }
  }

  // Handle updated_at columns for all tables
  const tables = ['food_entries', 'workout_entries', 'biomarker_entries', 'goals', 'user_profiles'];
  for (const table of tables) {
    try {
      await ensureUpdatedAtColumn(table);
    } catch (error: any) {
      console.error(`Error ensuring updated_at column in ${table}:`, error.message);
    }
  }

  console.log('Database schema migrations completed');
}

async function performBidirectionalSync(client: Client, localData: SyncData, lastSyncTimestamp: number, isFirstSync: boolean) {
  const syncedCounts = {
    foodEntries: 0,
    workoutEntries: 0,
    biomarkerEntries: 0,
    goals: 0,
    userProfile: 0
  };

  const pullCounts = {
    foodEntries: 0,
    workoutEntries: 0,
    biomarkerEntries: 0,
    goals: 0,
    userProfile: 0
  };

  const pulledData = {
    foodEntries: [] as any[],
    workoutEntries: [] as any[],
    biomarkerEntries: [] as any[],
    goals: [] as any[],
    userProfile: null as any
  };

  // Helper function to check if column exists and its type
  const checkColumnType = async (tableName: string, columnName: string): Promise<string | null> => {
    try {
      const result = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, columnName]);
      
      return result.rows.length > 0 ? result.rows[0].data_type : null;
    } catch (error) {
      return null;
    }
  };

  console.log('=== PUSH PHASE ===');
  
  // 1. Push local changes to remote (items newer than lastSyncTimestamp)
  
  // Food Entries
  if (localData.foodEntries) {
    console.log('Processing', localData.foodEntries.length, 'local food entries');
    for (const entry of localData.foodEntries) {
      console.log(`Food entry ${entry.id}: timestamp=${entry.timestamp}, lastSync=${lastSyncTimestamp}, newer=${entry.timestamp > lastSyncTimestamp}`);
      
      // For first sync, sync all items from today (last 24 hours)
      const shouldSync = isFirstSync ? 
        (entry.timestamp > (Date.now() - 24 * 60 * 60 * 1000)) : 
        (entry.timestamp > lastSyncTimestamp);
        
      if (shouldSync) {
        console.log(`Syncing food entry: ${entry.name}`);
        try {
          const now = Date.now();
          await client.query(
          `INSERT INTO food_entries (
            id, name, calories, protein, carbs, fat, fiber, sugar, sodium,
            image_uri, timestamp, meal_type, confidence, ai_analysis,
            portion_multiplier, portion_unit, base_calories, base_protein,
            base_carbs, base_fat, base_fiber, base_sugar, base_sodium,
            show_manual_nutrition, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            calories = EXCLUDED.calories,
            protein = EXCLUDED.protein,
            carbs = EXCLUDED.carbs,
            fat = EXCLUDED.fat,
            fiber = EXCLUDED.fiber,
            sugar = EXCLUDED.sugar,
            sodium = EXCLUDED.sodium,
            image_uri = EXCLUDED.image_uri,
            timestamp = EXCLUDED.timestamp,
            meal_type = EXCLUDED.meal_type,
            confidence = EXCLUDED.confidence,
            ai_analysis = EXCLUDED.ai_analysis,
            portion_multiplier = EXCLUDED.portion_multiplier,
            portion_unit = EXCLUDED.portion_unit,
            base_calories = EXCLUDED.base_calories,
            base_protein = EXCLUDED.base_protein,
            base_carbs = EXCLUDED.base_carbs,
            base_fat = EXCLUDED.base_fat,
            base_fiber = EXCLUDED.base_fiber,
            base_sugar = EXCLUDED.base_sugar,
            base_sodium = EXCLUDED.base_sodium,
            show_manual_nutrition = EXCLUDED.show_manual_nutrition,
            updated_at = $25`,
          [
            entry.id, entry.name, entry.calories, entry.protein, entry.carbs,
            entry.fat, entry.fiber, entry.sugar, entry.sodium, entry.imageUri,
            entry.timestamp, entry.mealType, entry.confidence, entry.aiAnalysis,
            entry.portionMultiplier, entry.portionUnit, entry.baseCalories,
            entry.baseProtein, entry.baseCarbs, entry.baseFat, entry.baseFiber,
            entry.baseSugar, entry.baseSodium, entry.showManualNutrition, now
          ]
        );
        syncedCounts.foodEntries++;
        } catch (error) {
          console.error(`Failed to sync food entry ${entry.name}:`, error);
          throw error; // Re-throw to stop the sync process
        }
      }
    }
  }

  // Workout Entries
  if (localData.workoutEntries) {
    console.log('Processing', localData.workoutEntries.length, 'local workout entries');
    for (const entry of localData.workoutEntries) {
      const shouldSync = isFirstSync ? 
        (entry.timestamp > (Date.now() - 24 * 60 * 60 * 1000)) : 
        (entry.timestamp > lastSyncTimestamp);
        
      if (shouldSync) {
        console.log(`Syncing workout entry: ${entry.name}`);
        const now = Date.now();
        await client.query(
          `INSERT INTO workout_entries (id, name, type, duration, calories, intensity, exercises, notes, timestamp, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             type = EXCLUDED.type,
             duration = EXCLUDED.duration,
             calories = EXCLUDED.calories,
             intensity = EXCLUDED.intensity,
             exercises = EXCLUDED.exercises,
             notes = EXCLUDED.notes,
             timestamp = EXCLUDED.timestamp,
             updated_at = $10`,
          [entry.id, entry.name, entry.type, entry.duration, entry.calories, entry.intensity, safeJsonStringify(entry.exercises), entry.notes, entry.timestamp, now]
        );
        syncedCounts.workoutEntries++;
      }
    }
  }

  // Biomarker Entries
  if (localData.biomarkerEntries) {
    console.log('Processing', localData.biomarkerEntries.length, 'local biomarker entries');
    for (const entry of localData.biomarkerEntries) {
      const shouldSync = isFirstSync ? 
        (entry.timestamp > (Date.now() - 24 * 60 * 60 * 1000)) : 
        (entry.timestamp > lastSyncTimestamp);
        
      if (shouldSync) {
        console.log(`Syncing biomarker entry: ${entry.type} = ${entry.value}`);
        const now = Date.now();
        await client.query(
          `INSERT INTO biomarker_entries (id, type, value, unit, timestamp, notes, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             type = EXCLUDED.type,
             value = EXCLUDED.value,
             unit = EXCLUDED.unit,
             timestamp = EXCLUDED.timestamp,
             notes = EXCLUDED.notes,
             updated_at = $7`,
          [entry.id, entry.type, entry.value, entry.unit, entry.timestamp, entry.notes, now]
        );
        syncedCounts.biomarkerEntries++;
      }
    }
  }

  // Goals
  if (localData.goals) {
    console.log('Processing', localData.goals.length, 'local goals');
    for (const goal of localData.goals) {
      const shouldSync = isFirstSync ? 
        (goal.createdAt > (Date.now() - 30 * 24 * 60 * 60 * 1000)) : // 30 days for goals
        (goal.createdAt > lastSyncTimestamp);
        
      if (shouldSync) {
        console.log(`Syncing goal: ${goal.title}`);
        const now = Date.now();
        await client.query(
          `INSERT INTO goals (id, title, description, type, target_value, current_value, unit, target_date, created_at_timestamp, is_completed, milestones, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             type = EXCLUDED.type,
             target_value = EXCLUDED.target_value,
             current_value = EXCLUDED.current_value,
             unit = EXCLUDED.unit,
             target_date = EXCLUDED.target_date,
             is_completed = EXCLUDED.is_completed,
             milestones = EXCLUDED.milestones,
             updated_at = $12`,
          [goal.id, goal.title, goal.description, goal.type, goal.targetValue, goal.currentValue, goal.unit, goal.targetDate, goal.createdAt, goal.isCompleted, safeJsonStringify(goal.milestones), now]
        );
        syncedCounts.goals++;
      }
    }
  }

  // User Profile
  if (localData.userProfile) {
    const shouldSync = isFirstSync || (localData.userProfile.createdAt > lastSyncTimestamp);
    if (shouldSync) {
      console.log(`Syncing user profile: ${localData.userProfile.name}`);
      const now = Date.now();
      await client.query(
        `INSERT INTO user_profiles (id, name, age, gender, height, activity_level, preferences, created_at_timestamp, updated_at_timestamp, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           age = EXCLUDED.age,
           gender = EXCLUDED.gender,
           height = EXCLUDED.height,
           activity_level = EXCLUDED.activity_level,
           preferences = EXCLUDED.preferences,
           updated_at_timestamp = EXCLUDED.updated_at_timestamp,
           updated_at = $10`,
        [
          localData.userProfile.id,
          localData.userProfile.name,
          localData.userProfile.age,
          localData.userProfile.gender,
          localData.userProfile.height,
          localData.userProfile.activityLevel,
          safeJsonStringify(localData.userProfile.preferences),
          localData.userProfile.createdAt,
          localData.userProfile.updatedAt || localData.userProfile.createdAt,
          now
        ]
      );
      syncedCounts.userProfile++;
    }
  }

  console.log('=== PULL PHASE ===');
  
  // 2. Pull remote changes since lastSyncTimestamp (or recent data for first sync)
  // For cross-device sync, we need to pull data that might be older than lastSyncTimestamp
  // to catch data that was created on other devices
  
  let effectivePullTimestamp: number;
  
  if (isFirstSync) {
    // For first sync, pull data from the last 7 days
    effectivePullTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    console.log('First sync: pulling data from last 7 days');
  } else {
    // For regular sync, use a more generous window to catch cross-device data
    // Pull from either lastSyncTimestamp OR the last 3 days, whichever is further back
    const crossDevicePullTimestamp = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days
    effectivePullTimestamp = Math.min(lastSyncTimestamp, crossDevicePullTimestamp);
    console.log('Regular sync: checking both last sync time and last 3 days');
  }
  
  console.log('Last sync timestamp:', lastSyncTimestamp, 'as date:', new Date(lastSyncTimestamp));
  console.log('Effective pull timestamp:', effectivePullTimestamp, 'as date:', new Date(effectivePullTimestamp));
  console.log('This will pull data newer than:', new Date(effectivePullTimestamp));

  // Pull Food Entries
  // First, let's see what food entries exist in the database for debugging
  const allFoodEntries = await client.query(
    'SELECT id, name, timestamp FROM food_entries ORDER BY timestamp DESC LIMIT 10'
  );
  console.log('=== FOOD ENTRIES DEBUG ===');
  console.log(`Total food entries in database: ${allFoodEntries.rows.length}`);
  allFoodEntries.rows.forEach(row => {
    console.log(`Food entry: ${row.name}, timestamp: ${row.timestamp} (${new Date(parseInt(row.timestamp))})`);
  });
  
  const remoteFoodEntries = await client.query(
    'SELECT * FROM food_entries WHERE timestamp > $1 ORDER BY timestamp DESC',
    [effectivePullTimestamp]
  );
  
  console.log(`Found ${remoteFoodEntries.rows.length} remote food entries newer than ${new Date(effectivePullTimestamp)}`);
  
  for (const row of remoteFoodEntries.rows) {
    pulledData.foodEntries.push({
      id: row.id,
      name: row.name,
      calories: parseFloat(row.calories),
      protein: parseFloat(row.protein),
      carbs: parseFloat(row.carbs),
      fat: parseFloat(row.fat),
      fiber: parseFloat(row.fiber),
      sugar: parseFloat(row.sugar),
      sodium: parseFloat(row.sodium),
      imageUri: row.image_uri,
      timestamp: parseInt(row.timestamp),
      mealType: row.meal_type,
      confidence: row.confidence ? parseFloat(row.confidence) : undefined,
      aiAnalysis: row.ai_analysis,
      portionMultiplier: row.portion_multiplier ? parseFloat(row.portion_multiplier) : undefined,
      portionUnit: row.portion_unit,
      baseCalories: row.base_calories ? parseFloat(row.base_calories) : undefined,
      baseProtein: row.base_protein ? parseFloat(row.base_protein) : undefined,
      baseCarbs: row.base_carbs ? parseFloat(row.base_carbs) : undefined,
      baseFat: row.base_fat ? parseFloat(row.base_fat) : undefined,
      baseFiber: row.base_fiber ? parseFloat(row.base_fiber) : undefined,
      baseSugar: row.base_sugar ? parseFloat(row.base_sugar) : undefined,
      baseSodium: row.base_sodium ? parseFloat(row.base_sodium) : undefined,
      showManualNutrition: row.show_manual_nutrition
    });
    pullCounts.foodEntries++;
    console.log(`Pulled food entry: ${row.name} (timestamp: ${row.timestamp})`);
  }

  // Pull Workout Entries
  // Debug workout entries
  const allWorkoutEntries = await client.query(
    'SELECT id, name, timestamp FROM workout_entries ORDER BY timestamp DESC LIMIT 10'
  );
  console.log('=== WORKOUT ENTRIES DEBUG ===');
  console.log(`Total workout entries in database: ${allWorkoutEntries.rows.length}`);
  allWorkoutEntries.rows.forEach(row => {
    console.log(`Workout entry: ${row.name}, timestamp: ${row.timestamp} (${new Date(parseInt(row.timestamp))})`);
  });
  
  const remoteWorkoutEntries = await client.query(
    'SELECT * FROM workout_entries WHERE timestamp > $1 ORDER BY timestamp DESC',
    [effectivePullTimestamp]
  );
  
  for (const row of remoteWorkoutEntries.rows) {
    pulledData.workoutEntries.push({
      id: row.id,
      name: row.name,
      type: row.type,
      duration: parseInt(row.duration),
      calories: parseFloat(row.calories),
      intensity: row.intensity,
      exercises: safeJsonParse(row.exercises),
      notes: row.notes,
      timestamp: parseInt(row.timestamp)
    });
    pullCounts.workoutEntries++;
  }

  // Pull Biomarker Entries
  const remoteBiomarkerEntries = await client.query(
    'SELECT * FROM biomarker_entries WHERE timestamp > $1 ORDER BY timestamp DESC',
    [effectivePullTimestamp]
  );
  
  for (const row of remoteBiomarkerEntries.rows) {
    pulledData.biomarkerEntries.push({
      id: row.id,
      type: row.type,
      value: parseFloat(row.value),
      unit: row.unit,
      timestamp: parseInt(row.timestamp),
      notes: row.notes
    });
    pullCounts.biomarkerEntries++;
  }

  // Pull Goals
  try {
    const remoteGoals = await client.query(
      'SELECT * FROM goals WHERE created_at_timestamp > $1 ORDER BY created_at_timestamp DESC',
      [effectivePullTimestamp]
    );
    
    for (const row of remoteGoals.rows) {
      pulledData.goals.push({
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.type,
        targetValue: parseFloat(row.target_value),
        currentValue: parseFloat(row.current_value),
        unit: row.unit,
        targetDate: parseInt(row.target_date),
        createdAt: parseInt(row.created_at_timestamp),
        isCompleted: row.is_completed,
        milestones: safeJsonParse(row.milestones)
      });
      pullCounts.goals++;
    }
  } catch (error) {
    console.error('Error pulling goals:', error);
    // Try alternative query without timestamp filter if column doesn't exist
    try {
      const remoteGoals = await client.query('SELECT * FROM goals ORDER BY created_at DESC');
      for (const row of remoteGoals.rows) {
        if (row.created_at_timestamp && parseInt(row.created_at_timestamp) > effectivePullTimestamp) {
          pulledData.goals.push({
            id: row.id,
            title: row.title,
            description: row.description,
            type: row.type,
            targetValue: parseFloat(row.target_value),
            currentValue: parseFloat(row.current_value),
            unit: row.unit,
            targetDate: parseInt(row.target_date),
            createdAt: parseInt(row.created_at_timestamp),
            isCompleted: row.is_completed,
            milestones: safeJsonParse(row.milestones)
          });
          pullCounts.goals++;
        }
      }
    } catch (fallbackError) {
      console.error('Error in fallback goals query:', fallbackError);
    }
  }

  // Pull User Profile (get latest if updated)
  try {
    const remoteUserProfile = await client.query(
      'SELECT * FROM user_profiles WHERE updated_at_timestamp > $1 ORDER BY updated_at_timestamp DESC LIMIT 1',
      [effectivePullTimestamp]
    );
    
    if (remoteUserProfile.rows.length > 0) {
      const row = remoteUserProfile.rows[0];
      pulledData.userProfile = {
        id: row.id,
        name: row.name,
        age: parseInt(row.age),
        gender: row.gender,
        height: parseFloat(row.height),
        activityLevel: row.activity_level,
        preferences: safeJsonParse(row.preferences),
        createdAt: parseInt(row.created_at_timestamp),
        updatedAt: parseInt(row.updated_at_timestamp)
      };
      pullCounts.userProfile++;
    }
  } catch (error) {
    console.error('Error pulling user profile:', error);
    // Try alternative query without timestamp filter if column doesn't exist
    try {
      const remoteUserProfile = await client.query('SELECT * FROM user_profiles ORDER BY updated_at DESC LIMIT 1');
      if (remoteUserProfile.rows.length > 0) {
        const row = remoteUserProfile.rows[0];
        if (row.updated_at_timestamp && parseInt(row.updated_at_timestamp) > effectivePullTimestamp) {
          pulledData.userProfile = {
            id: row.id,
            name: row.name,
            age: parseInt(row.age),
            gender: row.gender,
            height: parseFloat(row.height),
            activityLevel: row.activity_level,
            preferences: safeJsonParse(row.preferences),
            createdAt: parseInt(row.created_at_timestamp),
            updatedAt: parseInt(row.updated_at_timestamp)
          };
          pullCounts.userProfile++;
        }
      }
    } catch (fallbackError) {
      console.error('Error in fallback user profile query:', fallbackError);
    }
  }

  return {
    syncedCounts,
    pullCounts,
    pulledData
  };
} 