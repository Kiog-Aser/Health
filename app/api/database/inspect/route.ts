import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

interface InspectionData {
  count: number;
  recent: any[];
  error?: string;
}

interface DatabaseInspection {
  food_entries: InspectionData;
  workout_entries: InspectionData;
  biomarker_entries: InspectionData;
  goals: InspectionData;
  user_profiles: InspectionData;
}

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json();

    const client = new Client({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    await client.connect();

    // Get counts and recent data from each table
    const inspection: DatabaseInspection = {
      food_entries: { count: 0, recent: [] },
      workout_entries: { count: 0, recent: [] },
      biomarker_entries: { count: 0, recent: [] },
      goals: { count: 0, recent: [] },
      user_profiles: { count: 0, recent: [] }
    };

    // Check food entries
    try {
      const foodCount = await client.query('SELECT COUNT(*) FROM food_entries');
      inspection.food_entries.count = parseInt(foodCount.rows[0].count);
      
      const recentFood = await client.query('SELECT id, name, timestamp, created_at FROM food_entries ORDER BY timestamp DESC LIMIT 5');
      inspection.food_entries.recent = recentFood.rows.map(row => ({
        id: row.id,
        name: row.name,
        timestamp: row.timestamp,
        timestamp_date: new Date(parseInt(row.timestamp)),
        created_at: row.created_at
      }));
    } catch (error) {
      inspection.food_entries = { count: 0, recent: [], error: 'Table may not exist' };
    }

    // Check workout entries
    try {
      const workoutCount = await client.query('SELECT COUNT(*) FROM workout_entries');
      inspection.workout_entries.count = parseInt(workoutCount.rows[0].count);
      
      const recentWorkouts = await client.query('SELECT id, name, timestamp, created_at FROM workout_entries ORDER BY timestamp DESC LIMIT 5');
      inspection.workout_entries.recent = recentWorkouts.rows.map(row => ({
        id: row.id,
        name: row.name,
        timestamp: row.timestamp,
        timestamp_date: new Date(parseInt(row.timestamp)),
        created_at: row.created_at
      }));
    } catch (error) {
      inspection.workout_entries = { count: 0, recent: [], error: 'Table may not exist' };
    }

    // Check biomarker entries
    try {
      const biomarkerCount = await client.query('SELECT COUNT(*) FROM biomarker_entries');
      inspection.biomarker_entries.count = parseInt(biomarkerCount.rows[0].count);
      
      const recentBiomarkers = await client.query('SELECT id, type, value, timestamp, created_at FROM biomarker_entries ORDER BY timestamp DESC LIMIT 5');
      inspection.biomarker_entries.recent = recentBiomarkers.rows.map(row => ({
        id: row.id,
        type: row.type,
        value: row.value,
        timestamp: row.timestamp,
        timestamp_date: new Date(parseInt(row.timestamp)),
        created_at: row.created_at
      }));
    } catch (error) {
      inspection.biomarker_entries = { count: 0, recent: [], error: 'Table may not exist' };
    }

    // Check goals
    try {
      const goalsCount = await client.query('SELECT COUNT(*) FROM goals');
      inspection.goals.count = parseInt(goalsCount.rows[0].count);
      
      const recentGoals = await client.query('SELECT id, title, created_at_timestamp, created_at FROM goals ORDER BY created_at DESC LIMIT 5');
      inspection.goals.recent = recentGoals.rows.map(row => ({
        id: row.id,
        title: row.title,
        created_at_timestamp: row.created_at_timestamp,
        created_at_timestamp_date: row.created_at_timestamp ? new Date(parseInt(row.created_at_timestamp)) : null,
        created_at: row.created_at
      }));
    } catch (error) {
      inspection.goals = { count: 0, recent: [], error: 'Table may not exist' };
    }

    // Check user profiles
    try {
      const profilesCount = await client.query('SELECT COUNT(*) FROM user_profiles');
      inspection.user_profiles.count = parseInt(profilesCount.rows[0].count);
      
      const recentProfiles = await client.query('SELECT id, name, created_at_timestamp, updated_at_timestamp, created_at FROM user_profiles ORDER BY created_at DESC LIMIT 5');
      inspection.user_profiles.recent = recentProfiles.rows.map(row => ({
        id: row.id,
        name: row.name,
        created_at_timestamp: row.created_at_timestamp,
        created_at_timestamp_date: row.created_at_timestamp ? new Date(parseInt(row.created_at_timestamp)) : null,
        updated_at_timestamp: row.updated_at_timestamp,
        updated_at_timestamp_date: row.updated_at_timestamp ? new Date(parseInt(row.updated_at_timestamp)) : null,
        created_at: row.created_at
      }));
    } catch (error) {
      inspection.user_profiles = { count: 0, recent: [], error: 'Table may not exist' };
    }

    await client.end();

    return NextResponse.json({
      success: true,
      current_time: Date.now(),
      current_time_date: new Date(),
      inspection
    });

  } catch (error) {
    console.error('Database inspection error:', error);
    return NextResponse.json(
      { success: false, message: 'Inspection failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 