import { externalDatabaseService } from './externalDatabase';

export class AutoSyncService {
  private static instance: AutoSyncService;
  private isEnabled = true; // Always enabled by default
  private syncInterval: NodeJS.Timeout | null = null;
  private pullInterval: NodeJS.Timeout | null = null;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MIN_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes minimum between syncs
  private readonly PULL_CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check for remote changes every 15 minutes

  static getInstance(): AutoSyncService {
    if (!AutoSyncService.instance) {
      AutoSyncService.instance = new AutoSyncService();
    }
    return AutoSyncService.instance;
  }

  private constructor() {
    this.loadSettings();
    this.initializeAutoSync();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    
    // Only load last sync time, always enable auto sync
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    if (lastSyncTime) {
      this.lastSyncTime = parseInt(lastSyncTime) || 0;
    }
    
    // Always enabled in PWA
    this.isEnabled = true;
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;
    
    // Only save last sync time
    localStorage.setItem('lastSyncTime', this.lastSyncTime.toString());
  }

  private initializeAutoSync() {
    // Start auto sync immediately if database is connected
    if (externalDatabaseService.isConnectedToDatabase()) {
      this.startAutoSync();
      this.startPullChecks();
    } else {
      // Check periodically if database becomes available
      this.checkForDatabaseConnection();
    }
  }

  private checkForDatabaseConnection() {
    if (typeof window === 'undefined') return;
    
    const checkInterval = setInterval(() => {
      if (externalDatabaseService.isConnectedToDatabase()) {
        console.log('Auto sync: Database connection detected, starting sync services');
        this.startAutoSync();
        this.startPullChecks();
        clearInterval(checkInterval);
      }
    }, 10000); // Check every 10 seconds
  }

  // Remove enable/disable methods since it's always enabled
  isAutoSyncEnabled(): boolean {
    return this.isEnabled && externalDatabaseService.isConnectedToDatabase();
  }

  // Keep this method for backward compatibility
  isAutoBackupEnabled(): boolean {
    return this.isAutoSyncEnabled();
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  // Keep this method for backward compatibility
  getLastBackupTime(): number {
    return this.getLastSyncTime();
  }

  private startAutoSync() {
    if (!externalDatabaseService.isConnectedToDatabase() || typeof window === 'undefined') return;

    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log('Auto sync: Starting sync service');

    // Check every hour for sync opportunity
    this.syncInterval = setInterval(() => {
      this.checkAndSync();
    }, 60 * 60 * 1000); // Check every hour

    // Also check immediately if enough time has passed
    this.checkAndSync();
  }

  private startPullChecks() {
    if (!externalDatabaseService.isConnectedToDatabase() || typeof window === 'undefined') return;

    // Clear any existing interval
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
    }

    console.log('Auto sync: Starting pull check service');

    // Periodically check for remote changes and pull them
    this.pullInterval = setInterval(() => {
      this.checkAndPullRemoteChanges();
    }, this.PULL_CHECK_INTERVAL_MS);
  }

