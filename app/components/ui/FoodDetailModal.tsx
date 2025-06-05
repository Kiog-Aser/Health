'use client';

import { X, Calendar, Clock, Zap, Target, Utensils, Activity } from 'lucide-react';
import { FoodEntry } from '../../types';

interface FoodDetailModalProps {
  food: FoodEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FoodDetailModal({ food, isOpen, onClose }: FoodDetailModalProps) {
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
              <div className="flex items-center gap-4 text-sm text-base-content/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {time}
                </span>
                <span className="capitalize">{food.mealType}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Calories Section */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-3">
                <span className="text-2xl font-bold text-primary">{food.calories}</span>
              </div>
              <p className="text-lg font-semibold">Calories</p>
              <p className="text-sm text-base-content/60">Total Energy</p>
            </div>

            {/* Nutrition Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Nutrition Breakdown
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {nutritionData.map((item) => (
                  <div key={item.label} className={`p-4 rounded-lg ${item.bgColor}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${item.color}`}>
                        {item.value}
                      </div>
                      <div className={`text-xs ${item.color} opacity-80`}>
                        {item.unit}
                      </div>
                      <div className="text-sm font-medium text-base-content/80 mt-1">
                        {item.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  
                  {aiData?.detectedIngredients && aiData.detectedIngredients.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm mb-2">Detected Ingredients:</p>
                      <div className="flex flex-wrap gap-1">
                        {aiData.detectedIngredients.map((ingredient: any, index: number) => (
                          <span key={index} className="badge badge-primary badge-sm">
                            {ingredient.name || ingredient}
                          </span>
                        ))}
                      </div>
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
                  This entry was analyzed by AI with {Math.round(food.confidence * 100)}% confidence
                </p>
              </div>
            )}

            {/* Food Image */}
            {food.imageUri && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  Food Image
                </h3>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={food.imageUri} 
                    alt={food.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-base-300">
          <button
            onClick={onClose}
            className="btn btn-primary w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 