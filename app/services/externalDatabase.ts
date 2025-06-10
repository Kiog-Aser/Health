import { FoodEntry, WorkoutEntry, BiomarkerEntry, Goal, UserProfile } from '../types';
import { databaseService } from './database';

interface DatabaseConfig {
  connectionString: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
}

interface SyncResult {
  success: boolean;
  message: string;
  syncedCounts: {
    foodEntries: number;
    workoutEntries: number;
    biomarkerEntries: number;
    goals: number;
    userProfile: number;
  };
  pullCounts?: {
    foodEntries: number;
    workoutEntries: number;
    biomarkerEntries: number;
    goals: number;
    userProfile: number;
  };
}

class ExternalDatabaseService {
  private config: DatabaseConfig | null = null;
  private isConnected = false;
  private lastSyncTimestamp = 0;
  private autoConnectionAttempted = false;

  constructor() {
    // Attempt auto-connection on initialization
    this.attemptAutoConnection();
  }

  private async attemptAutoConnection() {
    if (this.autoConnectionAttempted || typeof window === 'undefined') return;
    
    this.autoConnectionAttempted = true;
    
    try {
      const savedConnectionString = localStorage.getItem('dbConnectionString');
      if (savedConnectionString) {
        console.log('External Database: Attempting auto-connection...');
        const connected = await this.connect(savedConnectionString);
        if (connected) {
          console.log('External Database: Auto-connection successful!');
          // Notify auto-sync service that database is now available
          this.notifyConnectionChange();
        } else {
          console.log('External Database: Auto-connection failed, connection string may be invalid');
        }
      }
    } catch (error) {
      console.error('External Database: Auto-connection error:', error);
    }
  }

