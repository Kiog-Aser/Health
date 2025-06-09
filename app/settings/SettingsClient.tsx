'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Target, 
  Activity, 
  Scale, 
  Settings, 
  Bell, 
  Shield, 
  Save,
  Edit,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Heart,
  Droplets,
  Moon,
  Sun,
  Globe,
  Palette,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Key,
  RefreshCw
} from 'lucide-react';
import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { UserProfile, Goal, BiomarkerEntry, BiomarkerType } from '../types';
import AppLayout from '../components/layout/AppLayout';
import { useToast } from '../components/ui/ToastNotification';
import { notificationService } from '../services/notificationService';
import { autoSyncService } from '../services/autoBackup';
import DatabaseConnection from '../components/DatabaseConnection';
import DatabaseViewer from '../components/DatabaseViewer';

const BIOMARKER_CONFIGS = {
  weight: { name: 'Weight', unit: 'kg', icon: '⚖️', color: 'bg-blue-500' },
  height: { name: 'Height', unit: 'cm', icon: '📏', color: 'bg-green-500' },
  body_fat: { name: 'Body Fat', unit: '%', icon: '🔥', color: 'bg-orange-500' },
  muscle_mass: { name: 'Muscle Mass', unit: 'kg', icon: '💪', color: 'bg-red-500' },
  blood_pressure_systolic: { name: 'Systolic BP', unit: 'mmHg', icon: '❤️', color: 'bg-pink-500' },
  blood_pressure_diastolic: { name: 'Diastolic BP', unit: 'mmHg', icon: '❤️', color: 'bg-pink-400' },
  heart_rate: { name: 'Heart Rate', unit: 'bpm', icon: '💓', color: 'bg-red-400' },
  blood_glucose: { name: 'Blood Glucose', unit: 'mg/dL', icon: '🩸', color: 'bg-purple-500' },
  cholesterol: { name: 'Cholesterol', unit: 'mg/dL', icon: '🫀', color: 'bg-indigo-500' },
  sleep_hours: { name: 'Sleep', unit: 'hours', icon: '😴', color: 'bg-blue-400' },
  water_intake: { name: 'Water Intake', unit: 'L', icon: '💧', color: 'bg-cyan-500' },
  steps: { name: 'Steps', unit: 'steps', icon: '👟', color: 'bg-emerald-500' },
  custom: { name: 'Custom', unit: '', icon: '📊', color: 'bg-gray-500' },
};

