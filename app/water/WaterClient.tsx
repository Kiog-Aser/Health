'use client';

import React, { useState } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Target, Award, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '../components/layout/AppLayout';
import WaterTracker from '../components/WaterTracker';
import { useHealth } from '../context/HealthContext';

export default function WaterClient() {
  const router = useRouter();
  const { state } = useHealth();
  const [selectedDate, setSelectedDate] = useState(state.selectedDate);

  const currentWater = state.dailyProgress.water;
  const targetWater = 2.5;
  const progressPercentage = Math.min((currentWater / targetWater) * 100, 100);

  const getHydrationStatus = () => {
    const percentage = progressPercentage;
    if (percentage >= 100) return { status: 'Excellent', color: 'text-success', emoji: '💧' };
    if (percentage >= 75) return { status: 'Good', color: 'text-primary', emoji: '🌊' };
    if (percentage >= 50) return { status: 'Moderate', color: 'text-warning', emoji: '💦' };
    return { status: 'Low', color: 'text-error', emoji: '🏜️' };
  };

  const hydrationStatus = getHydrationStatus();

  const weeklyGoal = targetWater * 7;
  const weeklyProgress = currentWater * 7; // Simplified for demo

  return (
    <AppLayout title="💧 Water Tracking">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base-content/60 hover:text-base-content transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        {/* Header Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="health-card p-6 text-center">
            <div className="text-2xl mb-2">{hydrationStatus.emoji}</div>
            <div className={`text-lg font-semibold ${hydrationStatus.color}`}>
              {hydrationStatus.status}
            </div>
            <div className="text-sm text-base-content/60">Hydration Level</div>
          </div>

          <div className="health-card p-6 text-center">
            <div className="text-2xl font-bold text-cyan-600 mb-2">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-base-content/80 font-medium">Daily Goal</div>
            <div className="text-xs text-base-content/60">
              {currentWater.toFixed(1)}L / {targetWater}L
            </div>
          </div>

          <div className="health-card p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {state.waterEntries.length}
            </div>
            <div className="text-sm text-base-content/80 font-medium">Entries Today</div>
            <div className="text-xs text-base-content/60">Water logged</div>
          </div>
        </div>

        {/* Main Water Tracker */}
        <WaterTracker showTarget={true} />

        {/* Today's Log */}
        <div className="health-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Today's Water Log
          </h3>
          
          {state.waterEntries.length > 0 ? (
            <div className="space-y-3">
              {state.waterEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-base-200/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">💧</div>
                    <div>
                      <div className="font-medium">{entry.amount}L</div>
                      <div className="text-xs text-base-content/60">
                        {new Date(entry.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-cyan-600 font-medium">
                    +{(entry.amount * 1000).toFixed(0)}ml
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <div className="text-4xl mb-3">🏜️</div>
              <p className="text-sm">No water logged today</p>
              <p className="text-xs mt-1">Start tracking your hydration above!</p>
            </div>
          )}
        </div>

        {/* Tips & Motivation */}
        <div className="health-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Hydration Tips
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-lg mb-2">🌅</div>
              <h4 className="font-medium text-sm mb-1">Start Early</h4>
              <p className="text-xs text-base-content/70">
                Drink a glass of water as soon as you wake up to kickstart your hydration.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="text-lg mb-2">⏰</div>
              <h4 className="font-medium text-sm mb-1">Set Reminders</h4>
              <p className="text-xs text-base-content/70">
                Use phone alarms or apps to remind yourself to drink water every 2 hours.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-lg mb-2">🍋</div>
              <h4 className="font-medium text-sm mb-1">Add Flavor</h4>
              <p className="text-xs text-base-content/70">
                Try adding lemon, cucumber, or mint to make water more enjoyable.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
              <div className="text-lg mb-2">🏃‍♂️</div>
              <h4 className="font-medium text-sm mb-1">Extra for Exercise</h4>
              <p className="text-xs text-base-content/70">
                Increase intake by 500-750ml for every hour of exercise.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="health-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Progress Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-cyan-600">
                {currentWater.toFixed(1)}L
              </div>
              <div className="text-xs text-base-content/60">Today</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {(targetWater - currentWater).toFixed(1)}L
              </div>
              <div className="text-xs text-base-content/60">Remaining</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-teal-600">
                {targetWater}L
              </div>
              <div className="text-xs text-base-content/60">Daily Goal</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-indigo-600">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-xs text-base-content/60">Complete</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 