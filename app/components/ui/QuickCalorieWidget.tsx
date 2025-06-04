'use client';

import { useHealth } from '../../context/HealthContext';
import { Flame, Target } from 'lucide-react';

export default function QuickCalorieWidget() {
  const { state } = useHealth();

  if (state.isLoading) {
    return (
      <div className="bg-base-200 rounded-lg p-2 animate-pulse">
        <div className="h-4 bg-base-300 rounded w-16"></div>
      </div>
    );
  }

  const { consumed, burned } = state.dailyProgress.calories;
  const target = state.nutritionGoals.calories;
  const remaining = Math.max(0, target - consumed + burned);
  const percentage = Math.min((consumed / target) * 100, 100);

  const getStatusColor = () => {
    if (percentage >= 90 && percentage <= 110) return 'text-success';
    if (percentage >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-base-200/50 backdrop-blur-sm rounded-lg p-3 min-w-[120px]">
      <div className="flex items-center justify-between mb-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-xs text-base-content/60">Calories</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{consumed.toLocaleString()}</span>
          <span className="text-xs text-base-content/60">/{target.toLocaleString()}</span>
        </div>
        
        <div className="w-full bg-base-300 rounded-full h-1.5">
          <div 
            className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${getStatusColor()}`}>
            {Math.round(percentage)}%
          </span>
          {remaining > 0 && (
            <span className="text-base-content/60">
              {remaining.toLocaleString()} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 