'use client';

import { useEffect } from 'react';
import { pwaService } from '../services/pwaService';

export default function PWAInitializer() {
  useEffect(() => {
    const initializePWA = async () => {
      try {
        await pwaService.initialize();
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    };

    // Initialize PWA service after a short delay to ensure the app is fully loaded
    const timer = setTimeout(initializePWA, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
} 