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

export async function POST(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    const { connectionString, type, lastSyncTimestamp } = await request.json();

    if (!connectionString || type !== 'postgresql') {
      return NextResponse.json(
        { success: false, message: 'Only PostgreSQL is supported currently' },
        { status: 400 }
      );
    }

    // Connect to PostgreSQL
    client = new Client({
      connectionString,
      connectionTimeoutMillis: 10000,
    });

    await client.connect();

    // Get last sync timestamp from request
    // For cross-device sync, use a more generous window - 3 days
    const crossDeviceTimestamp = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days
    const effectiveTimestamp = Math.min(lastSyncTimestamp, crossDeviceTimestamp);
    
    console.log('Pull-only API - Original timestamp:', lastSyncTimestamp, 'Cross-device timestamp:', crossDeviceTimestamp, 'Effective timestamp:', effectiveTimestamp);

    // Pull remote changes since lastSyncTimestamp
    const pullResult = await pullRemoteChanges(client, effectiveTimestamp);

    await client.end();

    return NextResponse.json({
      success: true,
      message: `Pull completed: received ${Object.values(pullResult.pullCounts).reduce((a, b) => a + b, 0)} items`,
      pullCounts: pullResult.pullCounts,
      pulledData: pullResult.pulledData
    });

  } catch (error) {
    console.error('Pull data error:', error);
    
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error('Error closing database connection:', endError);
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Pull failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function pullRemoteChanges(client: Client, lastSyncTimestamp: number) {
  const pullCounts = {
    foodEntries: 0,
    workoutEntries: 0,
    biomarkerEntries: 0,
    goals: 0,
    userProfile: 0
  };

  const pulledData: {
    foodEntries: any[];
    workoutEntries: any[];
    biomarkerEntries: any[];
    goals: any[];
    userProfile: any;
  } = {
    foodEntries: [],
    workoutEntries: [],
    biomarkerEntries: [],
    goals: [],
    userProfile: null
  };

  // Get last sync timestamp from request
  // For cross-device sync, use a more generous window - 3 days
  const crossDeviceTimestamp = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days
  const effectiveTimestamp = Math.min(lastSyncTimestamp, crossDeviceTimestamp);
  
  console.log('Pull-only API - Original timestamp:', lastSyncTimestamp, 'Cross-device timestamp:', crossDeviceTimestamp, 'Effective timestamp:', effectiveTimestamp);

  // Pull Food Entries
  const remoteFoodEntries = await client.query(
    'SELECT * FROM food_entries WHERE timestamp > $1 ORDER BY timestamp DESC',
    [effectiveTimestamp]
  );
  
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
  }

  // Pull Workout Entries
  const remoteWorkoutEntries = await client.query(
    'SELECT * FROM workout_entries WHERE timestamp > $1 ORDER BY timestamp DESC',
    [effectiveTimestamp]
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
    [effectiveTimestamp]
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
      [effectiveTimestamp]
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
  }

  // Pull User Profile (get latest if updated)
  try {
    const remoteUserProfile = await client.query(
      'SELECT * FROM user_profiles WHERE updated_at_timestamp > $1 ORDER BY updated_at_timestamp DESC LIMIT 1',
      [effectiveTimestamp]
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
  }

  return {
    pullCounts,
    pulledData
  };
} 