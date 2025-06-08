'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Eye, Edit3, Clock, Apple } from 'lucide-react';
import { FoodEntry } from '../../types';
import { geminiService } from '../../services/geminiService';

interface DetailedIngredient {
  name: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  confidence: number;
  analysis: string;
  detectedIngredients: DetailedIngredient[];
  recommendedMealType: FoodEntry['mealType'];
  mealTypeConfidence: number;
  portionSize: string;
  healthScore: number;
  healthNotes: string[];
  cookingMethod?: string;
  cuisine?: string;
  allergens: string[];
}

interface FoodAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (entry: FoodEntry) => void;
  analysisResult: FoodAnalysisResult | null;
  capturedImage?: File;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅', color: 'badge-warning' },
  { value: 'lunch', label: 'Lunch', icon: '☀️', color: 'badge-info' },
  { value: 'dinner', label: 'Dinner', icon: '🌙', color: 'badge-secondary' },
  { value: 'snack', label: 'Snack', icon: '🍿', color: 'badge-success' },
] as const;

export default function FoodAnalysisModal({
  isOpen,
  onClose,
  onConfirm,
  analysisResult,
  capturedImage
}: FoodAnalysisModalProps) {
  const [selectedMealType, setSelectedMealType] = useState<FoodEntry['mealType']>('snack');
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'health'>('overview');
  const [inspectingIngredient, setInspectingIngredient] = useState<string | null>(null);
  const [ingredientDetails, setIngredientDetails] = useState<any>(null);
  const [isLoadingIngredient, setIsLoadingIngredient] = useState(false);

  // Set recommended meal type when analysis result changes
  useEffect(() => {
    if (analysisResult?.recommendedMealType) {
      setSelectedMealType(analysisResult.recommendedMealType);
    }
  }, [analysisResult]);

  if (!isOpen || !analysisResult) return null;

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

  const handleConfirm = () => {
    const foodEntry: FoodEntry = {
      id: Date.now().toString(),
      name: analysisResult.name,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fat: analysisResult.fat,
      fiber: analysisResult.fiber,
      sugar: analysisResult.sugar,
      sodium: analysisResult.sodium,
      timestamp: Date.now(),
      mealType: selectedMealType,
      confidence: analysisResult.confidence,
      aiAnalysis: JSON.stringify({
        analysis: analysisResult.analysis,
        detectedIngredients: analysisResult.detectedIngredients,
        healthScore: analysisResult.healthScore,
        healthNotes: analysisResult.healthNotes,
        portionSize: analysisResult.portionSize,
        cookingMethod: analysisResult.cookingMethod,
        cuisine: analysisResult.cuisine,
        allergens: analysisResult.allergens
      }),
    };

    onConfirm(foodEntry);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-error';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-4 h-4" />;
    if (score >= 6) return <AlertTriangle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Apple className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Food Analysis</h2>
              <p className="text-sm text-base-content/60">Review and confirm details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Food Info Header */}
          <div className="p-4 bg-base-50 border-b border-base-200 flex-shrink-0">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold">{analysisResult.name}</h3>
              
              <div className="flex justify-center gap-2 flex-wrap">
                <span className="badge badge-primary badge-lg">
                  {analysisResult.calories} cal
                </span>
                <span className={`badge badge-lg ${getHealthScoreColor(analysisResult.healthScore)}`}>
                  {getHealthScoreIcon(analysisResult.healthScore)}
                  Health Score: {analysisResult.healthScore}/10
                </span>
                <span className="badge badge-accent badge-lg">
                  {Math.round(analysisResult.confidence * 100)}% confident
                </span>
              </div>

              <div className="text-sm text-base-content/60">
                {analysisResult.portionSize || 'N/A'} • {analysisResult.cuisine ? `${analysisResult.cuisine} • ` : ''}
                {analysisResult.cookingMethod || 'N/A'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-base-200 flex-shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-base-content/60'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'ingredients' ? 'border-b-2 border-primary text-primary' : 'text-base-content/60'
              }`}
            >
              Ingredients ({analysisResult.detectedIngredients.length})
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

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Nutrition Facts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="health-card p-3">
                    <div className="text-sm text-base-content/60">Protein</div>
                    <div className="text-lg font-semibold">{analysisResult.protein}g</div>
                  </div>
                  <div className="health-card p-3">
                    <div className="text-sm text-base-content/60">Carbs</div>
                    <div className="text-lg font-semibold">{analysisResult.carbs}g</div>
                  </div>
                  <div className="health-card p-3">
                    <div className="text-sm text-base-content/60">Fat</div>
                    <div className="text-lg font-semibold">{analysisResult.fat}g</div>
                  </div>
                  <div className="health-card p-3">
                    <div className="text-sm text-base-content/60">Fiber</div>
                    <div className="text-lg font-semibold">{analysisResult.fiber}g</div>
                  </div>
                </div>

                {/* Meal Type Selection */}
                <div className="health-card p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Select Meal Type
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_TYPES.map((meal) => (
                      <button
                        key={meal.value}
                        onClick={() => setSelectedMealType(meal.value)}
                        className={`btn btn-sm justify-start ${
                          selectedMealType === meal.value ? 'btn-primary' : 'btn-outline'
                        }`}
                      >
                        <span className="mr-2">{meal.icon}</span>
                        {meal.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="health-card p-4">
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <p className="text-sm text-base-content/70">{analysisResult.analysis}</p>
                </div>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-3">
                {analysisResult.detectedIngredients.map((ingredient, index) => (
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
                        <Eye className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ))}

                {analysisResult.detectedIngredients.length === 0 && (
                  <div className="text-center py-8 text-base-content/50">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No specific ingredients detected</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'health' && (
              <div className="space-y-4">
                {/* Health Notes */}
                {analysisResult.healthNotes.length > 0 && (
                  <div className="health-card p-4">
                    <h4 className="font-medium mb-2">Health Notes</h4>
                    <ul className="space-y-1">
                      {analysisResult.healthNotes.map((note, index) => (
                        <li key={index} className="text-sm text-base-content/70 flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Allergens */}
                {analysisResult.allergens.length > 0 && (
                  <div className="alert alert-warning">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <h4 className="font-medium">Potential Allergens</h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {analysisResult.allergens.map((allergen, index) => (
                          <span key={index} className="badge badge-warning badge-sm">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Nutrition */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="health-card p-3">
                    <div className="text-sm text-base-content/60">Sugar</div>
                    <div className="text-lg font-semibold">{analysisResult.sugar}g</div>
                  </div>
                  <div className="health-card p-3">
                    <div className="text-sm text-base-content/60">Sodium</div>
                    <div className="text-lg font-semibold">{analysisResult.sodium}mg</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-200 flex gap-3 flex-shrink-0 bg-base-100">
          <button
            onClick={onClose}
            className="btn btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary flex-1"
          >
            Add to {selectedMealType}
          </button>
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