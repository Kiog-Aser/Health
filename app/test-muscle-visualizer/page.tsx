'use client';

import React, { useState } from 'react';
import AnatomicalMuscleVisualizer from '../components/AnatomicalMuscleVisualizer';

export default function TestMuscleVisualizer() {
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(['Chest']);

  const allMuscleGroups = [
    'Chest', 'Upper Chest', 'Back', 'Latissimus Dorsi', 'Rhomboids', 'Traps', 'Lower Back',
    'Shoulders', 'Side Delts', 'Rear Delts', 'Front Delts', 'Triceps', 'Biceps', 'Brachialis', 'Forearms',
    'Quadriceps', 'Rectus Femoris', 'Vastus Lateralis', 'Vastus Medialis', 'Hamstrings', 'Glutes', 'Calves', 'Tibialis Anterior',
    'Core', 'Upper Abs', 'Lower Abs', 'Hip Flexors', 'Obliques', 'Neck'
  ];

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Anatomical Muscle Visualizer Test
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Muscle Selector */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Select Muscle Groups:</h2>
            <div className="grid grid-cols-2 gap-2">
              {allMuscleGroups.map(muscle => (
                <button
                  key={muscle}
                  onClick={() => toggleMuscle(muscle)}
                  className={`btn btn-sm ${
                    selectedMuscles.includes(muscle) 
                      ? 'btn-primary' 
                      : 'btn-outline'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-2">Currently Selected:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMuscles.map(muscle => (
                  <span key={muscle} className="badge badge-primary">
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Visualizer */}
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold">Muscle Visualization:</h2>
            <AnatomicalMuscleVisualizer 
              targetedMuscles={selectedMuscles}
              showTitle={true}
            />
            
            {/* Preset buttons */}
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedMuscles(['Chest', 'Triceps', 'Shoulders'])}
                className="btn btn-outline btn-sm block w-full"
              >
                Push Day (Chest, Triceps, Shoulders)
              </button>
              <button 
                onClick={() => setSelectedMuscles(['Back', 'Latissimus Dorsi', 'Rhomboids'])}
                className="btn btn-outline btn-sm block w-full"
              >
                Pull Day (Back, Lats, Rhomboids)
              </button>
              <button 
                onClick={() => setSelectedMuscles(['Quadriceps', 'Hamstrings', 'Glutes'])}
                className="btn btn-outline btn-sm block w-full"
              >
                Leg Day (Quads, Hamstrings, Glutes)
              </button>
              <button 
                onClick={() => setSelectedMuscles([])}
                className="btn btn-outline btn-sm block w-full"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 