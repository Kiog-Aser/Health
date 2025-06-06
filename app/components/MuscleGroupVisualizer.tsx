'use client';

import React from 'react';

interface MuscleGroupVisualizerProps {
  targetedMuscles: string[];
  className?: string;
}

// Muscle group mapping to display names
const muscleGroupMapping = {
  'Chest': 'Chest',
  'Shoulders': 'Shoulders', 
  'Triceps': 'Triceps',
  'Biceps': 'Biceps',
  'Forearms': 'Forearms',
  'Arms': 'Arms',
  'Latissimus Dorsi': 'Lats',
  'Rhomboids': 'Upper Back',
  'Lower Back': 'Lower Back',
  'Back': 'Back',
  'Quadriceps': 'Quads',
  'Hamstrings': 'Hamstrings',
  'Glutes': 'Glutes',
  'Calves': 'Calves',
  'Legs': 'Legs',
  'Core': 'Core',
  'Abdominals': 'Abs',
  'Traps': 'Traps',
};

const getDisplayMuscles = (targetedMuscles: string[]): string[] => {
  const displayMuscles = new Set<string>();
  
  targetedMuscles.forEach(muscle => {
    const displayName = muscleGroupMapping[muscle as keyof typeof muscleGroupMapping];
    if (displayName) {
      displayMuscles.add(displayName);
    }
  });
  
  return Array.from(displayMuscles);
};

export default function MuscleGroupVisualizer({ targetedMuscles, className = "" }: MuscleGroupVisualizerProps) {
  const displayMuscles = getDisplayMuscles(targetedMuscles);
  
  if (displayMuscles.length === 0) {
    return null;
  }
  
  return (
    <div className={`${className}`}>
      <div className="text-center">
        <h4 className="text-sm font-medium text-base-content/60 mb-3">Targeted Muscles</h4>
        <div className="flex justify-center">
          <div className="relative w-32 h-48 bg-base-300/20 rounded-2xl border border-base-300/30 overflow-hidden">
            {/* Simple body outline */}
            <svg viewBox="0 0 80 120" className="w-full h-full">
              {/* Head */}
              <circle cx="40" cy="12" r="8" fill="currentColor" opacity="0.1" />
              
              {/* Torso */}
              <rect x="25" y="20" width="30" height="40" rx="8" fill="currentColor" opacity="0.1" />
              
              {/* Arms */}
              <rect x="12" y="25" width="8" height="25" rx="4" fill="currentColor" opacity="0.1" />
              <rect x="60" y="25" width="8" height="25" rx="4" fill="currentColor" opacity="0.1" />
              
              {/* Legs */}
              <rect x="28" y="62" width="10" height="35" rx="5" fill="currentColor" opacity="0.1" />
              <rect x="42" y="62" width="10" height="35" rx="5" fill="currentColor" opacity="0.1" />
              
              {/* Highlighted muscles */}
              {displayMuscles.includes('Chest') && (
                <rect x="30" y="28" width="20" height="12" rx="4" fill="#ef4444" opacity="0.7" />
              )}
              
              {displayMuscles.includes('Shoulders') && (
                <>
                  <circle cx="22" cy="27" r="6" fill="#ef4444" opacity="0.7" />
                  <circle cx="58" cy="27" r="6" fill="#ef4444" opacity="0.7" />
                </>
              )}
              
              {(displayMuscles.includes('Arms') || displayMuscles.includes('Biceps') || displayMuscles.includes('Triceps')) && (
                <>
                  <rect x="13" y="30" width="6" height="15" rx="3" fill="#ef4444" opacity="0.7" />
                  <rect x="61" y="30" width="6" height="15" rx="3" fill="#ef4444" opacity="0.7" />
                </>
              )}
              
              {(displayMuscles.includes('Back') || displayMuscles.includes('Lats') || displayMuscles.includes('Upper Back')) && (
                <rect x="25" y="22" width="30" height="25" rx="8" fill="#ef4444" opacity="0.5" />
              )}
              
              {(displayMuscles.includes('Core') || displayMuscles.includes('Abs')) && (
                <rect x="32" y="42" width="16" height="18" rx="4" fill="#ef4444" opacity="0.7" />
              )}
              
              {(displayMuscles.includes('Legs') || displayMuscles.includes('Quads') || displayMuscles.includes('Hamstrings') || displayMuscles.includes('Glutes')) && (
                <>
                  <rect x="28" y="62" width="10" height="35" rx="5" fill="#ef4444" opacity="0.7" />
                  <rect x="42" y="62" width="10" height="35" rx="5" fill="#ef4444" opacity="0.7" />
                </>
              )}
            </svg>
          </div>
        </div>
        
        {/* Muscle labels */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {displayMuscles.map(muscle => (
            <span key={muscle} className="badge badge-primary badge-sm">
              {muscle}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 