  private stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }
  }

  // Restart sync services when database connection changes
  restartSyncServices() {
    this.stopAutoSync();
    if (externalDatabaseService.isConnectedToDatabase()) {
      this.startAutoSync();
      this.startPullChecks();
    }
  }

  private async checkAndSync() {
    if (!externalDatabaseService.isConnectedToDatabase()) {
      return;
    }

    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;

    // Only sync if enough time has passed
    if (timeSinceLastSync >= this.SYNC_INTERVAL_MS) {
      await this.performBidirectionalSync();
    }
  }

  // This can be called manually when data changes
  async triggerSyncOnDataChange() {
    if (!externalDatabaseService.isConnectedToDatabase()) {
      return;
    }

    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;

    // Don't sync too frequently to avoid spam
    if (timeSinceLastSync >= this.MIN_SYNC_INTERVAL_MS) {
      await this.performBidirectionalSync();
    }
  }

  // Keep this method for backward compatibility
  async triggerBackupOnDataChange() {
    return this.triggerSyncOnDataChange();
  }

  /**
   * Check for remote changes and pull them if any exist
   */
  private async checkAndPullRemoteChanges() {
    if (!externalDatabaseService.isConnectedToDatabase()) {
      return;
    }

    try {
      // Check if there are any local changes that need to be pushed first
      const hasLocalChanges = await externalDatabaseService.hasLocalChanges();
      
      if (hasLocalChanges) {
        // If we have local changes, do a full bidirectional sync
        await this.performBidirectionalSync();
      } else {
        // Otherwise just pull remote changes
        const result = await externalDatabaseService.pullRemoteData();
        
        if (result.success && result.pullCounts) {
          const totalPulled = Object.values(result.pullCounts).reduce((sum, count) => sum + count, 0);
          
          if (totalPulled > 0) {
            console.log('Auto sync: Pulled remote changes', result.pullCounts);
            this.showSyncNotification(true, undefined, result.pullCounts, 'pull');
            
            // Update last sync time
            this.lastSyncTime = Date.now();
            this.saveSettings();
            
            // Trigger a data refresh in the app
            this.triggerAppDataRefresh();
          }
        }
      }
    } catch (error) {
      console.error('Auto sync: Error checking for remote changes -', error);
    }
  }

  private async performBidirectionalSync() {
    try {
      console.log('Auto sync: Starting bidirectional sync...');
      
      const result = await externalDatabaseService.syncAllData();
      
      if (result.success) {
        this.lastSyncTime = Date.now();
        this.saveSettings();
        
        console.log('Auto sync: Success!', result.message);
        
        // Show notification with both push and pull counts
        this.showSyncNotification(true, result.syncedCounts, result.pullCounts);
        
        // Trigger a data refresh in the app if we pulled any data
        if (result.pullCounts && Object.values(result.pullCounts).some(count => count > 0)) {
          this.triggerAppDataRefresh();
        }
      } else {
        console.error('Auto sync: Failed -', result.message);
        this.showSyncNotification(false);
      }
    } catch (error) {
      console.error('Auto sync: Error -', error);
      this.showSyncNotification(false);
    }
  }

  private triggerAppDataRefresh() {
    // Trigger a custom event that the app can listen to for data refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('autoSyncDataUpdate'));
    }
  }

  private showSyncNotification(success: boolean, syncedCounts?: any, pullCounts?: any, type: 'sync' | 'pull' = 'sync') {
    // Only show notification if user is not actively interacting
    if (typeof window === 'undefined' || document.hidden) return;

    const notificationDiv = document.createElement('div');
    notificationDiv.className = `fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
      success 
        ? 'bg-success text-success-content' 
        : 'bg-error text-error-content'
    }`;
    
    let message = '';
    let details = '';
    
    if (success) {
      if (type === 'pull') {
        message = 'Data Synced from Other Devices';
        if (pullCounts) {
          const totalPulled = Object.values(pullCounts).reduce((sum: number, count: any) => sum + count, 0);
          details = `Pulled ${totalPulled} items`;
        }
      } else {
        message = 'Auto Sync Complete';
        if (syncedCounts || pullCounts) {
          const totalSynced = syncedCounts ? Object.values(syncedCounts).reduce((sum: number, count: any) => sum + count, 0) : 0;
          const totalPulled = pullCounts ? Object.values(pullCounts).reduce((sum: number, count: any) => sum + count, 0) : 0;
          
          if (totalSynced > 0 && totalPulled > 0) {
            details = `Synced ${totalSynced} up, ${totalPulled} down`;
          } else if (totalSynced > 0) {
            details = `Synced ${totalSynced} items`;
          } else if (totalPulled > 0) {
            details = `Pulled ${totalPulled} items`;
          }
        }
      }
    } else {
      message = 'Auto Sync Failed';
    }
    
    notificationDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-lg">${success ? '🔄' : '❌'}</span>
        <div>
          <div class="font-medium text-sm">
            ${message}
          </div>
          ${details ? `
            <div class="text-xs opacity-90">
              ${details}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(notificationDiv);

    // Fade in
    setTimeout(() => {
      notificationDiv.style.opacity = '1';
      notificationDiv.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 4 seconds (slightly longer for sync notifications)
    setTimeout(() => {
      notificationDiv.style.opacity = '0';
      notificationDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notificationDiv)) {
          document.body.removeChild(notificationDiv);
        }
      }, 300);
    }, 4000);
  }

  // Manual sync with user feedback
  async performManualSync(): Promise<{ success: boolean; message: string; syncedCounts?: any; pullCounts?: any }> {
    if (!externalDatabaseService.isConnectedToDatabase()) {
      return {
        success: false,
        message: 'No database connection available'
      };
    }

    try {
      const result = await externalDatabaseService.syncAllData();
      
      if (result.success) {
        this.lastSyncTime = Date.now();
        this.saveSettings();
        
        // Trigger a data refresh if we pulled any data
        if (result.pullCounts && Object.values(result.pullCounts).some(count => count > 0)) {
          this.triggerAppDataRefresh();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return {
        success: false,
        message: 'Sync failed due to an unexpected error'
      };
    }
  }

  // Keep this method for backward compatibility
  async performManualBackup(): Promise<{ success: boolean; message: string; counts?: any }> {
    const result = await this.performManualSync();
    return {
      success: result.success,
      message: result.message,
      counts: result.syncedCounts
    };
  }

  getTimeUntilNextSync(): number {
    if (!externalDatabaseService.isConnectedToDatabase()) return 0;
    
    const nextSyncTime = this.lastSyncTime + this.SYNC_INTERVAL_MS;
    const timeUntilNext = nextSyncTime - Date.now();
    
    return Math.max(0, timeUntilNext);
  }

  // Keep this method for backward compatibility
  getTimeUntilNextBackup(): number {
    return this.getTimeUntilNextSync();
  }

  getFormattedTimeUntilNextSync(): string {
    const ms = this.getTimeUntilNextSync();
    
    if (ms === 0) return 'Ready to sync';
    
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Keep this method for backward compatibility
  getFormattedTimeUntilNextBackup(): string {
    return this.getFormattedTimeUntilNextSync();
  }
}

export const autoSyncService = AutoSyncService.getInstance();

// Export with old name for backward compatibility
export const autoBackupService = autoSyncService; 