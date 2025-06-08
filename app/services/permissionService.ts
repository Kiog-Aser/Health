interface PermissionState {
  camera: 'unknown' | 'granted' | 'denied' | 'prompt';
  lastChecked: number;
}

class PermissionService {
  private static instance: PermissionService;
  private permissionState: PermissionState;
  private readonly STORAGE_KEY = 'healthtracker_permissions';
  private readonly PERMISSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

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
          return parsed;
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
    } catch (error) {
      console.warn('Failed to save permission state:', error);
    }
  }

  async checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        return 'prompt';
      }

      // First check if we have a recent cached state
      if (this.permissionState.camera !== 'unknown' && 
          Date.now() - this.permissionState.lastChecked < this.PERMISSION_EXPIRY) {
        console.log('Using cached permission state:', this.permissionState.camera);
        return this.permissionState.camera;
      }

      // Check if Permissions API is available
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const state = result.state as 'granted' | 'denied' | 'prompt';
          
          this.updatePermissionState('camera', state);
          return state;
        } catch (error) {
          console.warn('Permissions API query failed:', error);
        }
      }

      // Fallback: Try to access getUserMedia without actually starting the stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1, height: 1 }
        });
        
        // Immediately stop the stream to avoid keeping camera active
        stream.getTracks().forEach(track => track.stop());
        
        this.updatePermissionState('camera', 'granted');
        return 'granted';
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          this.updatePermissionState('camera', 'denied');
          return 'denied';
        } else if (error.name === 'NotFoundError') {
          this.updatePermissionState('camera', 'denied');
          return 'denied';
        }
        
        // Unknown error, assume prompt needed
        this.updatePermissionState('camera', 'prompt');
        return 'prompt';
      }
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

      console.log('Requesting camera permission...');
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera permission granted, stream obtained');
      this.updatePermissionState('camera', 'granted');
      
      return { granted: true, stream };
    } catch (error: any) {
      console.error('Camera permission request failed:', error);
      
      if (error.name === 'NotAllowedError') {
        this.updatePermissionState('camera', 'denied');
      } else if (error.name === 'NotFoundError') {
        this.updatePermissionState('camera', 'denied');
      } else {
        this.updatePermissionState('camera', 'prompt');
      }
      
      return { granted: false };
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
    
    if (this.isIOSPWA() && this.permissionState.camera === 'unknown') {
      try {
        // On iOS PWA, we can try to pre-check permissions
        await this.checkCameraPermission();
      } catch (error) {
        console.log('Permission pre-warming failed:', error);
      }
    }
  }
}

export const permissionService = PermissionService.getInstance(); 