  private notifyConnectionChange() {
    // Use a callback approach to avoid circular dependency
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('databaseConnectionChanged', {
        detail: { connected: this.isConnected }
      }));
    }
  }

  async connect(connectionString: string): Promise<boolean> {
    try {
      // Store connection configuration
      this.config = {
        connectionString,
        type: this.detectDatabaseType(connectionString)
      };

      // Test the connection
      const testResult = await this.testConnection();
      if (testResult) {
        this.isConnected = true;
        localStorage.setItem('dbConnectionString', connectionString);
        
        // Initialize database schema if needed
        await this.initializeSchema();
        
        // Load last sync timestamp
        this.lastSyncTimestamp = parseInt(localStorage.getItem('lastSyncTimestamp') || '0');
        
        // Notify auto-sync service that database is now available
        this.notifyConnectionChange();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Database connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.config = null;
    this.isConnected = false;
    localStorage.removeItem('dbConnectionString');
    localStorage.removeItem('lastSyncTimestamp');
    
    // Notify auto-sync service that database is no longer available
    this.notifyConnectionChange();
  }

  private detectDatabaseType(connectionString: string): 'postgresql' | 'mysql' | 'sqlite' {
    if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
      return 'postgresql';
    } else if (connectionString.startsWith('mysql://')) {
      return 'mysql';
    } else {
      return 'sqlite';
    }
  }

  private async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    try {
      // Test connection through API route
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: this.config.connectionString,
          type: this.config.type
        }),
      });

      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.config || !this.isConnected) return;

    // In a real implementation, this would create tables in your database
    console.log('Initializing schema for:', this.config.type);
  }

  /**
   * Bidirectional sync: Push local changes and pull remote changes
   */
  async syncAllData(): Promise<SyncResult> {
    if (!this.isConnected || !this.config) {
      return { 
        success: false, 
        message: 'Database not connected', 
        syncedCounts: { foodEntries: 0, workoutEntries: 0, biomarkerEntries: 0, goals: 0, userProfile: 0 }
      };
    }

    try {
      // Get all local data with timestamps
      const localData = await this.getAllLocalDataWithTimestamps();
      
      // Perform bidirectional sync via API
      const response = await fetch('/api/database/bidirectional-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: this.config.connectionString,
          type: this.config.type,
          localData,
          lastSyncTimestamp: this.lastSyncTimestamp
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Apply pulled data to local storage
        if (result.pulledData) {
          await this.applyPulledData(result.pulledData);
          
          // Trigger UI refresh for updated data - add small delay to ensure localStorage is updated
          setTimeout(() => {
            this.triggerAppDataRefresh();
          }, 100);
        }

        // Update last sync timestamp
        this.lastSyncTimestamp = Date.now();
        localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp.toString());

        return {
          success: true,
          message: result.message,
          syncedCounts: result.syncedCounts,
          pullCounts: result.pullCounts
        };
      } else {
        return {
          success: false,
          message: result.error || 'Sync failed',
          syncedCounts: { foodEntries: 0, workoutEntries: 0, biomarkerEntries: 0, goals: 0, userProfile: 0 }
        };
      }
    } catch (error) {
      console.error('Bidirectional sync failed:', error);
      return { 
        success: false, 
        message: 'Sync failed. Please try again.', 
        syncedCounts: { foodEntries: 0, workoutEntries: 0, biomarkerEntries: 0, goals: 0, userProfile: 0 }
      };
    }
  }

  /**
   * Pull data from remote database and merge with local data
   */
  async pullRemoteData(): Promise<SyncResult> {
    if (!this.isConnected || !this.config) {
      return { 
        success: false, 
        message: 'Database not connected', 
        syncedCounts: { foodEntries: 0, workoutEntries: 0, biomarkerEntries: 0, goals: 0, userProfile: 0 }
      };
    }

    try {
      const response = await fetch('/api/database/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: this.config.connectionString,
          type: this.config.type,
          lastSyncTimestamp: this.lastSyncTimestamp
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Apply pulled data to local storage
        if (result.pulledData) {
          await this.applyPulledData(result.pulledData);
          
          // Trigger UI refresh for updated data - add small delay to ensure localStorage is updated
          setTimeout(() => {
            this.triggerAppDataRefresh();
          }, 100);
        }

        // Update last sync timestamp
        this.lastSyncTimestamp = Date.now();
        localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp.toString());

        return {
          success: true,
          message: result.message,
          syncedCounts: { foodEntries: 0, workoutEntries: 0, biomarkerEntries: 0, goals: 0, userProfile: 0 },
          pullCounts: result.pullCounts
        };
      } else {
        return {
          success: false,
          message: result.error || 'Pull failed',
          syncedCounts: { foodEntries: 0, workoutEntries: 0, biomarkerEntries: 0, goals: 0, userProfile: 0 }
        };
      }
    } catch (error) {
      console.error('Data pull failed:', error);
      return { 
        success: false, 
        message: 'Pull failed. Please try again.', 
        syncedCounts: { foodEntries: 0, workoutEntries: 0, biomarkerEntries: 0, goals: 0, userProfile: 0 }
      };
    }
  }

  /**
   * Trigger app data refresh by dispatching a custom event
   */
  private triggerAppDataRefresh() {
    if (typeof window !== 'undefined') {
      console.log('Triggering app data refresh from sync...');
      
      // Dispatch custom event for React components listening for sync updates
      window.dispatchEvent(new CustomEvent('dataRefreshNeeded', {
        detail: { source: 'sync' }
      }));
      
      // Also dispatch storage event as backup for components listening to localStorage changes
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'foodEntries',
        newValue: localStorage.getItem('foodEntries'),
        oldValue: null,
        storageArea: localStorage
      }));
      
      console.log('Data refresh events dispatched');
    }
  }

  /**
   * Apply pulled data to local storage, merging intelligently
   */
  private async applyPulledData(pulledData: any) {
    try {
      console.log('=== APPLYING PULLED DATA ===');
      console.log('Pulled data counts:', {
        foodEntries: pulledData.foodEntries?.length || 0,
        workoutEntries: pulledData.workoutEntries?.length || 0,
        biomarkerEntries: pulledData.biomarkerEntries?.length || 0,
        goals: pulledData.goals?.length || 0,
        userProfile: pulledData.userProfile ? 1 : 0
      });

      let hasUpdated = false;

      // Merge food entries
      if (pulledData.foodEntries && pulledData.foodEntries.length > 0) {
        const localFoodEntries = await databaseService.getFoodEntries();
        console.log(`Merging ${pulledData.foodEntries.length} remote food entries with ${localFoodEntries.length} local entries`);
        const mergedFoodEntries = this.mergeDataArrays(localFoodEntries, pulledData.foodEntries);
        localStorage.setItem('foodEntries', JSON.stringify(mergedFoodEntries));
        console.log(`Final merged food entries: ${mergedFoodEntries.length}`);
        console.log('Sample merged food entries:', mergedFoodEntries.slice(0, 2).map(e => ({ id: e.id, name: e.name, timestamp: e.timestamp })));
        hasUpdated = true;
      }

      // Merge workout entries
      if (pulledData.workoutEntries && pulledData.workoutEntries.length > 0) {
        const localWorkoutEntries = await databaseService.getWorkoutEntries();
        console.log(`Merging ${pulledData.workoutEntries.length} remote workout entries with ${localWorkoutEntries.length} local entries`);
        const mergedWorkoutEntries = this.mergeDataArrays(localWorkoutEntries, pulledData.workoutEntries);
        localStorage.setItem('workoutEntries', JSON.stringify(mergedWorkoutEntries));
        console.log(`Final merged workout entries: ${mergedWorkoutEntries.length}`);
        hasUpdated = true;
      }

      // Merge biomarker entries
      if (pulledData.biomarkerEntries && pulledData.biomarkerEntries.length > 0) {
        const localBiomarkerEntries = await databaseService.getBiomarkerEntries();
        console.log(`Merging ${pulledData.biomarkerEntries.length} remote biomarker entries with ${localBiomarkerEntries.length} local entries`);
        const mergedBiomarkerEntries = this.mergeDataArrays(localBiomarkerEntries, pulledData.biomarkerEntries);
        localStorage.setItem('biomarkerEntries', JSON.stringify(mergedBiomarkerEntries));
        console.log(`Final merged biomarker entries: ${mergedBiomarkerEntries.length}`);
        hasUpdated = true;
      }

      // Merge goals
      if (pulledData.goals && pulledData.goals.length > 0) {
        const localGoals = await databaseService.getGoals();
        console.log(`Merging ${pulledData.goals.length} remote goals with ${localGoals.length} local goals`);
        const mergedGoals = this.mergeDataArrays(localGoals, pulledData.goals);
        localStorage.setItem('goals', JSON.stringify(mergedGoals));
        console.log(`Final merged goals: ${mergedGoals.length}`);
        hasUpdated = true;
      }

      // Update user profile (take the most recent one)
      if (pulledData.userProfile) {
        const localProfile = await databaseService.getUserProfile();
        if (!localProfile || pulledData.userProfile.updatedAt > (localProfile.updatedAt || 0)) {
          await databaseService.saveUserProfile(pulledData.userProfile);
          console.log('User profile updated from sync');
          hasUpdated = true;
        }
      }

      if (hasUpdated) {
        console.log('Pulled data applied successfully - triggering UI refresh');
        // Force a localStorage change event for components that might listen to it
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'foodEntries',
          newValue: localStorage.getItem('foodEntries')
        }));
      } else {
        console.log('No new data to apply from sync');
      }
    } catch (error) {
      console.error('Failed to apply pulled data:', error);
      throw error;
    }
  }

  /**
   * Merge two arrays of data, avoiding duplicates and keeping the most recent version
   */
  private mergeDataArrays(localArray: any[], remoteArray: any[]): any[] {
    const merged = [...localArray];
    const localIds = new Set(localArray.map(item => item.id));

    for (const remoteItem of remoteArray) {
      const localIndex = merged.findIndex(item => item.id === remoteItem.id);
      
      if (localIndex === -1) {
        // Item doesn't exist locally, add it
        merged.push(remoteItem);
      } else {
        // Item exists, keep the most recent version
        const localItem = merged[localIndex];
        const remoteTimestamp = remoteItem.updatedAt || remoteItem.timestamp || 0;
        const localTimestamp = localItem.updatedAt || localItem.timestamp || 0;
        
        if (remoteTimestamp > localTimestamp) {
          merged[localIndex] = remoteItem;
        }
      }
    }

    return merged;
  }

  private async getAllLocalDataWithTimestamps() {
    // Get data from localStorage with timestamps for sync
    const foodEntries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
    const workoutEntries = JSON.parse(localStorage.getItem('workoutEntries') || '[]');
    const biomarkerEntries = JSON.parse(localStorage.getItem('biomarkerEntries') || '[]');
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');

    return {
      foodEntries,
      workoutEntries,
      biomarkerEntries,
      goals,
      userProfile
    };
  }

  private async getAllLocalData() {
    // Get data from localStorage
    const foodEntries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
    const workoutEntries = JSON.parse(localStorage.getItem('workoutEntries') || '[]');
    const biomarkerEntries = JSON.parse(localStorage.getItem('biomarkerEntries') || '[]');
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');

    return {
      userProfile,
      foodEntries,
      workoutEntries,
      biomarkerEntries,
      goals
    };
  }

  async exportData(): Promise<string> {
    const localData = await this.getAllLocalData();
    return JSON.stringify(localData, null, 2);
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  getConnectionInfo(): { connected: boolean; type?: string; masked?: string } {
    if (!this.isConnected || !this.config) {
      return { connected: false };
    }

    const masked = this.config.connectionString.substring(0, 20) + '...' + 
                   this.config.connectionString.slice(-10);

    return {
      connected: true,
      type: this.config.type,
      masked
    };
  }

  getLastSyncTimestamp(): number {
    return this.lastSyncTimestamp;
  }

  /**
   * Check if there are any changes since last sync
   */
  async hasLocalChanges(): Promise<boolean> {
    try {
      const localData = await this.getAllLocalDataWithTimestamps();
      
      // Check if any item has been modified since last sync
      const allItems = [
        ...localData.foodEntries,
        ...localData.workoutEntries,
        ...localData.biomarkerEntries,
        ...localData.goals
      ];

      if (localData.userProfile && 
          (localData.userProfile.updatedAt || localData.userProfile.createdAt || 0) > this.lastSyncTimestamp) {
        return true;
      }

      return allItems.some(item => {
        const itemTimestamp = item.updatedAt || item.timestamp || item.createdAt || 0;
        return itemTimestamp > this.lastSyncTimestamp;
      });
    } catch (error) {
      console.error('Error checking for local changes:', error);
      return false;
    }
  }

  /**
   * Reset sync timestamp to force a full resync of recent data
   */
  resetSyncTimestamp(): void {
    this.lastSyncTimestamp = 0;
    localStorage.setItem('lastSyncTimestamp', '0');
    console.log('Sync timestamp reset - next sync will pull recent data from all sources');
  }

  /**
   * Get formatted time until next sync
   */
  getFormattedTimeUntilNextSync(): string {
    // This is just a placeholder - actual scheduling is handled by autoSyncService
    return "When database is connected";
  }
}

export const externalDatabaseService = new ExternalDatabaseService(); 