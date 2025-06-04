'use client';

import { useState } from 'react';
import { Plus, Camera, Search, BarChart3, ChefHat, Clock, Trash2, Edit, Zap } from 'lucide-react';
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

  if (state.isLoading) {
    return <LoadingScreen message="Loading your nutrition data..." />;
  }

  return (
    <AppLayout title="🍎 Food Tracking">
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Food Tracking
            </h1>
            <p className="text-base-content/60">Monitor your daily nutrition and calorie intake</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Food
            </button>
            <button 
              onClick={() => setShowAIScanner(true)}
              className="btn btn-secondary btn-sm gap-2"
            >
              <Zap className="w-4 h-4" />
              AI Scan
            </button>
            <button 
              onClick={() => setShowBarcodeScanner(true)}
              className="btn btn-outline btn-sm gap-2"
            >
              <Camera className="w-4 h-4" />
              Barcode
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="health-card p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Search for food by name or barcode..."
              className="input input-bordered w-full pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
                  className="w-full text-left p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{result.name}</h4>
                      <p className="text-sm text-base-content/60">{result.calories} cal per {result.servingSize}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{result.protein}g protein</div>
                      {result.grade && (
                        <div className="text-xs text-base-content/60">Grade: {result.grade}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Daily Summary with Real-time Data */}
        <div className="health-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Today's Nutrition Summary
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calorie Ring */}
            <div className="flex justify-center">
              <CalorieRing 
                consumed={state.dailyProgress.calories.consumed}
                burned={state.dailyProgress.calories.burned}
                target={state.nutritionGoals.calories}
                size="lg"
                showDetails={true}
                animate={true}
              />
            </div>

            {/* Macro Breakdown */}
            <div>
              <MacroBreakdown 
                macros={state.dailyProgress.macros}
                goals={state.nutritionGoals}
                layout="vertical"
                showCalories={true}
                animate={true}
              />
            </div>
          </div>
        </div>

        {/* Meal Type Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedMealType('all')}
            className={`btn btn-sm ${selectedMealType === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            All Meals ({state.foodEntries.length})
          </button>
          {MEAL_TYPES.map((meal) => {
            const count = getEntriesByMealType(meal.value).length;
            return (
              <button
                key={meal.value}
                onClick={() => setSelectedMealType(meal.value)}
                className={`btn btn-sm ${selectedMealType === meal.value ? 'btn-primary' : 'btn-outline'}`}
              >
                {meal.icon} {meal.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Food Entries by Meal Type */}
        <div className="space-y-6">
          {MEAL_TYPES.map((meal) => {
            const entries = getEntriesByMealType(meal.value);
            if (selectedMealType !== 'all' && selectedMealType !== meal.value) return null;
            
            return (
              <div key={meal.value} className="health-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${meal.color} flex items-center justify-center text-white text-sm`}>
                      {meal.icon}
                    </div>
                    {meal.label}
                  </h3>
                  <div className="text-sm text-base-content/60">
                    {entries.reduce((sum, entry) => sum + entry.calories, 0)} calories
                  </div>
                </div>

                {entries.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No {meal.label.toLowerCase()} logged yet</p>
                    <button
                      onClick={() => {
                        setNewEntry({ ...newEntry, mealType: meal.value });
                        setShowAddModal(true);
                      }}
                      className="btn btn-primary btn-sm mt-2"
                    >
                      Add {meal.label}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium">{entry.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-base-content/60">
                            <span>{entry.calories} cal</span>
                            <span>{entry.protein}g protein</span>
                            <span>{entry.carbs}g carbs</span>
                            <span>{entry.fat}g fat</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm btn-square">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
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
      </div>
    </AppLayout>
  );
} 