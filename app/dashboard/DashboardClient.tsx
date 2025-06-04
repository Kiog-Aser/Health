'use client';

import { useState, useEffect } from 'react';
import { Camera, Dumbbell, Activity, Target, Calendar, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '../components/layout/AppLayout';
import TestGeminiConnection from '../components/TestGeminiConnection';
import CameraDiagnostic from '../components/CameraDiagnostic';

interface DailyStats {
  date: string;
  calories: {
    consumed: number;
    burned: number;
    target: number;
  };
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  water: number;
  steps: number;
  workoutMinutes: number;
  sleepHours: number;
}

interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

interface DashboardData {
  todayStats: DailyStats | null;
  weeklyCalories: { day: string; consumed: number; burned: number }[];
  recentInsights: AIInsight[];
  currentWeight: number;
  goalProgress: number;
  healthScore: number;
}

export default function DashboardClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayStats: {
      date: new Date().toISOString().split('T')[0],
      calories: { consumed: 1850, burned: 420, target: 2200 },
      macros: { protein: 95, carbs: 220, fat: 65, fiber: 28 },
      water: 2.1,
      steps: 8450,
      workoutMinutes: 45,
      sleepHours: 7.5,
    },
    weeklyCalories: [
      { day: 'Mon', consumed: 1950, burned: 380 },
      { day: 'Tue', consumed: 1820, burned: 420 },
      { day: 'Wed', consumed: 2100, burned: 450 },
      { day: 'Thu', consumed: 1890, burned: 390 },
      { day: 'Fri', consumed: 2050, burned: 480 },
      { day: 'Sat', consumed: 1950, burned: 320 },
      { day: 'Sun', consumed: 1850, burned: 420 },
    ],
    recentInsights: [
      {
        id: '1',
        type: 'achievement',
        title: 'Great Week!',
        message: 'You hit your protein goal 6 out of 7 days this week.',
        timestamp: Date.now(),
        isRead: false,
      },
      {
        id: '2',
        type: 'recommendation',
        title: 'Hydration Reminder',
        message: 'Try to increase your water intake by 500ml daily.',
        timestamp: Date.now() - 3600000,
        isRead: false,
      },
    ],
    currentWeight: 72.5,
    goalProgress: 68,
    healthScore: 82,
  });

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
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

  if (isLoading) {
    return (
      <AppLayout title="🏥 HealthTracker Pro">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="🏥 HealthTracker Pro">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="health-card p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/food')}
              className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg transition-all duration-200"
            >
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Scan Food</span>
            </button>
            <button 
              onClick={() => router.push('/workout')}
              className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:shadow-lg transition-all duration-200"
            >
              <Dumbbell className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Log Workout</span>
            </button>
            <button 
              onClick={() => router.push('/biomarkers')}
              className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg transition-all duration-200"
            >
              <Activity className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Add Biomarker</span>
            </button>
            <button 
              onClick={() => router.push('/goals')}
              className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:shadow-lg transition-all duration-200"
            >
              <Target className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Goals</span>
            </button>
          </div>
        </div>

        <div className="health-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Today's Overview</h2>
            <div className="flex items-center text-sm text-base-content/60">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dashboardData.todayStats?.calories.consumed}</div>
              <div className="text-sm text-base-content/60">Calories</div>
              <div className="text-xs text-base-content/40">of {dashboardData.todayStats?.calories.target}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{dashboardData.todayStats?.steps.toLocaleString()}</div>
              <div className="text-sm text-base-content/60">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{dashboardData.todayStats?.water}L</div>
              <div className="text-sm text-base-content/60">Water</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{dashboardData.todayStats?.workoutMinutes}min</div>
              <div className="text-sm text-base-content/60">Exercise</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-3">Macronutrients</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-red-500">{dashboardData.todayStats?.macros.protein}g</div>
                <div className="text-xs text-base-content/60">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-500">{dashboardData.todayStats?.macros.carbs}g</div>
                <div className="text-xs text-base-content/60">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-500">{dashboardData.todayStats?.macros.fat}g</div>
                <div className="text-xs text-base-content/60">Fat</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-500">{dashboardData.todayStats?.macros.fiber}g</div>
                <div className="text-xs text-base-content/60">Fiber</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="health-card p-6">
            <h3 className="text-lg font-semibold mb-4">Health Score</h3>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(dashboardData.healthScore)}`}>
                {dashboardData.healthScore}
              </div>
              <div className="text-sm text-base-content/60 mb-4">
                {getScoreDescription(dashboardData.healthScore)}
              </div>
              <div className="radial-progress text-primary" style={{ '--value': dashboardData.healthScore } as any}>
                {dashboardData.healthScore}%
              </div>
            </div>
          </div>

          <div className="health-card p-6">
            <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
            <div className="space-y-3">
              {dashboardData.recentInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-base-100">
                  <span className="text-lg">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-base-content/70">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="health-card p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Calorie Overview</h3>
          <div className="grid grid-cols-7 gap-2">
            {dashboardData.weeklyCalories.map((day) => (
              <div key={day.day} className="text-center">
                <div className="text-xs text-base-content/60 mb-1">{day.day}</div>
                <div className="bg-base-200 rounded-lg p-2">
                  <div className="text-sm font-medium text-primary">{day.consumed}</div>
                  <div className="text-xs text-base-content/60">cal</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <TestGeminiConnection />

        <CameraDiagnostic />
      </div>
    </AppLayout>
  );
} 