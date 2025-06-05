'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar,
  Activity,
  Scale,
  Dumbbell,
  Heart,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  Share,
  Zap
} from 'lucide-react';
import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { 
  WorkoutEntry, 
  BiomarkerEntry, 
  Goal, 
  FoodEntry, 
  DailyStats, 
  HealthReport,
  AIInsight
} from '../types';
import AppLayout from '../components/layout/AppLayout';
import WeeklyCheckin from '../components/WeeklyCheckin';

interface ProgressMetrics {
  weightChange: number;
  workoutFrequency: number;
  averageCalories: number;
  goalCompletion: number;
  strengthProgress: number;
  cardioProgress: number;
}

interface ChartData {
  date: string;
  weight?: number;
  calories?: number;
  workouts?: number;
  volume?: number;
}

export default function ProgressClient() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'history' | 'goals'>('checkin');
  const [recentEntries, setRecentEntries] = useState<BiomarkerEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const [biomarkers, userGoals] = await Promise.all([
        databaseService.getBiomarkerEntries(),
        databaseService.getGoals(),
      ]);

      setRecentEntries(biomarkers.slice(0, 10));
      setGoals(userGoals);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckinComplete = () => {
    // Refresh data after checkin
    loadData();
    // Switch to history tab to show the new entry
    setActiveTab('history');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBiomarkerIcon = (type: string) => {
    switch (type) {
      case 'weight': return '⚖️';
      case 'body_fat': return '🔥';
      case 'muscle_mass': return '💪';
      case 'blood_pressure_systolic': return '❤️';
      case 'blood_pressure_diastolic': return '❤️';
      case 'heart_rate': return '💓';
      case 'blood_glucose': return '🩸';
      case 'sleep_hours': return '😴';
      case 'water_intake': return '💧';
      case 'steps': return '👟';
      default: return '📊';
    }
  };

  const getGoalProgress = (goal: Goal): number => {
    if (goal.targetValue === 0) return 0;
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  if (isLoading) {
    return (
      <AppLayout title="📈 Progress Tracking">
        <div className="flex justify-center items-center min-h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="📈 Progress Tracking">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="tabs tabs-boxed">
            <a 
              className={`tab ${activeTab === 'checkin' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('checkin')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Weekly Check-in
            </a>
            <a 
              className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              History
            </a>
            <a 
              className={`tab ${activeTab === 'goals' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('goals')}
            >
              <Target className="w-4 h-4 mr-2" />
              Goals
            </a>
          </div>
        </div>

        {/* Weekly Check-in Tab */}
        {activeTab === 'checkin' && (
          <div className="max-w-2xl mx-auto">
            <WeeklyCheckin onComplete={handleCheckinComplete} />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="health-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Recent Measurements
              </h2>
              
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-base-200/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getBiomarkerIcon(entry.type)}</span>
                        <div>
                          <div className="font-medium capitalize">
                            {entry.type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-base-content/60">
                            {formatDate(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {entry.value} {entry.unit}
                        </div>
                        {entry.notes && (
                          <div className="text-sm text-base-content/60">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Scale className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
                  <h3 className="text-lg font-medium mb-2">No measurements yet</h3>
                  <p className="text-base-content/60 mb-4">
                    Start tracking your progress with your first weekly check-in
                  </p>
                  <button
                    onClick={() => setActiveTab('checkin')}
                    className="btn btn-primary"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Start Weekly Check-in
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="health-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Health Goals
                </h2>
                <button
                  onClick={() => window.location.href = '/settings?tab=goals'}
                  className="btn btn-outline btn-sm"
                >
                  Manage Goals
                </button>
              </div>
              
              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div 
                      key={goal.id}
                      className="p-4 rounded-lg bg-base-200/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{goal.title}</h3>
                        <span className={`badge ${goal.isCompleted ? 'badge-success' : 'badge-primary'}`}>
                          {goal.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      
                      {goal.description && (
                        <p className="text-sm text-base-content/60 mb-3">
                          {goal.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                        <span className="text-sm text-base-content/60">
                          {Math.round(getGoalProgress(goal))}%
                        </span>
                      </div>
                      
                      <progress 
                        className="progress progress-primary w-full" 
                        value={getGoalProgress(goal)} 
                        max="100"
                      ></progress>
                      
                      <div className="text-xs text-base-content/60 mt-2">
                        Target date: {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
                  <h3 className="text-lg font-medium mb-2">No goals set</h3>
                  <p className="text-base-content/60 mb-4">
                    Set your first health goal to start tracking progress
                  </p>
                  <button
                    onClick={() => window.location.href = '/settings?tab=goals'}
                    className="btn btn-primary"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Set Your First Goal
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 