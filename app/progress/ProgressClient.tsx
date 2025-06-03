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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'workouts' | 'calories' | 'volume'>('weight');
  
  // Data states
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [biomarkers, setBiomarkers] = useState<BiomarkerEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  
  // Computed states
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics>({
    weightChange: 0,
    workoutFrequency: 0,
    averageCalories: 0,
    goalCompletion: 0,
    strengthProgress: 0,
    cardioProgress: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      calculateMetrics();
      generateChartData();
      checkAchievements();
    }
  }, [selectedTimeframe, workouts, biomarkers, goals, foodEntries, isLoading]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const [workoutData, biomarkerData, goalData, foodData, statsData, insightData] = await Promise.all([
        databaseService.getWorkoutEntries(),
        databaseService.getBiomarkerEntries(),
        databaseService.getGoals(),
        databaseService.getFoodEntries(),
        databaseService.getAllDailyStats(),
        databaseService.getAIInsights(),
      ]);
      
      setWorkouts(workoutData);
      setBiomarkers(biomarkerData);
      setGoals(goalData);
      setFoodEntries(foodData);
      setDailyStats(statsData);
      setInsights(insightData);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeFilter = (timeframe: string): number => {
    const now = Date.now();
    const timeframes = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    return now - timeframes[timeframe as keyof typeof timeframes];
  };

  const calculateMetrics = () => {
    const cutoff = getTimeframeFilter(selectedTimeframe);
    
    // Filter data by timeframe
    const recentWorkouts = workouts.filter(w => w.timestamp > cutoff);
    const recentBiomarkers = biomarkers.filter(b => b.timestamp > cutoff);
    const recentFood = foodEntries.filter(f => f.timestamp > cutoff);
    
    // Weight change
    const weightEntries = recentBiomarkers
      .filter(b => b.type === 'weight')
      .sort((a, b) => a.timestamp - b.timestamp);
    const weightChange = weightEntries.length >= 2 ? 
      weightEntries[weightEntries.length - 1].value - weightEntries[0].value : 0;
    
    // Workout frequency (workouts per week)
    const weekCount = Math.ceil((Date.now() - cutoff) / (7 * 24 * 60 * 60 * 1000));
    const workoutFrequency = recentWorkouts.length / weekCount;
    
    // Average calories
    const totalCalories = recentFood.reduce((sum, food) => sum + food.calories, 0);
    const averageCalories = recentFood.length > 0 ? totalCalories / recentFood.length : 0;
    
    // Goal completion
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const goalCompletion = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
    
    // Strength and cardio progress (simplified)
    const strengthWorkouts = recentWorkouts.filter(w => w.type === 'strength');
    const cardioWorkouts = recentWorkouts.filter(w => w.type === 'cardio');
    const strengthProgress = strengthWorkouts.length;
    const cardioProgress = cardioWorkouts.length;
    
    setProgressMetrics({
      weightChange,
      workoutFrequency,
      averageCalories,
      goalCompletion,
      strengthProgress,
      cardioProgress,
    });
  };

  const generateChartData = () => {
    const cutoff = getTimeframeFilter(selectedTimeframe);
    const days = Math.ceil((Date.now() - cutoff) / (24 * 60 * 60 * 1000));
    
    const data: ChartData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      // Weight data
      const dayWeight = biomarkers
        .filter(b => b.type === 'weight' && b.timestamp >= dayStart && b.timestamp < dayEnd)
        .sort((a, b) => b.timestamp - a.timestamp)[0]?.value;
      
      // Workout data
      const dayWorkouts = workouts
        .filter(w => w.timestamp >= dayStart && w.timestamp < dayEnd);
      
      // Food data
      const dayFood = foodEntries
        .filter(f => f.timestamp >= dayStart && f.timestamp < dayEnd);
      const dayCalories = dayFood.reduce((sum, f) => sum + f.calories, 0);
      
      // Volume calculation (simplified)
      const dayVolume = dayWorkouts
        .filter(w => w.type === 'strength')
        .reduce((sum, w) => {
          return sum + (w.exercises?.reduce((exSum, ex) => {
            return exSum + ((ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0));
          }, 0) || 0);
        }, 0);
      
      data.push({
        date: dateStr,
        weight: dayWeight,
        calories: dayCalories,
        workouts: dayWorkouts.length,
        volume: dayVolume,
      });
    }
    
    setChartData(data);
  };

  const checkAchievements = () => {
    const newAchievements: string[] = [];
    
    // Check for various achievements
    if (workouts.length >= 10) newAchievements.push('💪 10 Workouts Completed');
    if (workouts.length >= 50) newAchievements.push('🏆 Fitness Warrior - 50 Workouts');
    if (goals.filter(g => g.isCompleted).length >= 5) newAchievements.push('🎯 Goal Crusher - 5 Goals');
    if (progressMetrics.workoutFrequency >= 3) newAchievements.push('🔥 Consistent Performer');
    
    // Weight loss achievements
    if (progressMetrics.weightChange <= -5) newAchievements.push('📉 5kg Weight Loss');
    if (progressMetrics.weightChange <= -10) newAchievements.push('🌟 10kg Weight Loss');
    
    setAchievements(newAchievements);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-error" />;
    return <div className="w-4 h-4" />;
  };

  const formatTimeframe = (timeframe: string) => {
    const labels = {
      week: 'This Week',
      month: 'This Month',
      quarter: 'Last 3 Months',
      year: 'This Year',
    };
    return labels[timeframe as keyof typeof labels];
  };

  const generateHealthReport = async () => {
    try {
      const cutoff = getTimeframeFilter(selectedTimeframe);
      const recentWorkouts = workouts.filter(w => w.timestamp > cutoff);
      const recentFood = foodEntries.filter(f => f.timestamp > cutoff);
      
      const report: HealthReport = {
        id: Date.now().toString(),
        type: selectedTimeframe === 'week' ? 'weekly' : 'monthly',
        startDate: cutoff,
        endDate: Date.now(),
        summary: {
          totalCalories: recentFood.reduce((sum, f) => sum + f.calories, 0),
          avgCalories: progressMetrics.averageCalories,
          totalWorkouts: recentWorkouts.length,
          avgWorkoutDuration: recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / recentWorkouts.length,
          weightChange: progressMetrics.weightChange,
          achievements: achievements,
          improvements: ['Increased workout frequency', 'Better sleep quality'],
          recommendations: ['Increase protein intake', 'Add more cardio sessions'],
        },
        generatedAt: Date.now(),
      };
      
      // For demo purposes, we'll just log the report
      console.log('Generated Health Report:', report);
      
      // In a real app, you might save this or export it
      alert('Health report generated! Check console for details.');
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="📈 Progress">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="📈 Progress">
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Progress Tracking</h1>
            <p className="text-base-content/60">Monitor your health and fitness journey</p>
          </div>
          
          <div className="flex gap-2">
            <div className="join">
              {(['week', 'month', 'quarter', 'year'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`btn btn-sm join-item ${selectedTimeframe === timeframe ? 'btn-active' : ''}`}
                >
                  {timeframe === 'quarter' ? '3M' : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </button>
              ))}
            </div>
            
            <button
              onClick={generateHealthReport}
              className="btn btn-sm btn-primary"
            >
              <Download className="w-4 h-4" />
              Report
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="health-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-5 h-5 text-blue-500" />
              {getTrendIcon(progressMetrics.weightChange)}
            </div>
            <div className="text-2xl font-bold">
              {progressMetrics.weightChange > 0 ? '+' : ''}{progressMetrics.weightChange.toFixed(1)}kg
            </div>
            <div className="text-xs text-base-content/60">Weight Change</div>
          </div>

          <div className="health-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Dumbbell className="w-5 h-5 text-green-500" />
              {getTrendIcon(progressMetrics.workoutFrequency)}
            </div>
            <div className="text-2xl font-bold">
              {progressMetrics.workoutFrequency.toFixed(1)}
            </div>
            <div className="text-xs text-base-content/60">Workouts/Week</div>
          </div>

          <div className="health-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">
              {Math.round(progressMetrics.averageCalories)}
            </div>
            <div className="text-xs text-base-content/60">Avg Calories</div>
          </div>

          <div className="health-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">
              {Math.round(progressMetrics.goalCompletion)}%
            </div>
            <div className="text-xs text-base-content/60">Goals Completed</div>
          </div>

          <div className="health-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold">
              {progressMetrics.strengthProgress}
            </div>
            <div className="text-xs text-base-content/60">Strength Workouts</div>
          </div>

          <div className="health-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div className="text-2xl font-bold">
              {progressMetrics.cardioProgress}
            </div>
            <div className="text-xs text-base-content/60">Cardio Sessions</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="health-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Trends - {formatTimeframe(selectedTimeframe)}</h3>
            <select
              className="select select-bordered select-sm"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
            >
              <option value="weight">Weight</option>
              <option value="workouts">Workouts</option>
              <option value="calories">Calories</option>
              <option value="volume">Training Volume</option>
            </select>
          </div>

          {/* Simple Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-1 bg-base-200 rounded-lg p-4">
            {chartData.slice(-14).map((data, index) => {
              const value = data[selectedMetric] || 0;
              const maxValue = Math.max(...chartData.map(d => d[selectedMetric] || 0));
              const height = maxValue > 0 ? (value / maxValue) * 200 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-primary rounded-t w-4 transition-all duration-300"
                    style={{ height: `${height}px` }}
                    title={`${data.date}: ${value}`}
                  />
                  <div className="text-xs text-base-content/60 mt-1 transform -rotate-45">
                    {new Date(data.date).getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-base-content/60 text-center">
            {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} over time
          </div>
        </div>

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <div className="health-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Recent Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Goals Progress */}
        <div className="health-card p-6">
          <h3 className="text-lg font-semibold mb-4">Active Goals</h3>
          {goals.filter(g => !g.isCompleted).length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-base-content/40" />
              <p className="text-base-content/60">No active goals. Set some goals to track your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.filter(g => !g.isCompleted).slice(0, 3).map((goal) => {
                const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
                return (
                  <div key={goal.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{goal.title}</h4>
                        <p className="text-sm text-base-content/60">{goal.description}</p>
                      </div>
                      <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-base-content/60 mt-1">
                      <span>{goal.currentValue} {goal.unit}</span>
                      <span>{goal.targetValue} {goal.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="health-card p-6">
            <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      insight.type === 'achievement' ? 'bg-success' :
                      insight.type === 'warning' ? 'bg-warning' :
                      insight.type === 'recommendation' ? 'bg-info' : 'bg-primary'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-base-content/70 mt-1">{insight.message}</p>
                      <div className="text-xs text-base-content/50 mt-2">
                        {new Date(insight.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="health-card p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Workout Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Workouts:</span>
                <span className="font-medium">{workouts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>This {selectedTimeframe}:</span>
                <span className="font-medium">
                  {workouts.filter(w => w.timestamp > getTimeframeFilter(selectedTimeframe)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Duration:</span>
                <span className="font-medium">
                  {workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.duration, 0) / workouts.length) : 0}min
                </span>
              </div>
            </div>
          </div>

          <div className="health-card p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Nutrition Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Entries:</span>
                <span className="font-medium">{foodEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>This {selectedTimeframe}:</span>
                <span className="font-medium">
                  {foodEntries.filter(f => f.timestamp > getTimeframeFilter(selectedTimeframe)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Calories:</span>
                <span className="font-medium">{Math.round(progressMetrics.averageCalories)}</span>
              </div>
            </div>
          </div>

          <div className="health-card p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Health Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Goals:</span>
                <span className="font-medium">{goals.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium text-success">{goals.filter(g => g.isCompleted).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Biomarker Entries:</span>
                <span className="font-medium">{biomarkers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 