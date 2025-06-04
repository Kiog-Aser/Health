'use client';

import { useEffect, useState } from 'react';
import { Activity, Heart, Zap } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

export default function LoadingScreen({ 
  message = "Loading your health data...",
  showProgress = false 
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [showProgress]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-base-100 to-base-200">
      <div className="text-center space-y-8 p-8">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
            
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Floating icons */}
          <div className="absolute -top-4 -left-4">
            <Heart className="w-6 h-6 text-red-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="absolute -top-4 -right-4">
            <Zap className="w-6 h-6 text-yellow-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            HealthTracker Pro
          </h1>
          <p className="text-base-content/60">Your Personal Health Companion</p>
        </div>

        {/* Loading message */}
        <div className="space-y-4">
          <p className="text-base-content/80 animate-pulse">{message}</p>
          
          {showProgress && (
            <div className="w-64 mx-auto space-y-2">
              <div className="flex justify-between text-sm text-base-content/60">
                <span>Loading</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress progress-primary w-full">
                <div 
                  className="progress-fill bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Animated dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
} 