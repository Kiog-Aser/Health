'use client';

import { permissionService } from './permissionService';

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAService {
  private static instance: PWAService;
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInitialized = false;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPrompt;
      console.log('PWA install prompt ready');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      // Pre-warm permissions after installation
      this.initializeAppPermissions();
    });

    // Handle service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker updated, reloading...');
        window.location.reload();
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing PWA service...');
      
      // Register service worker if not already registered
      await this.registerServiceWorker();
      
      // Initialize app permissions
      await this.initializeAppPermissions();
      
      // Setup iOS PWA specific handling
      if (this.isIOSPWA()) {
        this.setupIOSPWAHandling();
      }
      
      this.isInitialized = true;
      console.log('✅ PWA service initialized');
    } catch (error) {
      console.error('❌ PWA service initialization failed:', error);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('Service worker update found');
        });
        
        // Registration successful
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  private async initializeAppPermissions(): Promise<void> {
    try {
      // Pre-warm camera permissions for better UX
      await permissionService.preWarmCameraPermission();
      
      // Check if we're in a PWA and need to restore permissions
      if (this.isPWA()) {
        const cameraState = await permissionService.checkCameraPermission();
        console.log('📷 Camera permission state on PWA start:', cameraState);
      }
    } catch (error) {
      console.log('Permission initialization failed:', error);
    }
  }

  private setupIOSPWAHandling(): void {
    console.log('📱 Setting up iOS PWA handling...');
    
    // Handle iOS PWA status bar
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    }

    // Add iOS safe area classes
    document.documentElement.classList.add('ios-pwa');
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Trigger permission check after orientation change
        permissionService.checkCameraPermission();
      }, 500);
    });
  }

  // Utility methods
  isPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  isIOSPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    return this.isPWA() && /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroidPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    return this.isPWA() && /Android/.test(navigator.userAgent);
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Method to refresh permissions (useful for iOS PWA)
  async refreshPermissions(): Promise<void> {
    permissionService.clearPermissionCache();
    await this.initializeAppPermissions();
  }

  // Get PWA info for debugging
  getPWAInfo(): object {
    if (typeof window === 'undefined') {
      return {
        isPWA: false,
        isIOSPWA: false,
        isAndroidPWA: false,
        canInstall: false,
        isInitialized: this.isInitialized,
        standalone: false,
        displayMode: 'browser'
      };
    }
    
    return {
      isPWA: this.isPWA(),
      isIOSPWA: this.isIOSPWA(),
      isAndroidPWA: this.isAndroidPWA(),
      canInstall: this.canInstall(),
      isInitialized: this.isInitialized,
      standalone: (window.navigator as any).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    };
  }
}

export const pwaService = PWAService.getInstance(); 