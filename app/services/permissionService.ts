interface PermissionState {
  camera: 'unknown' | 'granted' | 'denied' | 'prompt';
  lastChecked: number;
}

class PermissionService {
  private static instance: PermissionService;
  private permissionState: PermissionState;
  private activeStream: MediaStream | null = null;
  private readonly STORAGE_KEY = 'healthtracker_permissions';
  private readonly PERMISSION_EXPIRY = 8 * 60 * 60 * 1000; // 8 hours (shorter for better reliability)

  private constructor() {
    this.permissionState = this.loadPermissionState();
  }

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  private loadPermissionState(): PermissionState {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return {
          camera: 'unknown',
          lastChecked: 0
        };
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if permission state is still valid (not expired)
        if (Date.now() - parsed.lastChecked < this.PERMISSION_EXPIRY) {
          console.log('📱 Using cached permission state:', parsed.camera);
          return parsed;
        } else {
          console.log('📱 Cached permission expired, resetting to unknown');
        }
      }
    } catch (error) {
      console.warn('Failed to load permission state:', error);
    }
    
    return {
      camera: 'unknown',
      lastChecked: 0
    };
  }

  private savePermissionState(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.permissionState));
      console.log('💾 Saved permission state:', this.permissionState);
    } catch (error) {
      console.warn('Failed to save permission state:', error);
    }
  }

  async checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        return 'prompt';
      }

      // First check if we have a recent cached state and it's granted
      if (this.permissionState.camera === 'granted' && 
          Date.now() - this.permissionState.lastChecked < this.PERMISSION_EXPIRY) {
        console.log('✅ Using cached GRANTED permission state');
        return 'granted';
      }

      // Check if Permissions API is available (preferred method)
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const state = result.state as 'granted' | 'denied' | 'prompt';
          
          console.log('🔍 Permissions API result:', state);
          this.updatePermissionState('camera', state);
          return state;
        } catch (error) {
          console.warn('Permissions API query failed:', error);
        }
      }

      // If we have a cached denied state that's recent, trust it
      if (this.permissionState.camera === 'denied' && 
          Date.now() - this.permissionState.lastChecked < this.PERMISSION_EXPIRY) {
        console.log('❌ Using cached DENIED permission state');
        return 'denied';
      }

      // For unknown state or expired cache, return prompt
      // DO NOT call getUserMedia here as that would trigger permission dialog
      console.log('❓ Permission state unknown, returning prompt');
      return 'prompt';
      
    } catch (error) {
      console.error('Permission check failed:', error);
      return 'prompt';
    }
  }

  async requestCameraPermission(): Promise<{ granted: boolean; stream?: MediaStream }> {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        return { granted: false };
      }

      // If we already have a granted permission and active stream, reuse it
      if (this.permissionState.camera === 'granted' && this.activeStream) {
        console.log('♻️ Reusing existing camera stream');
        return { granted: true, stream: this.activeStream };
      }

      console.log('🎥 Requesting camera permission...');
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Camera permission granted, stream obtained');
      this.activeStream = stream;
      this.updatePermissionState('camera', 'granted');
      
      // Listen for stream ending
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.log('📹 Camera track ended');
          this.activeStream = null;
        });
      });
      
      return { granted: true, stream };
    } catch (error: any) {
      console.error('❌ Camera permission request failed:', error);
      
      if (error.name === 'NotAllowedError') {
        console.log('🚫 User denied camera permission');
        this.updatePermissionState('camera', 'denied');
      } else if (error.name === 'NotFoundError') {
        console.log('📷 No camera device found');
        this.updatePermissionState('camera', 'denied');
      } else {
        console.log('❓ Unknown camera error, setting to prompt');
        this.updatePermissionState('camera', 'prompt');
      }
      
      return { granted: false };
    }
  }

  // Method to get a new stream with different constraints (e.g., facing mode)
  async getCameraStreamWithConstraints(constraints: MediaStreamConstraints): Promise<{ granted: boolean; stream?: MediaStream }> {
    try {
      // Check if we have permission first
      const permissionState = await this.checkCameraPermission();
      if (permissionState === 'denied') {
        return { granted: false };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update our active stream reference
      this.activeStream = stream;
      this.updatePermissionState('camera', 'granted');
      
      return { granted: true, stream };
    } catch (error: any) {
      console.error('Failed to get camera stream with constraints:', error);
      
      if (error.name === 'NotAllowedError') {
        this.updatePermissionState('camera', 'denied');
      }
      
      return { granted: false };
    }
  }

  stopActiveStream(): void {
    if (this.activeStream) {
      console.log('🛑 Stopping active camera stream');
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }
  }

  private updatePermissionState(permission: keyof PermissionState, state: string): void {
    if (permission === 'camera') {
      this.permissionState.camera = state as any;
      this.permissionState.lastChecked = Date.now();
      this.savePermissionState();
    }
  }

  getCachedPermissionState(): PermissionState {
    return { ...this.permissionState };
  }

  clearPermissionCache(): void {
    console.log('🗑️ Clearing permission cache');
    this.stopActiveStream();
    this.permissionState = {
      camera: 'unknown',
      lastChecked: 0
    };
    this.savePermissionState();
  }

  // iOS PWA specific methods
  isIOSPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
      ('standalone' in window.navigator) && 
      (window.navigator as any).standalone === true
    ) || 
    (window.matchMedia('(display-mode: standalone)').matches);
  }

  // Method to pre-warm camera permission for better UX
  async preWarmCameraPermission(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Only pre-warm on first load if we don't have any cached state
    if (this.permissionState.camera === 'unknown') {
      try {
        console.log('🔥 Pre-warming camera permissions...');
        await this.checkCameraPermission();
      } catch (error) {
        console.log('Permission pre-warming failed:', error);
      }
    }
  }
}

export const permissionService = PermissionService.getInstance(); 