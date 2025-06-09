import { FoodEntry, WorkoutEntry, BiomarkerEntry, Goal, UserProfile } from '../types';

interface DatabaseConfig {
  connectionString: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
}

class ExternalDatabaseService {
  private config: DatabaseConfig | null = null;
  private isConnected = false;

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

  async syncAllData(): Promise<{ success: boolean; message: string; syncedCounts: any }> {
    if (!this.isConnected || !this.config) {
      return { success: false, message: 'Database not connected', syncedCounts: {} };
    }

    try {
      // Get all local data
      const localData = await this.getAllLocalData();
      
      // Sync to external database via API
      const response = await fetch('/api/database/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: this.config.connectionString,
          type: this.config.type,
          data: localData
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          syncedCounts: result.syncedCounts
        };
      } else {
        return {
          success: false,
          message: result.error || 'Sync failed',
          syncedCounts: {}
        };
      }
    } catch (error) {
      console.error('Data sync failed:', error);
      return { success: false, message: 'Sync failed. Please try again.', syncedCounts: {} };
    }
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
}

export const externalDatabaseService = new ExternalDatabaseService(); 