export default function SettingsClient() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as 'profile' | 'goals' | 'biomarkers' | 'preferences' || 'profile';
  
  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'biomarkers' | 'preferences'>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError, ToastContainer } = useToast();

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    height: 0,
    activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active',
  });

  // Goals data
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'weight_loss' as Goal['type'],
    targetValue: 0,
    currentValue: 0,
    unit: 'kg',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Biomarkers data
  const [biomarkers, setBiomarkers] = useState<BiomarkerEntry[]>([]);
  const [showAddBiomarker, setShowAddBiomarker] = useState(false);
  const [newBiomarker, setNewBiomarker] = useState({
    type: 'weight' as BiomarkerType,
    value: 0,
    unit: 'kg',
    notes: '',
  });

  // API Keys state
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // Auto Sync state
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const [userProfile, goalsData, biomarkersData] = await Promise.all([
        databaseService.getUserProfile(),
        databaseService.getGoals(),
        databaseService.getBiomarkerEntries(),
      ]);

      if (userProfile) {
        setProfile(userProfile);
        setProfileForm({
          name: userProfile.name,
          age: userProfile.age,
          gender: userProfile.gender,
          height: userProfile.height,
          activityLevel: userProfile.activityLevel,
        });
        setGeminiApiKey(userProfile.preferences?.apiKeys?.geminiApiKey || '');
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: Date.now().toString(),
          name: 'User',
          age: 25,
          gender: 'male',
          height: 170,
          activityLevel: 'moderately_active',
          preferences: {
            units: 'metric',
            theme: 'auto',
            notifications: {
              mealReminders: true,
              workoutReminders: true,
              goalReminders: true,
              weeklyReports: true,
            },
            privacy: {
              dataSharing: false,
              analytics: true,
            },
            apiKeys: {
              geminiApiKey: '',
            },
          },
          createdAt: Date.now(),
        };
        setProfile(defaultProfile);
        setProfileForm({
          name: defaultProfile.name,
          age: defaultProfile.age,
          gender: defaultProfile.gender,
          height: defaultProfile.height,
          activityLevel: defaultProfile.activityLevel,
        });
        setGeminiApiKey('');
      }

      setGoals(goalsData);
      setBiomarkers(biomarkersData);
      
      // Load auto sync settings
      setAutoSyncEnabled(autoSyncService.isAutoSyncEnabled());
      setLastSyncTime(autoSyncService.getLastSyncTime());
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load settings', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      
      const updatedProfile: UserProfile = {
        ...profile,
        name: profileForm.name,
        age: profileForm.age,
        gender: profileForm.gender,
        height: profileForm.height,
        activityLevel: profileForm.activityLevel,
      };

      await databaseService.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditingProfile(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showError('Failed to save profile', 'Please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      
      const updatedProfile: UserProfile = {
        ...profile,
        preferences: {
          ...profile.preferences,
          apiKeys: {
            ...profile.preferences.apiKeys,
            geminiApiKey: geminiApiKey,
          },
        },
      };

      await databaseService.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      showSuccess('API key saved successfully');
    } catch (error) {
      console.error('Failed to save API key:', error);
      showError('Failed to save API key', 'Please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.targetValue) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: newGoal.currentValue,
      unit: newGoal.unit,
      targetDate: new Date(newGoal.targetDate).getTime(),
      createdAt: Date.now(),
      isCompleted: false,
      milestones: [],
    };

    try {
      await databaseService.addGoal(goal);
      setGoals([goal, ...goals]);
      setShowAddGoal(false);
      resetNewGoal();
      showSuccess('Goal added successfully');
    } catch (error) {
      console.error('Failed to add goal:', error);
      showError('Failed to add goal', 'Please try again');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await databaseService.deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
      showSuccess('Goal deleted successfully');
    } catch (error) {
      console.error('Failed to delete goal:', error);
      showError('Failed to delete goal', 'Please try again');
    }
  };

  const handleAddBiomarker = async () => {
    if (!newBiomarker.value) return;

    const entry: BiomarkerEntry = {
      id: Date.now().toString(),
      type: newBiomarker.type,
      value: newBiomarker.value,
      unit: newBiomarker.unit,
      timestamp: Date.now(),
      notes: newBiomarker.notes || undefined,
    };

    try {
      await databaseService.addBiomarkerEntry(entry);
      setBiomarkers([entry, ...biomarkers]);
      setShowAddBiomarker(false);
      resetNewBiomarker();
      showSuccess('Measurement added successfully');
    } catch (error) {
      console.error('Failed to add biomarker:', error);
      showError('Failed to add measurement', 'Please try again');
    }
  };

  const handleDeleteBiomarker = async (entryId: string) => {
    try {
      await databaseService.deleteBiomarkerEntry(entryId);
      setBiomarkers(biomarkers.filter(entry => entry.id !== entryId));
      showSuccess('Measurement deleted successfully');
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      showError('Failed to delete measurement', 'Please try again');
    }
  };

  const resetNewGoal = () => {
    setNewGoal({
      title: '',
      description: '',
      type: 'weight_loss',
      targetValue: 0,
      currentValue: 0,
      unit: 'kg',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const resetNewBiomarker = () => {
    setNewBiomarker({
      type: 'weight',
      value: 0,
      unit: 'kg',
      notes: '',
    });
  };

  const calculateBMI = (): number => {
    if (!profile || !profile.height) return 0;
    const heightM = profile.height / 100;
    const latestWeight = biomarkers
      .filter(b => b.type === 'weight')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (!latestWeight) return 0;
    return latestWeight.value / (heightM * heightM);
  };

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-500' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-500' };
    return { category: 'Obese', color: 'text-red-500' };
  };

  const getGoalProgress = (goal: Goal): number => {
    return HealthCalculations.calculateGoalProgress(goal.currentValue, goal.targetValue, 0);
  };

  const getBiomarkerTrend = (type: BiomarkerType): 'up' | 'down' | 'stable' => {
    const entries = biomarkers
      .filter(b => b.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
    
    if (entries.length < 2) return 'stable';
    
    const values = entries.map(e => e.value).reverse();
    const trend = HealthCalculations.calculateTrend(values);
    return trend === 'increasing' ? 'up' : trend === 'decreasing' ? 'down' : 'stable';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getGoalTypeIcon = (type: Goal['type']) => {
    switch (type) {
      case 'weight_loss':
      case 'weight_gain':
        return '⚖️';
      case 'muscle_gain':
        return '💪';
      case 'fitness':
        return '🏃‍♂️';
      case 'biomarker':
        return '🩺';
      default:
        return '🎯';
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="⚙️ Settings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="⚙️ Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings & Profile</h1>
          <p className="text-base-content/60">Manage your profile, goals, measurements, and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="w-full overflow-x-auto">
          <div className="tabs bg-base-100 rounded-lg p-1 min-w-fit">
            <button
              className={`tab whitespace-nowrap ${activeTab === 'profile' ? 'tab-active bg-primary text-primary-content' : 'hover:bg-base-200'}`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              className={`tab whitespace-nowrap ${activeTab === 'goals' ? 'tab-active bg-primary text-primary-content' : 'hover:bg-base-200'}`}
              onClick={() => setActiveTab('goals')}
            >
              <Target className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Goals</span>
            </button>
            <button
              className={`tab whitespace-nowrap ${activeTab === 'biomarkers' ? 'tab-active bg-primary text-primary-content' : 'hover:bg-base-200'}`}
              onClick={() => setActiveTab('biomarkers')}
            >
              <Activity className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Measurements</span>
            </button>
            <button
              className={`tab whitespace-nowrap ${activeTab === 'preferences' ? 'tab-active bg-primary text-primary-content' : 'hover:bg-base-200'}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Settings className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Preferences</span>
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="health-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h3>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {isEditingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      disabled={!isEditingProfile}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Age</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={profileForm.age || ''}
                      onChange={(e) => setProfileForm({...profileForm, age: parseInt(e.target.value) || 0})}
                      disabled={!isEditingProfile}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Gender</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({...profileForm, gender: e.target.value as any})}
                      disabled={!isEditingProfile}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Height (cm)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={profileForm.height || ''}
                      onChange={(e) => setProfileForm({...profileForm, height: parseInt(e.target.value) || 0})}
                      disabled={!isEditingProfile}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Activity Level</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={profileForm.activityLevel}
                      onChange={(e) => setProfileForm({...profileForm, activityLevel: e.target.value as any})}
                      disabled={!isEditingProfile}
                    >
                      <option value="sedentary">Sedentary</option>
                      <option value="lightly_active">Lightly Active</option>
                      <option value="moderately_active">Moderately Active</option>
                      <option value="very_active">Very Active</option>
                      <option value="extra_active">Extra Active</option>
                    </select>
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={handleSaveProfile}
                        className="btn btn-primary flex-1 gap-2"
                        disabled={isSaving}
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Health Overview */}
            <div className="health-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Health Overview
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-base-200/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{calculateBMI().toFixed(1)}</div>
                  <div className="text-sm text-base-content/60">BMI</div>
                  <div className={`text-xs ${getBMICategory(calculateBMI()).color}`}>
                    {getBMICategory(calculateBMI()).category}
                  </div>
                </div>
                
                {profile && (
                  <>
                    <div className="text-center p-4 bg-base-200/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{profile.height}</div>
                      <div className="text-sm text-base-content/60">Height (cm)</div>
                    </div>
                    
                    <div className="text-center p-4 bg-base-200/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{profile.age}</div>
                      <div className="text-sm text-base-content/60">Years old</div>
                    </div>
                    
                    <div className="text-center p-4 bg-base-200/50 rounded-lg">
                      <div className="text-lg font-bold text-primary capitalize">{profile.activityLevel.replace('_', ' ')}</div>
                      <div className="text-sm text-base-content/60">Activity</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Goals</h3>
              <button
                onClick={() => setShowAddGoal(true)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </div>

            <div className="grid gap-4">
              {goals.length > 0 ? (
                goals.map((goal) => (
                  <div key={goal.id} className="health-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">{getGoalTypeIcon(goal.type)}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-base-content/60 mt-1">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>
                              {goal.currentValue} / {goal.targetValue} {goal.unit}
                            </span>
                            <span className="text-base-content/60">
                              Due: {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="w-full bg-base-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(getGoalProgress(goal), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-base-content/60">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No goals set</p>
                  <p>Set your first goal to start tracking your progress</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Biomarkers Tab */}
        {activeTab === 'biomarkers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Health Measurements</h3>
              <button
                onClick={() => setShowAddBiomarker(true)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Measurement
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(BIOMARKER_CONFIGS).slice(0, 4).map((type) => {
                const config = BIOMARKER_CONFIGS[type as BiomarkerType];
                const latestEntry = biomarkers
                  .filter(b => b.type === type)
                  .sort((a, b) => b.timestamp - a.timestamp)[0];
                const trend = getBiomarkerTrend(type as BiomarkerType);

                return (
                  <div key={type} className="health-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{config.icon}</span>
                      {getTrendIcon(trend)}
                    </div>
                    <div className="text-lg font-bold">
                      {latestEntry ? `${latestEntry.value} ${config.unit}` : 'No data'}
                    </div>
                    <div className="text-sm text-base-content/60">{config.name}</div>
                  </div>
                );
              })}
            </div>

            {/* Recent Measurements */}
            <div className="health-card">
              <h4 className="font-semibold mb-4">Recent Measurements</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {biomarkers.length > 0 ? (
                  biomarkers
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10)
                    .map((entry) => {
                      const config = BIOMARKER_CONFIGS[entry.type];
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{config.icon}</span>
                            <div>
                              <div className="font-medium">{config.name}</div>
                              <div className="text-sm text-base-content/60">
                                {new Date(entry.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{entry.value} {config.unit}</div>
                            <button
                              onClick={() => handleDeleteBiomarker(entry.id)}
                              className="btn btn-ghost btn-xs text-error"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No measurements recorded</p>
                    <p className="text-sm">Add your first measurement above</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && profile && (
          <div className="space-y-6">
            {/* API Keys */}
            <div className="health-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                API Keys
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Gemini API Key</span>
                    <span className="label-text-alt">
                      <a 
                        href="https://ai.google.dev/gemini-api/docs/api-key" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="link link-primary text-xs"
                      >
                        Get your API key
                      </a>
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      className="input input-bordered flex-1"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="Enter your Gemini API key"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={isSaving}
                      className="btn btn-primary"
                    >
                      {isSaving ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="label">
                    <span className="label-text-alt">
                      Your API key is stored locally and used for AI-powered food scanning.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Connection */}
            <DatabaseConnection />

            {/* Database Viewer */}
            <DatabaseViewer />

            {/* Auto Sync */}
            <div className="health-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Auto Sync
              </h3>
              
              <div className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                  <div>
                    <p className="font-medium">Automatic Sync</p>
                    <p className="text-sm text-base-content/60">
                      Automatically sync your data across all devices daily and in real-time
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    checked={autoSyncEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAutoSyncEnabled(enabled);
                      if (enabled) {
                        autoSyncService.enable();
                        showSuccess('Auto sync enabled', 'Your data will sync automatically across all devices');
                      } else {
                        autoSyncService.disable();
                        showSuccess('Auto sync disabled', 'You can still manually sync your data');
                      }
                    }}
                  />
                </div>

                {/* Status Information */}
                {autoSyncEnabled && (
                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">Auto Sync Active</span>
                    </div>
                    <div className="text-xs text-base-content/70 space-y-1">
                      {lastSyncTime > 0 ? (
                        <p>Last sync: {new Date(lastSyncTime).toLocaleString()}</p>
                      ) : (
                        <p>No sync performed yet</p>
                      )}
                      <p>Next full sync: {autoSyncService.getFormattedTimeUntilNextSync()}</p>
                      <p className="text-info">🔄 Real-time sync: Checks for changes every 15 minutes</p>
                    </div>
                  </div>
                )}

                {!autoSyncEnabled && (
                  <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium text-warning">Auto Sync Disabled</span>
                    </div>
                    <p className="text-xs text-base-content/70">
                      Enable auto sync to keep your data synchronized across all devices in real-time
                    </p>
                  </div>
                )}

                {/* Manual Sync Button */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const result = await autoSyncService.performManualSync();
                        if (result.success) {
                          setLastSyncTime(Date.now());
                          
                          let message = 'Manual sync complete!';
                          if (result.syncedCounts || result.pullCounts) {
                            const syncedCount = result.syncedCounts ? 
                              (Object.values(result.syncedCounts) as number[]).reduce((sum, count) => sum + count, 0) : 0;
                            const pulledCount = result.pullCounts ? 
                              (Object.values(result.pullCounts) as number[]).reduce((sum, count) => sum + count, 0) : 0;
                            
                            if (syncedCount > 0 && pulledCount > 0) {
                              message += `\n\nSynced ${syncedCount} items to cloud, ${pulledCount} items from other devices`;
                            } else if (syncedCount > 0) {
                              message += `\n\nSynced ${syncedCount} items to cloud`;
                            } else if (pulledCount > 0) {
                              message += `\n\nPulled ${pulledCount} items from other devices`;
                            } else {
                              message += '\n\nEverything is already up to date!';
                            }
                          }
                          
                          showSuccess('Sync complete!', message);
                        } else {
                          showError('Sync failed', result.message);
                        }
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="btn btn-outline flex-1"
                  >
                    {isSaving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Manual Sync
                      </>
                    )}
                  </button>
                </div>

                {/* Help Text */}
                <div className="text-xs text-base-content/60 bg-info/10 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-info">💡</span>
                    <div>
                      <p className="font-medium mb-1">How Auto Sync Works:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Real-time:</strong> Checks for remote changes every 15 minutes</li>
                        <li>• <strong>Instant:</strong> Syncs your changes immediately when you add data</li>
                        <li>• <strong>Daily:</strong> Full bidirectional sync every 24 hours</li>
                        <li>• <strong>Smart:</strong> Only syncs what's changed to save bandwidth</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="health-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </h3>
              
              {/* Permission Request */}
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-base-content/60">
                      Enable browser notifications for reminders
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const permission = await notificationService.requestPermission();
                      if (permission === 'granted') {
                        showSuccess('Notifications enabled!', 'You will now receive health reminders');
                      } else {
                        showError('Permission denied', 'Please enable notifications in your browser settings');
                      }
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Enable
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Meal Reminders</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked={profile.preferences.notifications.mealReminders} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Workout Reminders</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked={profile.preferences.notifications.workoutReminders} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Goal Reminders</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked={profile.preferences.notifications.goalReminders} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Weekly Reports</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked={profile.preferences.notifications.weeklyReports} />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="health-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Appearance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Theme</span>
                  <select className="select select-bordered select-sm" defaultValue={profile.preferences.theme}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span>Units</span>
                  <select className="select select-bordered select-sm" defaultValue={profile.preferences.units}>
                    <option value="metric">Metric</option>
                    <option value="imperial">Imperial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="health-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Privacy
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Data Sharing</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked={profile.preferences.privacy.dataSharing} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Analytics</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked={profile.preferences.privacy.analytics} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        {showAddGoal && (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-lg mx-4">
              <h3 className="font-bold text-lg mb-4">Add New Goal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Goal Title</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    placeholder="e.g., Lose 10kg"
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Goal Type</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={newGoal.type}
                      onChange={(e) => setNewGoal({...newGoal, type: e.target.value as Goal['type']})}
                    >
                      <option value="weight_loss">Weight Loss</option>
                      <option value="weight_gain">Weight Gain</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="fitness">Fitness</option>
                      <option value="biomarker">Health Metric</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Target Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Current Value</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={newGoal.currentValue || ''}
                      onChange={(e) => setNewGoal({...newGoal, currentValue: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Target Value</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={newGoal.targetValue || ''}
                      onChange={(e) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGoal}
                  className="btn btn-primary"
                  disabled={!newGoal.title || !newGoal.targetValue}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Biomarker Modal */}
        {showAddBiomarker && (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-lg mx-4">
              <h3 className="font-bold text-lg mb-4">Add Measurement</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Measurement Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={newBiomarker.type}
                    onChange={(e) => {
                      const type = e.target.value as BiomarkerType;
                      const config = BIOMARKER_CONFIGS[type];
                      setNewBiomarker({
                        ...newBiomarker,
                        type,
                        unit: config.unit
                      });
                    }}
                  >
                    {Object.entries(BIOMARKER_CONFIGS).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Value ({BIOMARKER_CONFIGS[newBiomarker.type].unit})</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={newBiomarker.value || ''}
                    onChange={(e) => setNewBiomarker({...newBiomarker, value: parseFloat(e.target.value) || 0})}
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Notes (Optional)</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    value={newBiomarker.notes}
                    onChange={(e) => setNewBiomarker({...newBiomarker, notes: e.target.value})}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowAddBiomarker(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBiomarker}
                  className="btn btn-primary"
                  disabled={!newBiomarker.value}
                >
                  Add Measurement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ToastContainer />
    </AppLayout>
  );
} 