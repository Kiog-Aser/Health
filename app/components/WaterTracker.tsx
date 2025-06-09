'use client';

import React, { useState } from 'react';
import { Droplets, Plus, Target, TrendingUp } from 'lucide-react';
import { useHealth } from '../context/HealthContext';

interface WaterTrackerProps {
  className?: string;
  showTarget?: boolean;
  compact?: boolean;
}

const QUICK_VOLUMES = [
  { amount: 0.25, label: '250ml', icon: '🥃' },
  { amount: 0.35, label: '350ml', icon: '🥤' },
  { amount: 0.5, label: '500ml', icon: '🍶' },
  { amount: 1.0, label: '1L', icon: '🫙' }
];

export default function WaterTracker({ 
  className = "", 
  showTarget = true,
  compact = false 
}: WaterTrackerProps) {
  const { state, actions } = useHealth();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const currentWater = state.dailyProgress.water;
  const targetWater = 2.5; // 2.5L daily target
  const progressPercentage = Math.min((currentWater / targetWater) * 100, 100);

  const handleAddWater = async (amount: number) => {
    setIsAdding(true);
    setSelectedAmount(amount);
    
    try {
      await actions.addWaterEntry(amount);
      
      // Small delay for visual feedback
      setTimeout(() => {
        setIsAdding(false);
        setSelectedAmount(null);
      }, 300);
    } catch (error) {
      console.error('Failed to add water:', error);
      setIsAdding(false);
      setSelectedAmount(null);
    }
  };

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium">Water</span>
          </div>
          <div className="text-sm font-semibold text-cyan-600">
            {currentWater.toFixed(1)}L / {targetWater}L
          </div>
        </div>
        
        <div className="flex gap-2 mb-3">
          {QUICK_VOLUMES.map((volume) => (
            <button
              key={volume.amount}
              onClick={() => handleAddWater(volume.amount)}
              disabled={isAdding}
              className={`
                flex-1 p-2 rounded-lg border-2 transition-all duration-200
                ${selectedAmount === volume.amount && isAdding 
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 scale-95' 
                  : 'border-base-300 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10'
                }
                ${isAdding ? 'opacity-60' : 'hover:scale-105'}
              `}
            >
              <div className="text-lg mb-1">{volume.icon}</div>
              <div className="text-xs font-medium">{volume.label}</div>
            </button>
          ))}
        </div>
        
        <div className="w-full bg-base-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`health-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Droplets className="w-5 h-5 text-cyan-600" />
          Water Intake
        </h3>
        {showTarget && (
          <div className="flex items-center gap-1 text-sm text-base-content/60 bg-base-200 px-3 py-1 rounded-full">
            <Target className="w-3 h-3" />
            {targetWater}L daily
          </div>
        )}
      </div>

      {/* Current Progress */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-cyan-600 mb-2">
          {currentWater.toFixed(1)}L
        </div>
        <div className="text-sm text-base-content/60 mb-4">
          {(targetWater - currentWater).toFixed(1)}L remaining
        </div>
        
        {/* Progress Ring */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div 
            className="radial-progress text-cyan-500 bg-base-200"
            style={{ 
              '--value': progressPercentage, 
              '--size': '6rem', 
              '--thickness': '6px' 
            } as any}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-cyan-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-base-content/80 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Quick Add
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {QUICK_VOLUMES.map((volume) => (
            <button
              key={volume.amount}
              onClick={() => handleAddWater(volume.amount)}
              disabled={isAdding}
              className={`
                group relative p-4 rounded-xl border-2 transition-all duration-200
                ${selectedAmount === volume.amount && isAdding 
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 scale-95' 
                  : 'border-base-300 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10'
                }
                ${isAdding ? 'opacity-60' : 'hover:scale-105 hover:shadow-md'}
              `}
            >
              <div className="text-center">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {volume.icon}
                </div>
                <div className="text-sm font-medium text-base-content/80">
                  {volume.label}
                </div>
                <div className="text-xs text-base-content/60 mt-1">
                  +{volume.amount}L
                </div>
              </div>
              
              {selectedAmount === volume.amount && isAdding && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="loading loading-spinner loading-sm text-cyan-500"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Progress Indicator */}
      <div className="mt-6 pt-4 border-t border-base-200">
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <span>0L</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Progress</span>
          </div>
          <span>{targetWater}L</span>
        </div>
        <div className="w-full bg-base-200 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
} 