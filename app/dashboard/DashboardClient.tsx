'use client';

import { useState } from 'react';
import { Camera, Dumbbell, Activity, Target, Calendar, RefreshCw, TrendingUp, Plus, Flame, Droplets, Footprints, Clock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHealth } from '../context/HealthContext';
import AppLayout from '../components/layout/AppLayout';
import CalorieRing from '../components/ui/CalorieRing';
import MacroBreakdown from '../components/ui/MacroBreakdown';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function DashboardClient() {
  const router = useRouter();
  const { state, actions } = useHealth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await actions.refreshData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🎉';
      case 'recommendation': return '💡';
      case 'warning': return '⚠️';
      case 'trend': return '📈';
      default: return 'ℹ️';
    }
  };

  const getCalorieProgress = () => {
    const { consumed } = state.dailyProgress.calories;
    const { calories: target } = state.nutritionGoals;
    return Math.min((consumed / target) * 100, 100);
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading your health dashboard..." />;
  }

  return (
    <AppLayout title="🏥 HealthTracker Pro">
      <div className="space-y-6">
        {/* Header with Refresh */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome Back!
            </h1>
            <p className="text-base-content/60 mt-1">Let's track your health journey today</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Quick Actions */}
        <div className="health-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/food')}
              className="group flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">AI Food Scan</span>
              <span className="text-xs opacity-75 mt-1">Smart camera analysis</span>
            </button>
            <button 
              onClick={() => router.push('/food')}
              className="group flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Camera className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Barcode Scan</span>
              <span className="text-xs opacity-75 mt-1">Quick product lookup</span>
            </button>
            <button 
              onClick={() => router.push('/workout')}
              className="group flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Dumbbell className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Log Workout</span>
              <span className="text-xs opacity-75 mt-1">Track exercise</span>
            </button>
            <button 
              onClick={() => router.push('/goals')}
              className="group flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Target className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Set Goals</span>
              <span className="text-xs opacity-75 mt-1">Track targets</span>
            </button>
          </div>
        </div>

        {/* Today's Overview with Real-time Calorie Ring */}
        <div className="health-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Overview
            </h2>
            <div className="flex items-center text-sm text-base-content/60 bg-base-200 px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(state.selectedDate).toLocaleDateString()}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calorie Ring */}
            <div className="flex justify-center">
              <CalorieRing 
                consumed={state.dailyProgress.calories.consumed}
                burned={state.dailyProgress.calories.burned}
                target={state.nutritionGoals.calories}
                size="xl"
                showDetails={true}
                animate={true}
              />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                <div className="flex justify-center mb-2">
                  <Footprints className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{state.dailyProgress.steps.toLocaleString()}</div>
                <div className="text-sm text-blue-600/70">Steps</div>
              </div>

              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30">
                <div className="flex justify-center mb-2">
                  <Droplets className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="text-2xl font-bold text-cyan-600">{state.dailyProgress.water}L</div>
                <div className="text-sm text-cyan-600/70">Water</div>
              </div>

              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
                <div className="flex justify-center mb-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{state.dailyProgress.workoutMinutes}min</div>
                <div className="text-sm text-orange-600/70">Exercise</div>
              </div>

              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30">
                <div className="flex justify-center mb-2">
                  <Flame className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{state.dailyProgress.calories.burned}</div>
                <div className="text-sm text-red-600/70">Burned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Macronutrients Breakdown */}
        <div className="health-card p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Macronutrients Today
          </h3>
          <MacroBreakdown 
            macros={state.dailyProgress.macros}
            goals={state.nutritionGoals}
            layout="horizontal"
            showCalories={true}
            animate={true}
          />
        </div>

        {/* Health Score & AI Insights Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Health Score */}
          <div className="health-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Health Score
            </h3>
            <div className="text-center">
              <div className={`text-5xl font-bold mb-4 ${getScoreColor(state.healthScore)}`}>
                {state.healthScore}
              </div>
              <div className="text-base-content/60 mb-6">
                {getScoreDescription(state.healthScore)}
              </div>
              <div className="relative w-32 h-32 mx-auto">
                <div 
                  className="radial-progress text-primary bg-base-200"
                  style={{ '--value': state.healthScore, '--size': '8rem', '--thickness': '8px' } as any}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-medium">{state.healthScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Meals */}
          <div className="health-card p-6">
            <h3 className="text-lg font-semibold mb-6">Recent Meals</h3>
            <div className="space-y-3">
              {state.foodEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-base-200/50">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{entry.name}</h4>
                    <p className="text-xs text-base-content/60 capitalize">{entry.mealType}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{entry.calories} cal</div>
                    <div className="text-xs text-base-content/60">{entry.protein}g protein</div>
                  </div>
                </div>
              ))}
              {state.foodEntries.length === 0 && (
                <div className="text-center py-8 text-base-content/60">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No meals logged today</p>
                  <button
                    onClick={() => router.push('/food')}
                    className="btn btn-primary btn-sm mt-2"
                  >
                    Log Your First Meal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="health-card p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-base-200/50">
              <div className="text-lg font-bold text-primary">{state.achievements.currentStreak}</div>
              <div className="text-xs text-base-content/60">Day Streak</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-base-200/50">
              <div className="text-lg font-bold text-success">{state.foodEntries.length}</div>
              <div className="text-xs text-base-content/60">Meals Today</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-base-200/50">
              <div className="text-lg font-bold text-warning">{state.workoutEntries.length}</div>
              <div className="text-xs text-base-content/60">Workouts</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-base-200/50">
              <div className="text-lg font-bold text-info">{Math.round(getCalorieProgress())}%</div>
              <div className="text-xs text-base-content/60">Calorie Goal</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 