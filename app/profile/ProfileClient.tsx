'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  Save,
  Edit,
  Target,
  Activity,
  Scale,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Camera,
  Eye,
  EyeOff,
  Palette,
  Globe,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react';
import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { UserProfile, UserPreferences, Goal } from '../types';
import AppLayout from '../../src/components/layout/AppLayout';

export default function ProfileClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy' | 'data'>('profile');
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form states for editing
  const [editForm, setEditForm] = useState({
    name: '',
    age: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    height: 0,
    activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active',
  });

  // Statistics
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    totalWorkouts: 0,
    totalFoodEntries: 0,
    daysTracking: 0,
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (profile && originalProfile) {
      const changes = 
        editForm.name !== originalProfile.name ||
        editForm.age !== originalProfile.age ||
        editForm.gender !== originalProfile.gender ||
        editForm.height !== originalProfile.height ||
        editForm.activityLevel !== originalProfile.activityLevel ||
        JSON.stringify(profile.preferences) !== JSON.stringify(originalProfile.preferences);
      setHasChanges(changes);
    }
  }, [editForm, profile, originalProfile]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const [userProfile, goals, workouts, foodEntries] = await Promise.all([
        databaseService.getUserProfile(),
        databaseService.getGoals(),
        databaseService.getWorkoutEntries(),
        databaseService.getFoodEntries(),
      ]);

      if (userProfile) {
        setProfile(userProfile);
        setOriginalProfile({ ...userProfile });
        setEditForm({
          name: userProfile.name,
          age: userProfile.age,
          gender: userProfile.gender,
          height: userProfile.height,
          activityLevel: userProfile.activityLevel,
        });
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
          },
          createdAt: Date.now(),
        };
        setProfile(defaultProfile);
        setOriginalProfile(JSON.parse(JSON.stringify(defaultProfile))); // Deep copy
        setEditForm({
          name: defaultProfile.name,
          age: defaultProfile.age,
          gender: defaultProfile.gender,
          height: defaultProfile.height,
          activityLevel: defaultProfile.activityLevel,
        });
      }

      // Calculate statistics
      const completedGoals = goals.filter(g => g.isCompleted).length;
      const oldestEntry = Math.min(
        workouts.length > 0 ? Math.min(...workouts.map(w => w.timestamp)) : Date.now(),
        foodEntries.length > 0 ? Math.min(...foodEntries.map(f => f.timestamp)) : Date.now()
      );
      const daysTracking = Math.ceil((Date.now() - oldestEntry) / (24 * 60 * 60 * 1000));

      setStats({
        totalGoals: goals.length,
        completedGoals,
        totalWorkouts: workouts.length,
        totalFoodEntries: foodEntries.length,
        daysTracking: Math.max(1, daysTracking),
      });
    } catch (error) {
      console.error('Failed to load profile data:', error);
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
        name: editForm.name,
        age: editForm.age,
        gender: editForm.gender,
        height: editForm.height,
        activityLevel: editForm.activityLevel,
      };

      await databaseService.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setOriginalProfile({ ...updatedProfile });
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalProfile) {
      setEditForm({
        name: originalProfile.name,
        age: originalProfile.age,
        gender: originalProfile.gender,
        height: originalProfile.height,
        activityLevel: originalProfile.activityLevel,
      });
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    category: K,
    key: keyof UserPreferences[K],
    value: any
  ) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        [category]: {
          ...profile.preferences[category],
          [key]: value,
        },
      },
    };

    try {
      await databaseService.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await databaseService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        await databaseService.importData(jsonData);
        await loadProfileData(); // Reload data after import
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const calculateBMI = (): number => {
    if (!profile) return 0;
    // Assuming 70kg weight for demo - in real app this would come from latest biomarker
    return HealthCalculations.calculateBMI(70, profile.height);
  };

  const calculateTDEE = (): number => {
    if (!profile) return 0;
    // Calculate BMR first, then TDEE
    const bmr = HealthCalculations.calculateBMR(70, profile.height, profile.age, profile.gender);
    return HealthCalculations.calculateTDEE(bmr, profile.activityLevel);
  };

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-500' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-500' };
    return { category: 'Obese', color: 'text-red-500' };
  };

  if (isLoading) {
    return (
      <AppLayout title="👤 Profile">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="👤 Profile">
        <div className="text-center py-12">
          <p>Failed to load profile data.</p>
        </div>
      </AppLayout>
    );
  }

  const bmi = calculateBMI();
  const tdee = calculateTDEE();
  const bmiData = getBMICategory(bmi);

  return (
    <AppLayout title="👤 Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Profile & Settings</h1>
            <p className="text-base-content/60">Manage your personal information and app preferences</p>
          </div>
          
          {hasChanges && (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="btn btn-sm btn-primary"
                disabled={isSaving}
              >
                {isSaving ? <div className="loading loading-spinner loading-xs" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </button>
          <button
            className={`tab ${activeTab === 'preferences' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </button>
          <button
            className={`tab ${activeTab === 'privacy' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Privacy
          </button>
          <button
            className={`tab ${activeTab === 'data' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <Download className="w-4 h-4 mr-2" />
            Data
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="health-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn btn-sm btn-ghost"
                >
                  <Edit className="w-4 h-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg">{profile.name}</div>
                  )}
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Age</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg">{profile.age} years</div>
                  )}
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Gender</span>
                  </label>
                  {isEditing ? (
                    <select
                      className="select select-bordered w-full"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as any })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg capitalize">{profile.gender}</div>
                  )}
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Height</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg">{profile.height} cm</div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    <span className="label-text">Activity Level</span>
                  </label>
                  {isEditing ? (
                    <select
                      className="select select-bordered w-full"
                      value={editForm.activityLevel}
                      onChange={(e) => setEditForm({ ...editForm, activityLevel: e.target.value as any })}
                    >
                      <option value="sedentary">Sedentary (Little/no exercise)</option>
                      <option value="lightly_active">Lightly Active (Light exercise 1-3 days/week)</option>
                      <option value="moderately_active">Moderately Active (Moderate exercise 3-5 days/week)</option>
                      <option value="very_active">Very Active (Hard exercise 6-7 days/week)</option>
                      <option value="extra_active">Extra Active (Very hard exercise, physical job)</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg capitalize">
                      {profile.activityLevel.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Health Metrics */}
            <div className="health-card p-6">
              <h3 className="text-lg font-semibold mb-4">Health Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold">{bmi.toFixed(1)}</div>
                  <div className="text-sm text-base-content/60">BMI</div>
                  <div className={`text-sm ${bmiData.color}`}>{bmiData.category}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(tdee)}</div>
                  <div className="text-sm text-base-content/60">TDEE (calories/day)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{((profile.height / 100) ** 2).toFixed(2)}</div>
                  <div className="text-sm text-base-content/60">Height² (m²)</div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="health-card p-6">
              <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.daysTracking}</div>
                  <div className="text-sm text-base-content/60">Days Tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{stats.completedGoals}</div>
                  <div className="text-sm text-base-content/60">Goals Achieved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{stats.totalWorkouts}</div>
                  <div className="text-sm text-base-content/60">Workouts Logged</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">{stats.totalFoodEntries}</div>
                  <div className="text-sm text-base-content/60">Meals Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{stats.totalGoals}</div>
                  <div className="text-sm text-base-content/60">Total Goals</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* General Preferences */}
            <div className="health-card p-6">
              <h3 className="text-lg font-semibold mb-4">General Preferences</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Units</div>
                    <div className="text-sm text-base-content/60">Choose your preferred measurement system</div>
                  </div>
                  <select
                    className="select select-bordered select-sm"
                    value={profile.preferences.units}
                    onChange={(e) => updatePreference('units', 'units' as any, e.target.value)}
                  >
                    <option value="metric">Metric (kg, cm)</option>
                    <option value="imperial">Imperial (lbs, ft)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Theme</div>
                    <div className="text-sm text-base-content/60">Choose your preferred theme</div>
                  </div>
                  <select
                    className="select select-bordered select-sm"
                    value={profile.preferences.theme}
                    onChange={(e) => updatePreference('theme', 'theme' as any, e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="health-card p-6">
              <h3 className="text-lg font-semibold mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Meal Reminders</div>
                    <div className="text-sm text-base-content/60">Get reminded to log your meals</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={profile.preferences.notifications.mealReminders}
                    onChange={(e) => updatePreference('notifications', 'mealReminders', e.target.checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Workout Reminders</div>
                    <div className="text-sm text-base-content/60">Get reminded to exercise</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={profile.preferences.notifications.workoutReminders}
                    onChange={(e) => updatePreference('notifications', 'workoutReminders', e.target.checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Goal Reminders</div>
                    <div className="text-sm text-base-content/60">Get reminded about your goals</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={profile.preferences.notifications.goalReminders}
                    onChange={(e) => updatePreference('notifications', 'goalReminders', e.target.checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Weekly Reports</div>
                    <div className="text-sm text-base-content/60">Receive weekly progress reports</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={profile.preferences.notifications.weeklyReports}
                    onChange={(e) => updatePreference('notifications', 'weeklyReports', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="health-card p-6">
              <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Data Sharing</div>
                    <div className="text-sm text-base-content/60">Allow sharing of anonymized data for research</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={profile.preferences.privacy.dataSharing}
                    onChange={(e) => updatePreference('privacy', 'dataSharing', e.target.checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Analytics</div>
                    <div className="text-sm text-base-content/60">Help improve the app with usage analytics</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={profile.preferences.privacy.analytics}
                    onChange={(e) => updatePreference('privacy', 'analytics', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="health-card p-6">
              <h3 className="text-lg font-semibold mb-4">Data Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Export Data</div>
                    <div className="text-sm text-base-content/60">Download all your health data as JSON</div>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="btn btn-sm btn-primary"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Import Data</div>
                    <div className="text-sm text-base-content/60">Import health data from backup file</div>
                  </div>
                  <label className="btn btn-sm btn-secondary">
                    <Upload className="w-4 h-4" />
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="health-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-error">Danger Zone</h3>
              <div className="space-y-4">
                <div className="p-4 border border-error rounded-lg">
                  <div className="font-medium text-error mb-2">Delete All Data</div>
                  <div className="text-sm text-base-content/60 mb-4">
                    This will permanently delete all your health data. This action cannot be undone.
                  </div>
                  <button className="btn btn-sm btn-error">
                    <Trash2 className="w-4 h-4" />
                    Delete All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 