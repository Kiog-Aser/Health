'use client';

import { useState, useEffect } from 'react';
import { Plus, Camera, Search, Calendar, TrendingUp, Edit, Trash2, BarChart3 } from 'lucide-react';
import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { FoodEntry } from '../types';
import AppLayout from '../components/layout/AppLayout';
import FoodCameraModal from './FoodCameraModal';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍿' },
] as const;

export default function FoodClient() {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMealType, setSelectedMealType] = useState<'all' | FoodEntry['mealType']>('all');

  const [newEntry, setNewEntry] = useState({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    mealType: 'breakfast' as FoodEntry['mealType'],
  });

  const [nutritionGoals] = useState({
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73,
    fiber: 25,
  });

  useEffect(() => {
    loadFoodEntries();
  }, [selectedDate]);

  const loadFoodEntries = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      
      const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);
      
      const entries = await databaseService.getFoodEntries(startOfDay, endOfDay);
      setFoodEntries(entries);
    } catch (error) {
      console.error('Failed to load food entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.name || !newEntry.calories) return;

    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: newEntry.name,
      calories: newEntry.calories,
      protein: newEntry.protein,
      carbs: newEntry.carbs,
      fat: newEntry.fat,
      fiber: newEntry.fiber,
      sugar: newEntry.sugar,
      sodium: newEntry.sodium,
      timestamp: new Date(selectedDate).setHours(12, 0, 0, 0), // Set to noon of selected day
      mealType: newEntry.mealType,
    };

    try {
      await databaseService.addFoodEntry(entry);
      setFoodEntries([entry, ...foodEntries]);
      setShowAddModal(false);
      resetNewEntry();
    } catch (error) {
      console.error('Failed to add food entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await databaseService.deleteFoodEntry(entryId);
      setFoodEntries(foodEntries.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Failed to delete food entry:', error);
    }
  };

  const handleFoodAddedFromCamera = (entry: FoodEntry) => {
    setFoodEntries([entry, ...foodEntries]);
  };

  const resetNewEntry = () => {
    setNewEntry({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      mealType: 'breakfast',
    });
  };

  const getFilteredEntries = (): FoodEntry[] => {
    return selectedMealType === 'all'
      ? foodEntries
      : foodEntries.filter(entry => entry.mealType === selectedMealType);
  };

  const getDailyTotals = () => {
    return HealthCalculations.calculateDailyTotals(foodEntries);
  };

  const getEntriesByMealType = (mealType: FoodEntry['mealType']) => {
    return foodEntries.filter(entry => entry.mealType === mealType);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90 && percentage <= 110) return 'bg-success';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-error';
  };

  if (isLoading) {
    return (
      <AppLayout title="🍎 Food Tracking">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const dailyTotals = getDailyTotals();

  return (
    <AppLayout title="🍎 Food Tracking">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Food Tracking</h1>
            <p className="text-base-content/60">Monitor your daily nutrition and calorie intake</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" />
              Add Food
            </button>
            <button 
              onClick={() => setShowCameraModal(true)}
              className="btn btn-outline btn-sm"
            >
              <Camera className="w-4 h-4" />
              Scan Food
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-4">
          <label className="label">
            <span className="label-text">Date:</span>
          </label>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Daily Summary */}
        <div className="health-card p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dailyTotals.calories}</div>
              <div className="text-sm text-base-content/60">Calories</div>
              <div className="text-xs text-base-content/40">of {nutritionGoals.calories}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{Math.round(dailyTotals.protein)}g</div>
              <div className="text-sm text-base-content/60">Protein</div>
              <div className="text-xs text-base-content/40">of {nutritionGoals.protein}g</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{Math.round(dailyTotals.carbs)}g</div>
              <div className="text-sm text-base-content/60">Carbs</div>
              <div className="text-xs text-base-content/40">of {nutritionGoals.carbs}g</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{Math.round(dailyTotals.fat)}g</div>
              <div className="text-sm text-base-content/60">Fat</div>
              <div className="text-xs text-base-content/40">of {nutritionGoals.fat}g</div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Calories</span>
                <span>{dailyTotals.calories} / {nutritionGoals.calories}</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(dailyTotals.calories, nutritionGoals.calories)}`}
                  style={{ width: `${getProgressPercentage(dailyTotals.calories, nutritionGoals.calories)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Protein</span>
                <span>{Math.round(dailyTotals.protein)}g / {nutritionGoals.protein}g</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(dailyTotals.protein, nutritionGoals.protein)}`}
                  style={{ width: `${getProgressPercentage(dailyTotals.protein, nutritionGoals.protein)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Carbs</span>
                <span>{Math.round(dailyTotals.carbs)}g / {nutritionGoals.carbs}g</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(dailyTotals.carbs, nutritionGoals.carbs)}`}
                  style={{ width: `${getProgressPercentage(dailyTotals.carbs, nutritionGoals.carbs)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Fat</span>
                <span>{Math.round(dailyTotals.fat)}g / {nutritionGoals.fat}g</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(dailyTotals.fat, nutritionGoals.fat)}`}
                  style={{ width: `${getProgressPercentage(dailyTotals.fat, nutritionGoals.fat)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Meal Type Filter */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${selectedMealType === 'all' ? 'tab-active' : ''}`}
            onClick={() => setSelectedMealType('all')}
          >
            All Meals
          </button>
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal.value}
              className={`tab ${selectedMealType === meal.value ? 'tab-active' : ''}`}
              onClick={() => setSelectedMealType(meal.value)}
            >
              {meal.icon} {meal.label}
            </button>
          ))}
        </div>

        {/* Meals by Type */}
        {selectedMealType === 'all' ? (
          <div className="space-y-6">
            {MEAL_TYPES.map((meal) => {
              const mealEntries = getEntriesByMealType(meal.value);
              const mealTotals = HealthCalculations.calculateDailyTotals(mealEntries);

              return (
                <div key={meal.value} className="health-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span className="text-xl">{meal.icon}</span>
                      {meal.label}
                    </h3>
                    <div className="text-sm text-base-content/60">
                      {mealTotals.calories} calories
                    </div>
                  </div>

                  {mealEntries.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50">
                      <p>No {meal.label.toLowerCase()} entries yet</p>
                      <button
                        onClick={() => {
                          setNewEntry({ ...newEntry, mealType: meal.value });
                          setShowAddModal(true);
                        }}
                        className="btn btn-ghost btn-sm mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add {meal.label}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mealEntries.map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                          <div>
                            <h4 className="font-medium">{entry.name}</h4>
                            <div className="text-sm text-base-content/60">
                              {entry.calories} cal • {Math.round(entry.protein)}g protein • {Math.round(entry.carbs)}g carbs • {Math.round(entry.fat)}g fat
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="btn btn-ghost btn-sm"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="health-card p-6">
            <h3 className="text-lg font-semibold mb-4">
              {MEAL_TYPES.find(m => m.value === selectedMealType)?.icon} {MEAL_TYPES.find(m => m.value === selectedMealType)?.label} Entries
            </h3>
            {getFilteredEntries().length === 0 ? (
              <div className="text-center py-8">
                <p className="text-base-content/60 mb-4">No entries found for this meal type.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredEntries().map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center p-4 bg-base-100 rounded-lg">
                    <div>
                      <h4 className="font-medium">{entry.name}</h4>
                      <div className="text-sm text-base-content/60">
                        {entry.calories} cal • {Math.round(entry.protein)}g protein • {Math.round(entry.carbs)}g carbs • {Math.round(entry.fat)}g fat
                      </div>
                      {entry.fiber > 0 && (
                        <div className="text-xs text-base-content/50 mt-1">
                          {Math.round(entry.fiber)}g fiber • {Math.round(entry.sugar)}g sugar • {Math.round(entry.sodium)}mg sodium
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn btn-ghost btn-sm"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Food Modal */}
        {showAddModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">Add Food Entry</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Food Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Grilled Chicken Breast"
                      className="input input-bordered w-full"
                      value={newEntry.name}
                      onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Meal Type</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={newEntry.mealType}
                      onChange={(e) => setNewEntry({ ...newEntry, mealType: e.target.value as FoodEntry['mealType'] })}
                    >
                      {MEAL_TYPES.map((meal) => (
                        <option key={meal.value} value={meal.value}>
                          {meal.icon} {meal.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Calories</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={newEntry.calories}
                      onChange={(e) => setNewEntry({ ...newEntry, calories: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Protein (g)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newEntry.protein}
                      onChange={(e) => setNewEntry({ ...newEntry, protein: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Carbs (g)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newEntry.carbs}
                      onChange={(e) => setNewEntry({ ...newEntry, carbs: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Fat (g)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newEntry.fat}
                      onChange={(e) => setNewEntry({ ...newEntry, fat: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Fiber (g)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newEntry.fiber}
                      onChange={(e) => setNewEntry({ ...newEntry, fiber: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Sugar (g)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newEntry.sugar}
                      onChange={(e) => setNewEntry({ ...newEntry, sugar: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Sodium (mg)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={newEntry.sodium}
                      onChange={(e) => setNewEntry({ ...newEntry, sodium: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  className="btn btn-primary"
                  disabled={!newEntry.name || !newEntry.calories}
                >
                  Add Food
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Food Camera Modal */}
      <FoodCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onFoodAdded={handleFoodAddedFromCamera}
      />
    </AppLayout>
  );
} 