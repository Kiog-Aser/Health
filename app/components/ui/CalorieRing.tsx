'use client';

import { useEffect, useState } from 'react';

interface CalorieRingProps {
  consumed: number;
  burned: number;
  target: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
  animate?: boolean;
}

const sizes = {
  sm: { outer: 80, inner: 60, stroke: 10 },
  md: { outer: 120, inner: 90, stroke: 15 },
  lg: { outer: 160, inner: 120, stroke: 20 },
  xl: { outer: 200, inner: 150, stroke: 25 },
};

export default function CalorieRing({ 
  consumed, 
  burned, 
  target, 
  size = 'lg',
  showDetails = true,
  animate = true 
}: CalorieRingProps) {
  const [animatedConsumed, setAnimatedConsumed] = useState(0);
  const [animatedBurned, setAnimatedBurned] = useState(0);

  const { outer, inner, stroke } = sizes[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const consumedPercentage = Math.min((consumed / target) * 100, 100);
  const burnedPercentage = Math.min((burned / target) * 100, 100);
  
  const consumedOffset = circumference - (animatedConsumed / 100) * circumference;
  const burnedOffset = circumference - (animatedBurned / 100) * circumference;
  
  const remaining = Math.max(0, target - consumed + burned);
  const net = consumed - burned;
  
  useEffect(() => {
    if (!animate) {
      setAnimatedConsumed(consumedPercentage);
      setAnimatedBurned(burnedPercentage);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    
    const animateStep = () => {
      currentStep++;
      const progress = currentStep / steps;
      
      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedConsumed(consumedPercentage * easeProgress);
      setAnimatedBurned(burnedPercentage * easeProgress);
      
      if (currentStep < steps) {
        setTimeout(animateStep, stepDuration);
      }
    };
    
    animateStep();
  }, [consumed, burned, target, animate, consumedPercentage, burnedPercentage]);

  const getCalorieStatus = () => {
    if (net > target * 1.1) return { color: 'text-error', status: 'Over target' };
    if (net < target * 0.9) return { color: 'text-warning', status: 'Under target' };
    return { color: 'text-success', status: 'On track' };
  };

  const status = getCalorieStatus();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: outer, height: outer }}>
        {/* Background ring */}
        <svg 
          className="absolute top-0 left-0 transform -rotate-90" 
          width={outer} 
          height={outer}
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-base-300"
          />
        </svg>

        {/* Burned calories ring (behind) */}
        <svg 
          className="absolute top-0 left-0 transform -rotate-90" 
          width={outer} 
          height={outer}
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={burnedOffset}
            className="text-warning transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>

        {/* Consumed calories ring (front) */}
        <svg 
          className="absolute top-0 left-0 transform -rotate-90" 
          width={outer} 
          height={outer}
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={consumedOffset}
            className="text-primary transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>

        {/* Center content */}
        <div 
          className="absolute top-0 left-0 flex flex-col items-center justify-center text-center"
          style={{ width: outer, height: outer }}
        >
          <div className="text-2xl font-bold">{net.toLocaleString()}</div>
          <div className="text-xs text-base-content/60">net</div>
          {remaining > 0 && (
            <div className="text-xs text-base-content/40 mt-1">
              {remaining.toLocaleString()} left
            </div>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-2 w-full max-w-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm">Consumed</span>
            </div>
            <span className="text-sm font-medium">{consumed.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-sm">Burned</span>
            </div>
            <span className="text-sm font-medium">{burned.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-base-300"></div>
              <span className="text-sm">Target</span>
            </div>
            <span className="text-sm font-medium">{target.toLocaleString()}</span>
          </div>
          
          <div className={`text-center text-sm font-medium mt-2 ${status.color}`}>
            {status.status}
          </div>
        </div>
      )}
    </div>
  );
} 