'use client';

import React from 'react';

interface MuscleGroupVisualizerProps {
  targetedMuscles: string[];
  className?: string;
  showTitle?: boolean;
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

export default function MuscleGroupVisualizer({ targetedMuscles, className = "", showTitle = true }: MuscleGroupVisualizerProps) {
  const displayMuscles = getDisplayMuscles(targetedMuscles);
  
  if (displayMuscles.length === 0) {
    return null;
  }
  
  return (
    <div className={`${className}`}>
      <div className="text-center">
        {showTitle && (
          <h4 className="text-sm font-medium text-base-content/60 mb-3">
            Targeted Muscles
          </h4>
        )}
        <div className="flex justify-center gap-4">
          {/* Front silhouette */}
          <div className="relative w-32 h-48 bg-base-300/20 rounded-2xl border border-base-300/30 overflow-hidden">
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
              {/* Front highlights */}
              {displayMuscles.includes('Chest') && (
                <rect x="30" y="28" width="20" height="12" rx="4" fill="#ef4444" opacity="0.7" />
              )}
              {displayMuscles.includes('Shoulders') && (
                <>
                  <circle cx="22" cy="27" r="6" fill="#ef4444" opacity="0.7" />
                  <circle cx="58" cy="27" r="6" fill="#ef4444" opacity="0.7" />
                </>
              )}
            </svg>
          </div>
          {/* Back silhouette */}
          <div className="relative w-32 h-48 bg-base-300/20 rounded-2xl border border-base-300/30 overflow-hidden">
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
              {/* Back highlights */}
              {(displayMuscles.includes('Back') || displayMuscles.includes('Upper Back') || displayMuscles.includes('Lats') || displayMuscles.includes('Lower Back')) && (
                <rect x="25" y="22" width="30" height="25" rx="8" fill="#ef4444" opacity="0.5" />
              )}
              {displayMuscles.includes('Triceps') && (
                <>
                  <rect x="12" y="25" width="8" height="25" rx="4" fill="#ef4444" opacity="0.7" />
                  <rect x="60" y="25" width="8" height="25" rx="4" fill="#ef4444" opacity="0.7" />
                </>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 