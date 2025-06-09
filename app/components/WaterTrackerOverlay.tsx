'use client';

import React, { useState, useEffect } from 'react';
import { Droplets, X, Target, TrendingUp } from 'lucide-react';
import { useHealth } from '../context/HealthContext';

interface WaterTrackerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_VOLUMES = [
  { amount: 0.2, label: '200ml', icon: '🥃' },
  { amount: 0.5, label: '500ml', icon: '🥤' },
  { amount: 1.0, label: '1L', icon: '🫙' },
];

export default function WaterTrackerOverlay({ isOpen, onClose }: WaterTrackerOverlayProps) {
  const { state, actions } = useHealth();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const currentWater = state.dailyProgress.water;
  const targetWater = 2.5; // 2.5L daily target
  const progressPercentage = Math.min((currentWater / targetWater) * 100, 100);

  // Close overlay on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleAddWater = async (amount: number) => {
    setIsAdding(true);
    setSelectedAmount(amount);
    
    try {
      await actions.addWaterEntry(amount);
      
      // Small delay for visual feedback
      setTimeout(() => {
        setIsAdding(false);
        setSelectedAmount(null);
      }, 500);
    } catch (error) {
      console.error('Failed to add water:', error);
      setIsAdding(false);
      setSelectedAmount(null);
    }
  };

  const handleCustomAdd = async () => {
    const amount = parseFloat(customAmount);
    if (amount && amount > 0) {
      await handleAddWater(amount);
      setCustomAmount('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm">
      {/* Overlay that covers 4/5 of the screen from bottom */}
      <div 
        className="w-full bg-base-100 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{ height: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Water Tracker</h2>
              <p className="text-sm text-base-content/60">Stay hydrated throughout the day</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-6 text-center bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div 
              className="radial-progress text-cyan-500 bg-base-200"
              style={{ 
                '--value': progressPercentage, 
                '--size': '8rem', 
                '--thickness': '8px' 
              } as any}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-cyan-600">
                  {Math.round(progressPercentage)}%
                </span>
                <span className="text-xs text-cyan-600/70">complete</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-cyan-600">
              {currentWater.toFixed(1)}L
            </div>
            <div className="text-sm text-base-content/60">
              {(targetWater - currentWater).toFixed(1)}L remaining to reach your goal
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-base-content/50">
              <Target className="w-3 h-3" />
              Daily goal: {targetWater}L
            </div>
          </div>
        </div>

        {/* Quick Add Section */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Add</h3>
            <div className="grid grid-cols-3 gap-4">
              {QUICK_VOLUMES.map((volume) => (
                <button
                  key={volume.amount}
                  onClick={() => handleAddWater(volume.amount)}
                  disabled={isAdding}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-200
                    ${selectedAmount === volume.amount && isAdding 
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 scale-95' 
                      : 'border-base-300 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10'
                    }
                    ${isAdding ? 'opacity-60' : 'hover:scale-105 hover:shadow-lg'}
                  `}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3 transition-transform group-hover:scale-110">
                      {volume.icon}
                    </div>
                    <div className="text-lg font-bold text-base-content/90">
                      {volume.label}
                    </div>
                    <div className="text-sm text-cyan-600 font-medium mt-1">
                      +{volume.amount}L
                    </div>
                  </div>
                  
                  {selectedAmount === volume.amount && isAdding && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 rounded-2xl">
                      <div className="loading loading-spinner loading-md text-cyan-500"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Custom Amount</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter liters (e.g., 0.3)"
                  className="input input-bordered w-full"
                  step="0.1"
                  min="0"
                  max="5"
                />
              </div>
              <button
                onClick={handleCustomAdd}
                disabled={!customAmount || parseFloat(customAmount) <= 0 || isAdding}
                className="btn btn-primary px-8"
              >
                Add
              </button>
            </div>
          </div>

          {/* Today's Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm text-base-content/60 mb-2">
              <span>Today's Progress</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{currentWater.toFixed(1)}L / {targetWater}L</span>
              </div>
            </div>
            <div className="w-full bg-base-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Achievement Badge */}
          {progressPercentage >= 100 && (
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-lg font-bold text-green-600">Goal Achieved!</div>
              <div className="text-sm text-green-600/70">Great job staying hydrated today!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 