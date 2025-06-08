'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Utensils, Activity, Eye, Info, AlertTriangle } from 'lucide-react';
import { FoodEntry } from '../../types';
import { geminiService } from '../../services/geminiService';

interface FoodDetailModalProps {
  food: FoodEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FoodDetailModal({ food, isOpen, onClose }: FoodDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'health'>('overview');
  const [inspectingIngredient, setInspectingIngredient] = useState<string | null>(null);
  const [ingredientDetails, setIngredientDetails] = useState<any>(null);
  const [isLoadingIngredient, setIsLoadingIngredient] = useState(false);

  if (!isOpen || !food) return null;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatTimestamp(food.timestamp);

  const getMealTypeColor = (mealType: FoodEntry['mealType']) => {
    switch (mealType) {
      case 'breakfast': return 'from-orange-400 to-orange-500';
      case 'lunch': return 'from-yellow-400 to-yellow-500';
      case 'dinner': return 'from-purple-400 to-purple-500';
      case 'snack': return 'from-green-400 to-green-500';
    }
  };

  const getMealTypeIcon = (mealType: FoodEntry['mealType']) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍿';
    }
  };

  const nutritionData = [
    { label: 'Protein', value: food.protein, unit: 'g', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Carbs', value: food.carbs, unit: 'g', color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Fat', value: food.fat, unit: 'g', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { label: 'Fiber', value: food.fiber, unit: 'g', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Sugar', value: food.sugar, unit: 'g', color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { label: 'Sodium', value: food.sodium, unit: 'mg', color: 'text-red-600', bgColor: 'bg-red-50' },
  ];

  const hasAIAnalysis = food.aiAnalysis && food.aiAnalysis.trim().length > 0;
  let aiData = null;
  
  if (hasAIAnalysis) {
    try {
      aiData = JSON.parse(food.aiAnalysis!);
    } catch (e) {
      // If it's not JSON, treat as plain text
      aiData = { analysis: food.aiAnalysis };
    }
  }

  const handleInspectIngredient = async (ingredientName: string) => {
    setInspectingIngredient(ingredientName);
    setIsLoadingIngredient(true);
    
    try {
      const details = await geminiService.getIngredientDetails(ingredientName);
      setIngredientDetails(details);
    } catch (error) {
      console.error('Failed to get ingredient details:', error);
    } finally {
      setIsLoadingIngredient(false);
    }
  };

  // Get detected ingredients from AI analysis
  const detectedIngredients = aiData?.detectedIngredients || [];
  const hasIngredients = detectedIngredients.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getMealTypeColor(food.mealType)} flex items-center justify-center text-white text-xl`}>
              {getMealTypeIcon(food.mealType)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{food.name}</h2>
              <p className="text-sm text-base-content/60 mt-1">
                {date} at {time} • {food.mealType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-base-content/60'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'ingredients' ? 'border-b-2 border-primary text-primary' : 'text-base-content/60'
            }`}
          >
            Ingredients ({detectedIngredients.length})
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'health' ? 'border-b-2 border-primary text-primary' : 'text-base-content/60'
            }`}
          >
            Health Info
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {(!hasIngredients || activeTab === 'overview') && (
            <div className="space-y-6">
              {/* Calories Section */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-3">
                  <span className="text-2xl font-bold text-primary">{food.calories}</span>
                </div>
                <p className="text-lg font-semibold">Calories</p>
                <p className="text-sm text-base-content/60">Total Energy</p>
              </div>

              {/* Nutrition Breakdown */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-2">Nutrition Breakdown</h3>
                {nutritionData.map((item) => (
                  <div key={item.label} className="health-card p-3 flex justify-between">
                    <span className="text-sm">{item.label}</span>
                    <span className="font-medium">{item.value}{item.unit}</span>
                  </div>
                ))}
              </div>

              {/* AI Analysis Section */}
              {hasAIAnalysis && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    AI Analysis
                  </h3>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    {aiData?.healthScore && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Health Score</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(aiData.healthScore / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-primary">{aiData.healthScore}/10</span>
                        </div>
                      </div>
                    )}
                    
                    {aiData?.analysis && (
                      <div className="text-sm text-base-content/80">
                        <p>{aiData.analysis}</p>
                      </div>
                    )}
                    
                    {!aiData?.analysis && !aiData?.healthScore && (
                      <p className="text-sm text-base-content/70">{food.aiAnalysis}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence Indicator */}
              {food.confidence && food.confidence < 1.0 && (
                <div className="bg-warning/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-warning" />
                    AI Confidence
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-warning h-2 rounded-full" 
                        style={{ width: `${food.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-warning">
                      {Math.round(food.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60 mt-2">
                    This entry was analyzed by AI. Lower confidence may indicate the analysis should be verified.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ingredients Tab */}
          {hasIngredients && activeTab === 'ingredients' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Detected Ingredients
              </h3>
              
              {detectedIngredients.map((ingredient: any, index: number) => (
                <div key={index} className="health-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{ingredient.name}</div>
                      {ingredient.quantity && (
                        <div className="text-sm text-base-content/60">{ingredient.quantity}</div>
                      )}
                      {ingredient.calories && (
                        <div className="text-xs text-base-content/50">
                          ~{ingredient.calories} cal
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleInspectIngredient(ingredient.name)}
                      className="btn btn-ghost btn-circle"
                      title="Inspect ingredient"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              {aiData?.healthNotes?.length > 0 && (
                <div className="health-card p-4">
                  <h3 className="font-medium mb-2">Health Notes</h3>
                  <ul className="space-y-1">
                    {aiData.healthNotes.map((note: string, idx: number) => (
                      <li key={idx} className="text-sm text-base-content/70 flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiData?.allergens?.length > 0 && (
                <div className="alert alert-warning">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium">Potential Allergens</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {aiData.allergens.map((allergen: string, idx: number) => (
                        <span key={idx} className="badge badge-warning badge-sm">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ingredient Details Modal */}
      {inspectingIngredient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-base-200 flex-shrink-0">
              <h3 className="font-semibold">{inspectingIngredient}</h3>
              <button
                onClick={() => {
                  setInspectingIngredient(null);
                  setIngredientDetails(null);
                }}
                className="btn btn-ghost btn-circle"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {isLoadingIngredient ? (
                <div className="text-center py-8">
                  <div className="loading loading-spinner loading-md"></div>
                  <p className="mt-2 text-sm">Analyzing ingredient...</p>
                </div>
              ) : ingredientDetails ? (
                <div className="space-y-4">
                  {ingredientDetails.nutritionPer100g && (
                    <div>
                      <h4 className="font-medium mb-2">Nutrition (per 100g)</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Calories: {ingredientDetails.nutritionPer100g.calories}</div>
                        <div>Protein: {ingredientDetails.nutritionPer100g.protein}g</div>
                        <div>Carbs: {ingredientDetails.nutritionPer100g.carbs}g</div>
                        <div>Fat: {ingredientDetails.nutritionPer100g.fat}g</div>
                      </div>
                    </div>
                  )}
                  
                  {ingredientDetails.healthBenefits && ingredientDetails.healthBenefits.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-success">Health Benefits</h4>
                      <ul className="space-y-1">
                        {ingredientDetails.healthBenefits.map((benefit: string, index: number) => (
                          <li key={index} className="text-sm text-base-content/70">• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/50">
                  <p>Unable to load ingredient details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 