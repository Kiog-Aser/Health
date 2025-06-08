'use client';

import { useState } from 'react';
import { Plus, Camera, Search, BarChart3, ChefHat, Clock, Trash2, Edit, Zap, Eye, Bookmark, BookmarkPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHealth } from '../context/HealthContext';
import { nutritionDatabase } from '../services/nutritionDatabase';
import AppLayout from '../components/layout/AppLayout';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import FoodCameraModal from './FoodCameraModal';
import CalorieRing from '../components/ui/CalorieRing';
import MacroBreakdown from '../components/ui/MacroBreakdown';
import LoadingScreen from '../components/ui/LoadingScreen';
import { useToast } from '../components/ui/ToastNotification';
import FoodDetailModal from '../components/ui/FoodDetailModal';
import PWADebugInfo from '../components/PWADebugInfo';
import { FoodEntry } from '../types';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅', color: 'from-orange-400 to-orange-500' },
  { value: 'lunch', label: 'Lunch', icon: '☀️', color: 'from-yellow-400 to-yellow-500' },
  { value: 'dinner', label: 'Dinner', icon: '🌙', color: 'from-purple-400 to-purple-500' },
  { value: 'snack', label: 'Snack', icon: '🍿', color: 'from-green-400 to-green-500' },
] as const;

export default function FoodClient() {
  const router = useRouter();
  const { state, actions } = useHealth();
  const { showSuccess, showError, showWarning, ToastContainer } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'all' | FoodEntry['mealType']>('all');
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [showSavedMeals, setShowSavedMeals] = useState(false);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [mealToSave, setMealToSave] = useState<string>('');

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
    portionMultiplier: 1,
    portionUnit: 'serving' as FoodEntry['portionUnit'],
    baseCalories: 0,
    baseProtein: 0,
    baseCarbs: 0,
    baseFat: 0,
    baseFiber: 0,
    baseSugar: 0,
    baseSodium: 0,
    showManualNutrition: false,
  });

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
      portionMultiplier: 1,
      portionUnit: 'serving',
      baseCalories: 0,
      baseProtein: 0,
      baseCarbs: 0,
      baseFat: 0,
      baseFiber: 0,
      baseSugar: 0,
      baseSodium: 0,
      showManualNutrition: false,
    });
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
      timestamp: Date.now(),
      mealType: newEntry.mealType,
      portionMultiplier: newEntry.portionMultiplier,
      portionUnit: newEntry.portionUnit,
      baseCalories: newEntry.baseCalories,
      baseProtein: newEntry.baseProtein,
      baseCarbs: newEntry.baseCarbs,
      baseFat: newEntry.baseFat,
      baseFiber: newEntry.baseFiber,
      baseSugar: newEntry.baseSugar,
      baseSodium: newEntry.baseSodium,
      showManualNutrition: newEntry.showManualNutrition,
    };

    try {
      await actions.addFoodEntry(entry);
      setShowAddModal(false);
      resetNewEntry();
      showSuccess('Food Added', `${entry.name} has been added to your ${entry.mealType}.`);
    } catch (error) {
      console.error('Failed to add food entry:', error);
      showError('Failed to Add Food', 'Please try again.');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const entry = state.foodEntries.find(e => e.id === entryId);
    try {
      await actions.removeFoodEntry(entryId);
      showSuccess('Food Removed', entry ? `${entry.name} has been removed.` : 'Food entry removed.');
    } catch (error) {
      console.error('Failed to delete food entry:', error);
      showError('Failed to Remove Food', 'Please try again.');
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await nutritionDatabase.getFoodSuggestions(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setIsSearching(true);
    
    try {
      const result = await nutritionDatabase.searchByBarcode(barcode);
      if (result) {
        // Auto-fill the form with barcode result
        setNewEntry({
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber,
          sugar: result.sugar,
          sodium: result.sodium,
          mealType: 'snack',
          portionMultiplier: 1,
          portionUnit: 'serving',
          baseCalories: result.calories,
          baseProtein: result.protein,
          baseCarbs: result.carbs,
          baseFat: result.fat,
          baseFiber: result.fiber,
          baseSugar: result.sugar,
          baseSodium: result.sodium,
          showManualNutrition: false,
        });
        setShowAddModal(true);
        showSuccess('Product Found', `${result.name} has been loaded from barcode.`);
      } else {
        showWarning('Product Not Found', 'Please add the nutrition information manually.');
      }
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      showError('Barcode Scan Failed', 'Please try scanning again or add manually.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = (result: any) => {
    setNewEntry({
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      sugar: result.sugar,
      sodium: result.sodium,
      mealType: 'snack',
      portionMultiplier: 1,
      portionUnit: 'serving',
      baseCalories: result.calories,
      baseProtein: result.protein,
      baseCarbs: result.carbs,
      baseFat: result.fat,
      baseFiber: result.fiber,
      baseSugar: result.sugar,
      baseSodium: result.sodium,
      showManualNutrition: false,
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowAddModal(true);
  };

  const getFilteredEntries = (): FoodEntry[] => {
    return selectedMealType === 'all'
      ? state.foodEntries
      : state.foodEntries.filter(entry => entry.mealType === selectedMealType);
  };

  const getEntriesByMealType = (mealType: FoodEntry['mealType']) => {
    return state.foodEntries.filter(entry => entry.mealType === mealType);
  };

  const handleAIFoodAdded = async (entry: FoodEntry) => {
    try {
      await actions.addFoodEntry(entry);
      setShowAIScanner(false);
      showSuccess('AI Scan Complete', `${entry.name} has been added from AI analysis.`);
    } catch (error) {
      console.error('Failed to add AI scanned food:', error);
      showError('Failed to Add Food', 'Please try again.');
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

  const handleSaveMeal = (mealType: FoodEntry['mealType']) => {
    const mealEntries = getEntriesByMealType(mealType);
    if (mealEntries.length === 0) {
      showWarning('No Items', `No ${mealType} items to save.`);
      return;
    }

    const savedMeal = {
      id: Date.now().toString(),
      name: mealToSave || `My ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
      mealType,
      items: mealEntries,
      totalCalories: mealEntries.reduce((sum, item) => sum + item.calories, 0),
      totalProtein: mealEntries.reduce((sum, item) => sum + item.protein, 0),
      totalCarbs: mealEntries.reduce((sum, item) => sum + item.carbs, 0),
      totalFat: mealEntries.reduce((sum, item) => sum + item.fat, 0),
      createdAt: Date.now(),
    };

    setSavedMeals([...savedMeals, savedMeal]);
    setMealToSave('');
    showSuccess('Meal Saved', `${savedMeal.name} has been saved for quick access.`);
  };

  const handleAddSavedMeal = async (savedMeal: any) => {
    try {
      for (const item of savedMeal.items) {
        const newEntry: FoodEntry = {
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        };
        await actions.addFoodEntry(newEntry);
      }
      showSuccess('Meal Added', `${savedMeal.name} has been added to today's meals.`);
      setShowSavedMeals(false);
    } catch (error) {
      console.error('Failed to add saved meal:', error);
      showError('Failed to Add Meal', 'Please try again.');
    }
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading your nutrition data..." />;
  }

  const totalCalories = getFilteredEntries().reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = getFilteredEntries().reduce((sum, entry) => sum + entry.protein, 0);
  const totalCarbs = getFilteredEntries().reduce((sum, entry) => sum + entry.carbs, 0);
  const totalFat = getFilteredEntries().reduce((sum, entry) => sum + entry.fat, 0);

  return (
    <AppLayout title="🍎 Food Tracking">
      <ToastContainer />
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Food Tracking
            </h1>
            <p className="text-base-content/60 text-sm lg:text-base">Monitor your daily nutrition and calorie intake</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm flex-1 sm:flex-none gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Food</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button 
              onClick={() => setShowAIScanner(true)}
              className="btn btn-secondary btn-sm flex-1 sm:flex-none gap-2"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">AI Scan</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button 
              onClick={() => setShowBarcodeScanner(true)}
              className="btn btn-outline btn-sm flex-1 sm:flex-none gap-2"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Barcode</span>
              <span className="sm:hidden">Scan</span>
            </button>
            <button 
              onClick={() => setShowSavedMeals(true)}
              className="btn btn-ghost btn-sm flex-1 sm:flex-none gap-2"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
              <span className="sm:hidden">Saved</span>
            </button>
            <PWADebugInfo className="hidden sm:flex" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="health-card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search foods (try typing or use barcode scanner)"
                className="input input-bordered w-full pl-10 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>
            {isSearching && (
              <div className="flex items-center justify-center px-4">
                <div className="loading loading-spinner loading-sm"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultSelect(result)}
                  className="w-full text-left p-3 rounded-lg bg-base-50 hover:bg-base-200 border border-base-300/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.name}</p>
                      <p className="text-xs text-base-content/60 mt-1">
                        {result.calories} cal • {result.protein}g protein
                      </p>
                    </div>
                    <div className="text-xs text-base-content/50 ml-2 flex-shrink-0">
                      {result.confidence && (
                        <span className="badge badge-ghost badge-xs">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Daily Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CalorieRing 
              consumed={totalCalories} 
              burned={state.dailyProgress.calories.burned}
              target={state.nutritionGoals.calories}
            />
          </div>
          <div className="space-y-4">
            <MacroBreakdown
              macros={{
                protein: totalProtein,
                carbs: totalCarbs,
                fat: totalFat,
                fiber: getFilteredEntries().reduce((sum, entry) => sum + entry.fiber, 0)
              }}
              goals={state.nutritionGoals}
            />
          </div>
        </div>

        {/* Meal Type Filter */}
        <div className="health-card p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMealType('all')}
              className={`btn btn-sm ${
                selectedMealType === 'all' ? 'btn-primary' : 'btn-outline'
              }`}
            >
              All Meals
            </button>
            {MEAL_TYPES.map((meal) => (
              <button
                key={meal.value}
                onClick={() => setSelectedMealType(meal.value)}
                className={`btn btn-sm ${
                  selectedMealType === meal.value ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <span className="mr-1">{meal.icon}</span>
                <span className="hidden sm:inline">{meal.label}</span>
                <span className="sm:hidden">{meal.label.slice(0, 3)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meals by Type */}
        {selectedMealType === 'all' ? (
          <div className="space-y-6">
            {MEAL_TYPES.map((meal) => {
              const entries = getEntriesByMealType(meal.value);
              const mealCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
              
              return (
                <div key={meal.value} className="health-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${meal.color} flex items-center justify-center text-white`}>
                        <span className="text-lg">{meal.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{meal.label}</h3>
                        <p className="text-sm text-base-content/60">{mealCalories} calories</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entries.length > 0 && (
                        <button
                          onClick={() => handleSaveMeal(meal.value)}
                          className="btn btn-ghost btn-xs"
                          title="Save this meal"
                        >
                          <BookmarkPlus className="w-3 h-3" />
                        </button>
                      )}
                      <div className="text-right">
                        <div className="text-lg font-bold">{entries.length}</div>
                        <div className="text-xs text-base-content/60">items</div>
                      </div>
                    </div>
                  </div>
                  
                  {entries.length > 0 ? (
                    <div className="space-y-2">
                      {entries.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-base-50 rounded-lg">
                          <button
                            onClick={() => handleFoodClick(entry)}
                            className="flex-1 min-w-0 text-left hover:bg-base-200/50 rounded-lg p-2 -m-2 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{entry.name}</p>
                              {entry.confidence && entry.confidence < 0.8 && (
                                <span className="badge badge-warning badge-xs">AI</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-base-content/60">
                              <span>{entry.calories} cal</span>
                              <span>{entry.protein}g protein</span>
                              <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="btn btn-ghost btn-xs btn-circle text-error"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {entries.length > 3 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setSelectedMealType(meal.value)}
                            className="btn btn-ghost btn-xs"
                          >
                            View all {entries.length} items
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-base-content/50">
                      <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No {meal.label.toLowerCase()} logged yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Individual Meal Type View */
          <div className="health-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">{selectedMealType} Entries</h3>
              <div className="text-sm text-base-content/60">
                {getFilteredEntries().length} items • {getFilteredEntries().reduce((sum, entry) => sum + entry.calories, 0)} cal
              </div>
            </div>
            
            {getFilteredEntries().length > 0 ? (
              <div className="space-y-3">
                {getFilteredEntries().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-base-50 rounded-lg">
                    <button
                      onClick={() => handleFoodClick(entry)}
                      className="flex-1 min-w-0 text-left hover:bg-base-200/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-sm truncate">{entry.name}</p>
                        {entry.confidence && entry.confidence < 0.8 && (
                          <span className="badge badge-warning badge-xs">AI</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-base-content/60">
                        <div><strong>{entry.calories}</strong> cal</div>
                        <div><strong>{entry.protein}g</strong> protein</div>
                        <div><strong>{entry.carbs}g</strong> carbs</div>
                        <div><strong>{entry.fat}g</strong> fat</div>
                      </div>
                      <div className="text-xs text-base-content/50 mt-2">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/50">
                <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No {selectedMealType} entries found</p>
                <p className="text-sm mt-1">Start tracking your meals!</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="health-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{state.foodEntries.length}</div>
            <div className="text-sm text-base-content/60">Total Entries</div>
          </div>
          <div className="health-card p-4 text-center">
            <div className="text-2xl font-bold text-success">{Math.round(totalProtein)}</div>
            <div className="text-sm text-base-content/60">Protein (g)</div>
          </div>
          <div className="health-card p-4 text-center">
            <div className="text-2xl font-bold text-warning">{Math.round(totalCarbs)}</div>
            <div className="text-sm text-base-content/60">Carbs (g)</div>
          </div>
          <div className="health-card p-4 text-center">
            <div className="text-2xl font-bold text-error">{Math.round(totalFat)}</div>
            <div className="text-sm text-base-content/60">Fat (g)</div>
          </div>
        </div>
      </div>

      {/* AI Food Scanner Modal */}
      <FoodCameraModal
        isOpen={showAIScanner}
        onClose={() => setShowAIScanner(false)}
        onFoodAdded={handleAIFoodAdded}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScanSuccess={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-[90vw] max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Food Entry</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Food Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={newEntry.name}
                    onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                    placeholder="Enter food name"
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

                {/* Portion Size Control */}
                <div>
                  <label className="label">
                    <span className="label-text">Portion Size</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="input input-bordered flex-1"
                      value={newEntry.portionMultiplier || 1}
                      onChange={(e) => {
                        const multiplier = parseFloat(e.target.value) || 1;
                        const baseCalories = newEntry.baseCalories || newEntry.calories;
                        const baseProtein = newEntry.baseProtein || newEntry.protein;
                        const baseCarbs = newEntry.baseCarbs || newEntry.carbs;
                        const baseFat = newEntry.baseFat || newEntry.fat;
                        const baseFiber = newEntry.baseFiber || newEntry.fiber;
                        const baseSugar = newEntry.baseSugar || newEntry.sugar;
                        const baseSodium = newEntry.baseSodium || newEntry.sodium;
                        
                        setNewEntry({ 
                          ...newEntry, 
                          portionMultiplier: multiplier,
                          baseCalories: baseCalories,
                          baseProtein: baseProtein,
                          baseCarbs: baseCarbs,
                          baseFat: baseFat,
                          baseFiber: baseFiber,
                          baseSugar: baseSugar,
                          baseSodium: baseSodium,
                          calories: Math.round(baseCalories * multiplier),
                          protein: Math.round(baseProtein * multiplier * 10) / 10,
                          carbs: Math.round(baseCarbs * multiplier * 10) / 10,
                          fat: Math.round(baseFat * multiplier * 10) / 10,
                          fiber: Math.round(baseFiber * multiplier * 10) / 10,
                          sugar: Math.round(baseSugar * multiplier * 10) / 10,
                          sodium: Math.round(baseSodium * multiplier)
                        });
                      }}
                      placeholder="1.0"
                    />
                    <select 
                      className="select select-bordered"
                      value={newEntry.portionUnit || 'serving'}
                      onChange={(e) => setNewEntry({ ...newEntry, portionUnit: e.target.value as FoodEntry['portionUnit'] })}
                    >
                      <option value="serving">servings</option>
                      <option value="cup">cups</option>
                      <option value="piece">pieces</option>
                      <option value="slice">slices</option>
                      <option value="gram">grams</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                  <p className="text-xs text-base-content/60 mt-1">
                    Adjust portion size to match what you're eating
                  </p>
                </div>

                {/* Nutrition Preview */}
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Nutrition Facts</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Calories:</span>
                      <span className="font-semibold">{newEntry.calories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span className="font-semibold">{newEntry.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbs:</span>
                      <span className="font-semibold">{newEntry.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fat:</span>
                      <span className="font-semibold">{newEntry.fat}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fiber:</span>
                      <span className="font-semibold">{newEntry.fiber}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sugar:</span>
                      <span className="font-semibold">{newEntry.sugar}g</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span>Sodium:</span>
                      <span className="font-semibold">{newEntry.sodium}mg</span>
                    </div>
                  </div>
                </div>

                {/* Manual Entry Option (collapsible) */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, showManualNutrition: !newEntry.showManualNutrition })}
                    className="btn btn-ghost btn-sm w-full"
                  >
                    {newEntry.showManualNutrition ? 'Hide' : 'Show'} Manual Nutrition Entry
                  </button>
                  
                  {newEntry.showManualNutrition && (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm text-warning">
                        ⚠️ Manual entry: Enter nutrition values per serving
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            <span className="label-text">Calories</span>
                          </label>
                          <input
                            type="number"
                            className="input input-bordered w-full"
                            value={newEntry.calories || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, calories: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
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
                            value={newEntry.protein || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, protein: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            <span className="label-text">Carbs (g)</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="input input-bordered w-full"
                            value={newEntry.carbs || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, carbs: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
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
                            value={newEntry.fat || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, fat: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            <span className="label-text">Fiber (g)</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="input input-bordered w-full"
                            value={newEntry.fiber || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, fiber: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
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
                            value={newEntry.sugar || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, sugar: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">
                          <span className="label-text">Sodium (mg)</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered w-full"
                          value={newEntry.sodium || ''}
                          onChange={(e) => setNewEntry({ ...newEntry, sodium: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddEntry}
                  className="btn btn-primary flex-1"
                  disabled={!newEntry.name || !newEntry.calories}
                >
                  Add Food
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewEntry();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Food Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={showFoodDetail}
        onClose={handleCloseFoodDetail}
      />

      {/* Saved Meals Modal */}
      {showSavedMeals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-[90vw] max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Saved Meals</h3>
                <button
                  onClick={() => setShowSavedMeals(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {savedMeals.length === 0 ? (
                <div className="text-center py-8">
                  <BookmarkPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-base-content/60 mb-4">No saved meals yet</p>
                  <p className="text-sm text-base-content/50">
                    Save meals from the main page to quickly add them again
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedMeals.map((meal) => (
                    <div key={meal.id} className="border border-base-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{meal.name}</h4>
                        <button
                          onClick={() => handleAddSavedMeal(meal)}
                          className="btn btn-primary btn-sm"
                        >
                          Add to Today
                        </button>
                      </div>
                      <div className="text-sm text-base-content/60 mb-2">
                        {meal.items.length} items • {meal.totalCalories} cal • {meal.totalProtein}g protein
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {meal.items.map((item: any, index: number) => (
                          <span key={index} className="badge badge-ghost badge-sm">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
} 