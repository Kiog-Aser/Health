import { externalDatabaseService } from './externalDatabase';

export class AutoBackupService {
  private static instance: AutoBackupService;
  private isEnabled = false;
  private backupInterval: NodeJS.Timeout | null = null;
  private lastBackupTime = 0;
  private readonly BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MIN_BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes minimum between backups

  static getInstance(): AutoBackupService {
    if (!AutoBackupService.instance) {
      AutoBackupService.instance = new AutoBackupService();
    }
    return AutoBackupService.instance;
  }

  private constructor() {
    this.loadSettings();
    this.startAutoBackup();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    
    const settings = localStorage.getItem('autoBackupSettings');
    if (settings) {
      const { enabled, lastBackupTime } = JSON.parse(settings);
      this.isEnabled = enabled;
      this.lastBackupTime = lastBackupTime || 0;
    } else {
      // Default to enabled if user has database connection
      this.isEnabled = externalDatabaseService.isConnectedToDatabase();
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;
    
    const settings = {
      enabled: this.isEnabled,
      lastBackupTime: this.lastBackupTime
    };
    localStorage.setItem('autoBackupSettings', JSON.stringify(settings));
  }

  enable() {
    this.isEnabled = true;
    this.saveSettings();
    this.startAutoBackup();
    console.log('Auto backup enabled');
  }

  disable() {
    this.isEnabled = false;
    this.saveSettings();
    this.stopAutoBackup();
    console.log('Auto backup disabled');
  }

  isAutoBackupEnabled(): boolean {
    return this.isEnabled;
  }

  getLastBackupTime(): number {
    return this.lastBackupTime;
  }

  private startAutoBackup() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Clear any existing interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Check every hour for backup opportunity
    this.backupInterval = setInterval(() => {
      this.checkAndBackup();
    }, 60 * 60 * 1000); // Check every hour

    // Also check immediately if enough time has passed
    this.checkAndBackup();
  }

  private stopAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  private async checkAndBackup() {
    if (!this.isEnabled || !externalDatabaseService.isConnectedToDatabase()) {
      return;
    }

    const now = Date.now();
    const timeSinceLastBackup = now - this.lastBackupTime;

    // Only backup if enough time has passed
    if (timeSinceLastBackup >= this.BACKUP_INTERVAL_MS) {
      await this.performBackup();
    }
  }

  // This can be called manually when data changes
  async triggerBackupOnDataChange() {
    if (!this.isEnabled || !externalDatabaseService.isConnectedToDatabase()) {
      return;
    }

    const now = Date.now();
    const timeSinceLastBackup = now - this.lastBackupTime;

    // Don't backup too frequently to avoid spam
    if (timeSinceLastBackup >= this.MIN_BACKUP_INTERVAL_MS) {
      await this.performBackup();
    }
  }

  private async performBackup() {
    try {
      console.log('Auto backup: Starting automatic data sync...');
      
      const result = await externalDatabaseService.syncAllData();
      
      if (result.success) {
        this.lastBackupTime = Date.now();
        this.saveSettings();
        
        console.log('Auto backup: Success!', result.message);
        
        // Show subtle notification without interrupting user
        this.showBackupNotification(true, result.syncedCounts);
      } else {
        console.error('Auto backup: Failed -', result.message);
        this.showBackupNotification(false);
      }
    } catch (error) {
      console.error('Auto backup: Error -', error);
      this.showBackupNotification(false);
    }
  }

  private showBackupNotification(success: boolean, counts?: any) {
    // Only show notification if user is not actively interacting
    if (document.hidden) return;

    const notificationDiv = document.createElement('div');
    notificationDiv.className = `fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
      success 
        ? 'bg-success text-success-content' 
        : 'bg-error text-error-content'
    }`;
    
    notificationDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-lg">${success ? '✅' : '❌'}</span>
        <div>
          <div class="font-medium text-sm">
            ${success ? 'Auto Backup Complete' : 'Auto Backup Failed'}
          </div>
          ${success && counts ? `
            <div class="text-xs opacity-90">
              Synced: ${counts.foodEntries + counts.workoutEntries + counts.biomarkerEntries + counts.goals} items
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

    // Remove after 3 seconds
    setTimeout(() => {
      notificationDiv.style.opacity = '0';
      notificationDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notificationDiv);
      }, 300);
    }, 3000);
  }

  // Manual backup with user feedback
  async performManualBackup(): Promise<{ success: boolean; message: string; counts?: any }> {
    if (!externalDatabaseService.isConnectedToDatabase()) {
      return {
        success: false,
        message: 'No database connection available'
      };
    }

    try {
      const result = await externalDatabaseService.syncAllData();
      
      if (result.success) {
        this.lastBackupTime = Date.now();
        this.saveSettings();
      }
      
      return result;
    } catch (error) {
      console.error('Manual backup failed:', error);
      return {
        success: false,
        message: 'Backup failed due to an unexpected error'
      };
    }
  }

  getTimeUntilNextBackup(): number {
    if (!this.isEnabled) return 0;
    
    const nextBackupTime = this.lastBackupTime + this.BACKUP_INTERVAL_MS;
    const timeUntilNext = nextBackupTime - Date.now();
    
    return Math.max(0, timeUntilNext);
  }

  getFormattedTimeUntilNextBackup(): string {
    const ms = this.getTimeUntilNextBackup();
    
    if (ms === 0) return 'Ready to backup';
    
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

export const autoBackupService = AutoBackupService.getInstance(); 