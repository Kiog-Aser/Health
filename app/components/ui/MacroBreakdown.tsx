'use client';

import { useEffect, useState } from 'react';

interface MacroBreakdownProps {
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  goals: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  showCalories?: boolean;
  layout?: 'horizontal' | 'vertical';
  animate?: boolean;
}

const macroColors = {
  protein: 'bg-red-500',
  carbs: 'bg-blue-500',
  fat: 'bg-yellow-500',
  fiber: 'bg-green-500',
};

const macroIcons = {
  protein: '🥩',
  carbs: '🍞',
  fat: '🥑',
  fiber: '🥬',
};

const macroCaloriesPerGram = {
  protein: 4,
  carbs: 4,
  fat: 9,
  fiber: 0,
};

export default function MacroBreakdown({ 
  macros, 
  goals, 
  showCalories = true, 
  layout = 'vertical',
  animate = true 
}: MacroBreakdownProps) {
  const [animatedMacros, setAnimatedMacros] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  useEffect(() => {
    if (!animate) {
      setAnimatedMacros(macros);
      return;
    }

    const duration = 800;
    const steps = 40;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    
    const animateStep = () => {
      currentStep++;
      const progress = currentStep / steps;
      
      // Easing function
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      
      setAnimatedMacros({
        protein: macros.protein * easeProgress,
        carbs: macros.carbs * easeProgress,
        fat: macros.fat * easeProgress,
        fiber: macros.fiber * easeProgress,
      });
      
      if (currentStep < steps) {
        setTimeout(animateStep, stepDuration);
      }
    };
    
    animateStep();
  }, [macros, animate]);

  const getMacroProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getMacroStatus = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 90 && percentage <= 110) return 'text-success';
    if (percentage >= 70) return 'text-warning';
    return 'text-error';
  };

  const macroEntries = Object.entries(macros) as [keyof typeof macros, number][];

  if (layout === 'horizontal') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {macroEntries.map(([macro, value]) => (
          <div key={macro} className="text-center">
            <div className="text-2xl mb-1">{macroIcons[macro]}</div>
            <div className="text-lg font-bold capitalize">{macro}</div>
            <div className="text-sm text-base-content/60 mb-2">
              {animatedMacros[macro].toFixed(1)}g / {goals[macro]}g
            </div>
            
            <div className="w-full bg-base-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${macroColors[macro]}`}
                style={{ width: `${getMacroProgress(animatedMacros[macro], goals[macro])}%` }}
              />
            </div>
            
            {showCalories && macro !== 'fiber' && (
              <div className="text-xs text-base-content/40">
                {Math.round(animatedMacros[macro] * macroCaloriesPerGram[macro])} cal
              </div>
            )}
            
            <div className={`text-xs font-medium ${getMacroStatus(value, goals[macro])}`}>
              {Math.round(getMacroProgress(value, goals[macro]))}%
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {macroEntries.map(([macro, value]) => (
        <div key={macro} className="flex items-center gap-4">
          <div className="text-2xl">{macroIcons[macro]}</div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium capitalize">{macro}</span>
              <span className="text-sm text-base-content/60">
                {animatedMacros[macro].toFixed(1)}g / {goals[macro]}g
              </span>
            </div>
            
            <div className="w-full bg-base-200 rounded-full h-3 relative overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ease-out ${macroColors[macro]}`}
                style={{ width: `${getMacroProgress(animatedMacros[macro], goals[macro])}%` }}
              />
              {getMacroProgress(value, goals[macro]) > 100 && (
                <div className="absolute top-0 left-0 w-full h-3 bg-red-500/20 rounded-full" />
              )}
            </div>
            
            <div className="flex justify-between items-center mt-1">
              {showCalories && macro !== 'fiber' && (
                <span className="text-xs text-base-content/40">
                  {Math.round(animatedMacros[macro] * macroCaloriesPerGram[macro])} cal
                </span>
              )}
              <span className={`text-xs font-medium ${getMacroStatus(value, goals[macro])}`}>
                {Math.round(getMacroProgress(value, goals[macro]))}%
              </span>
            </div>
          </div>
        </div>
      ))}
      
      <div className="pt-2 border-t border-base-200">
        <div className="text-xs text-base-content/60 text-center">
          Total Macros: {Object.values(animatedMacros).reduce((sum, val) => sum + val, 0).toFixed(1)}g
          {showCalories && (
            <span className="ml-2">
              ({Math.round(
                animatedMacros.protein * 4 + 
                animatedMacros.carbs * 4 + 
                animatedMacros.fat * 9
              )} cal)
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 