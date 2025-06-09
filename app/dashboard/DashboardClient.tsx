'use client';

import { useState } from 'react';
import { Camera, Dumbbell, Activity, Target, Calendar, RefreshCw, TrendingUp, Plus, Flame, Droplets, Footprints, Clock, Zap, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHealth } from '../context/HealthContext';
import AppLayout from '../components/layout/AppLayout';
import CalorieRing from '../components/ui/CalorieRing';
import MacroBreakdown from '../components/ui/MacroBreakdown';
import LoadingScreen from '../components/ui/LoadingScreen';
import FoodDetailModal from '../components/ui/FoodDetailModal';
import CameraDebugger from '../components/CameraDebugger';
import WaterTrackerOverlay from '../components/WaterTrackerOverlay';
import { FoodEntry } from '../types';

export default function DashboardClient() {
  const router = useRouter();
  const { state, actions } = useHealth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [showWaterOverlay, setShowWaterOverlay] = useState(false);

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

  const handleFoodClick = (food: FoodEntry) => {
    setSelectedFood(food);
    setShowFoodDetail(true);
  };

  const handleCloseFoodDetail = () => {
    setShowFoodDetail(false);
    setSelectedFood(null);
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
        {/* Today's Overview with Real-time Calorie Ring */}
        <div className="health-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Overview
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm text-base-content/60 bg-base-200 px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(state.selectedDate).toLocaleDateString()}
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

            {/* Key Metrics - Only Steps and Water */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                <div className="flex justify-center mb-2">
                  <Footprints className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{state.dailyProgress.steps.toLocaleString()}</div>
                <div className="text-sm text-blue-600/70">Steps</div>
              </div>

              <button
                onClick={() => setShowWaterOverlay(true)}
                className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 hover:scale-105 transition-transform duration-200 border-2 border-transparent hover:border-cyan-300"
              >
                <div className="flex justify-center mb-2">
                  <Droplets className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="text-2xl font-bold text-cyan-600">{state.dailyProgress.water.toFixed(1)}L</div>
                <div className="text-sm text-cyan-600/70">Water</div>
                <div className="text-xs text-cyan-600/50 mt-1">Tap to add</div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions - All 4 in one row */}
        <div className="health-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button 
              onClick={() => router.push('/food')}
              className="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">AI Food Scan</span>
            </button>
            <button 
              onClick={() => router.push('/workout')}
              className="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Dumbbell className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">Log Workout</span>
            </button>
            <button 
              onClick={() => setShowWaterOverlay(true)}
              className="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Droplets className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">Add Water</span>
            </button>
            <button 
              onClick={() => router.push('/progress')}
              className="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <TrendingUp className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">Weekly Check-in</span>
            </button>
            <button 
              onClick={() => router.push('/health-ai')}
              className="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Brain className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">Health AI</span>
            </button>
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
                <button
                  key={entry.id}
                  onClick={() => handleFoodClick(entry)}
                  className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-300/50 transition-colors text-left w-full"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{entry.name}</h4>
                    <p className="text-xs text-base-content/60 capitalize">{entry.mealType}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{entry.calories} cal</div>
                    <div className="text-xs text-base-content/60">{entry.protein}g protein</div>
                  </div>
                </button>
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

        {/* Camera Debugger - Temporary for Testing */}
        <CameraDebugger />
      </div>

      {/* Food Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={showFoodDetail}
        onClose={handleCloseFoodDetail}
      />

      {/* Water Tracker Overlay */}
      <WaterTrackerOverlay
        isOpen={showWaterOverlay}
        onClose={() => setShowWaterOverlay(false)}
      />
    </AppLayout>
  );
} 