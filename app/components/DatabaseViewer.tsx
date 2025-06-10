'use client';

import React, { useState } from 'react';
import { Database, Eye, Download, RefreshCw, Search } from 'lucide-react';

interface DatabaseViewerProps {
  className?: string;
}

export default function DatabaseViewer({ className = "" }: DatabaseViewerProps) {
  const [isViewing, setIsViewing] = useState(false);
  const [localData, setLocalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'database'>('local');
  const [databaseData, setDatabaseData] = useState<any>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const loadLocalData = async () => {
    setIsLoading(true);
    try {
      // Get all local data
      const foodEntries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
      const workoutEntries = JSON.parse(localStorage.getItem('workoutEntries') || '[]');
      const biomarkerEntries = JSON.parse(localStorage.getItem('biomarkerEntries') || '[]');
      const goals = JSON.parse(localStorage.getItem('goals') || '[]');
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');

      const data = {
        userProfile,
        foodEntries,
        workoutEntries,
        biomarkerEntries,
        goals,
        counts: {
          foodEntries: foodEntries.length,
          workoutEntries: workoutEntries.length,
          biomarkerEntries: biomarkerEntries.length,
          goals: goals.length,
          userProfile: userProfile ? 1 : 0
        }
      };

      setLocalData(data);
      setIsViewing(true);
    } catch (error) {
      console.error('Failed to load local data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const inspectDatabase = async () => {
    setIsInspecting(true);
    try {
      const connectionString = localStorage.getItem('dbConnectionString');
      if (!connectionString) {
        alert('No database connection found. Please connect to a database first.');
        return;
      }

      const response = await fetch('/api/database/inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString }),
      });

      const result = await response.json();
      if (result.success) {
        setDatabaseData(result);
        setActiveTab('database');
      } else {
        alert('Database inspection failed: ' + result.message);
      }
    } catch (error) {
      console.error('Database inspection failed:', error);
      alert('Database inspection failed. Check console for details.');
    } finally {
      setIsInspecting(false);
    }
  };

  const exportData = () => {
    if (!localData) return;
    
    const dataStr = JSON.stringify(localData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  if (!isViewing) {
    return (
      <div className={`health-card p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Data Preview & Debug
          </h3>
        </div>
        
        <div className="text-center py-6">
          <Database className="w-12 h-12 mx-auto mb-3 text-base-content/30" />
          <p className="text-base-content/60 mb-4">
            View local data and inspect database to debug sync issues
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={loadLocalData}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <div className="loading loading-spinner loading-sm"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  View Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`health-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Data Viewer & Debug
        </h3>
        <div className="flex gap-2">
          <button
            onClick={inspectDatabase}
            disabled={isInspecting}
            className="btn btn-outline btn-sm"
          >
            {isInspecting ? (
              <>
                <div className="loading loading-spinner loading-sm"></div>
                Inspecting...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Inspect DB
              </>
            )}
          </button>
          <button
            onClick={exportData}
            className="btn btn-ghost btn-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={loadLocalData}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-bordered mb-4">
        <button
          className={`tab ${activeTab === 'local' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('local')}
        >
          Local Data
        </button>
        <button
          className={`tab ${activeTab === 'database' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('database')}
          disabled={!databaseData}
        >
          Database Data
        </button>
      </div>

      {/* Local Data Tab */}
      {activeTab === 'local' && (
        <>
          {/* Data Counts */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="text-xl font-bold text-purple-600">
                {localData?.counts.foodEntries || 0}
              </div>
              <div className="text-xs text-purple-600/70">Food Entries</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
              <div className="text-xl font-bold text-teal-600">
                {localData?.counts.workoutEntries || 0}
              </div>
              <div className="text-xs text-teal-600/70">Workouts</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
              <div className="text-xl font-bold text-cyan-600">
                {localData?.counts.biomarkerEntries || 0}
              </div>
              <div className="text-xs text-cyan-600/70">Measurements</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="text-xl font-bold text-blue-600">
                {localData?.counts.goals || 0}
              </div>
              <div className="text-xs text-blue-600/70">Goals</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-xl font-bold text-green-600">
                {localData?.counts.userProfile || 0}
              </div>
              <div className="text-xs text-green-600/70">Profile</div>
            </div>
          </div>

          {/* Recent Entries Preview */}
          <div className="space-y-4">
            {/* Recent Food Entries */}
            {localData?.foodEntries?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-base-content/80 mb-2">
                  Recent Food Entries ({localData.foodEntries.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {localData.foodEntries.slice(0, 3).map((entry: any) => (
                    <div key={entry.id} className="text-xs p-2 bg-base-200/50 rounded">
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-base-content/60">
                        {entry.calories} cal • {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {localData.foodEntries.length > 3 && (
                    <div className="text-xs text-base-content/60 text-center">
                      +{localData.foodEntries.length - 3} more entries
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Water Entries */}
            {localData?.biomarkerEntries?.filter((e: any) => e.type === 'water_intake').length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-base-content/80 mb-2">
                  Recent Water Entries ({localData.biomarkerEntries.filter((e: any) => e.type === 'water_intake').length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {localData.biomarkerEntries
                    .filter((e: any) => e.type === 'water_intake')
                    .slice(0, 3)
                    .map((entry: any) => (
                      <div key={entry.id} className="text-xs p-2 bg-base-200/50 rounded">
                        <div className="font-medium">💧 {entry.value}L Water</div>
                        <div className="text-base-content/60">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {localData?.counts.foodEntries === 0 && 
             localData?.counts.workoutEntries === 0 && 
             localData?.counts.biomarkerEntries === 0 && (
              <div className="text-center py-8 text-base-content/60">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No health data found</p>
                <p className="text-xs">Start logging food, workouts, or water to see data here</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Database Data Tab */}
      {activeTab === 'database' && databaseData && (
        <>
          <div className="mb-4 p-3 bg-info/10 rounded-lg text-sm">
            <div><strong>Current Time:</strong> {databaseData.current_time_date}</div>
            <div><strong>Timestamp:</strong> {databaseData.current_time}</div>
          </div>

          {/* Database Counts */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="text-xl font-bold text-purple-600">
                {databaseData?.inspection.food_entries?.count || 0}
              </div>
              <div className="text-xs text-purple-600/70">Food Entries</div>
              {databaseData?.inspection.food_entries?.error && (
                <div className="text-xs text-error">{databaseData.inspection.food_entries.error}</div>
              )}
            </div>
            
            <div className="text-center p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
              <div className="text-xl font-bold text-teal-600">
                {databaseData?.inspection.workout_entries?.count || 0}
              </div>
              <div className="text-xs text-teal-600/70">Workouts</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
              <div className="text-xl font-bold text-cyan-600">
                {databaseData?.inspection.biomarker_entries?.count || 0}
              </div>
              <div className="text-xs text-cyan-600/70">Measurements</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="text-xl font-bold text-blue-600">
                {databaseData?.inspection.goals?.count || 0}
              </div>
              <div className="text-xs text-blue-600/70">Goals</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-xl font-bold text-green-600">
                {databaseData?.inspection.user_profiles?.count || 0}
              </div>
              <div className="text-xs text-green-600/70">Profiles</div>
            </div>
          </div>

          {/* Recent Database Entries */}
          <div className="space-y-4">
            {databaseData?.inspection.food_entries?.recent?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-base-content/80 mb-2">
                  Recent Food Entries in Database
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {databaseData.inspection.food_entries.recent.map((entry: any) => (
                    <div key={entry.id} className="text-xs p-2 bg-base-200/50 rounded">
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-base-content/60">
                        Timestamp: {entry.timestamp} ({entry.timestamp_date})
                      </div>
                      <div className="text-base-content/60">
                        Created: {entry.created_at}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
        <p className="text-xs text-info">
          💡 This is your local data that will be synced to your external database. 
          Use the "Sync Data" button above to backup this data to your Neon PostgreSQL database.
        </p>
      </div>
    </div>
  );
} 