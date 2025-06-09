'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function MuscleMapperDebugPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [clickedElements, setClickedElements] = useState<Array<{id: string, name: string}>>([]);
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState<string>('');

  const muscleGroups = [
    'Chest', 'Upper Chest', 'Front Delts', 'Side Delts', 'Rear Delts', 
    'Biceps', 'Triceps', 'Brachialis', 'Forearms',
    'Upper Abs', 'Lower Abs', 'Obliques', 'Core',
    'Quadriceps', 'Rectus Femoris', 'Vastus Lateralis', 'Vastus Medialis',
    'Hamstrings', 'Glutes', 'Calves', 'Tibialis Anterior',
    'Lats', 'Rhomboids', 'Traps', 'Lower Back', 'Neck'
  ];

  useEffect(() => {
    // Load the SVG file
    fetch('/assets/image.svg')
      .then(response => response.text())
      .then(content => {
        setSvgContent(content);
      })
      .catch(error => {
        console.error('Failed to load SVG:', error);
      });
  }, []);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    // Inject SVG into container
    containerRef.current.innerHTML = svgContent;

    const svgElement = containerRef.current.querySelector('svg');
    if (svgElement) {
      // Add viewBox for proper scaling
      svgElement.setAttribute('viewBox', '0 0 1322 988');
      svgElement.style.width = '100%';
      svgElement.style.height = 'auto';
      svgElement.style.maxHeight = '600px';

      // Get all path elements with IDs (muscles)
      const muscleElements = svgElement.querySelectorAll('path[id]');
      
      muscleElements.forEach((element: Element) => {
        const pathElement = element as SVGPathElement;
        const id = pathElement.getAttribute('id');
        
        if (id && !id.includes('background') && !id.includes('skin')) {
          // Style for interaction
          pathElement.style.cursor = 'pointer';
          pathElement.style.transition = 'all 0.2s ease';
          
          // Reset to default color
          pathElement.setAttribute('fill', '#9F9E9E');
          
          // Add hover effect
          pathElement.addEventListener('mouseenter', () => {
            pathElement.style.opacity = '0.7';
            pathElement.style.filter = 'brightness(1.2)';
          });
          
          pathElement.addEventListener('mouseleave', () => {
            pathElement.style.opacity = '1';
            pathElement.style.filter = 'none';
          });
          
          // Add click handler
          pathElement.addEventListener('click', () => {
            if (currentMuscleGroup) {
              // Highlight the clicked element
              pathElement.setAttribute('fill', '#DE5947');
              
              // Add to the mapping
              setClickedElements(prev => {
                const updated = prev.filter(item => item.id !== id);
                return [...updated, { id: id, name: currentMuscleGroup }];
              });
              
              console.log(`Mapped ${id} to ${currentMuscleGroup}`);
            }
          });
        }
      });
    }
  }, [svgContent, currentMuscleGroup]);

  const resetMapping = () => {
    setClickedElements([]);
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        const muscleElements = svgElement.querySelectorAll('path[id]');
        muscleElements.forEach((element: Element) => {
          const pathElement = element as SVGPathElement;
          const id = pathElement.getAttribute('id');
          if (id && !id.includes('background') && !id.includes('skin')) {
            pathElement.setAttribute('fill', '#9F9E9E');
          }
        });
      }
    }
  };

  const exportMapping = () => {
    const mapping: Record<string, string[]> = {};
    
    // Group by muscle name
    clickedElements.forEach(({ id, name }) => {
      if (!mapping[name]) {
        mapping[name] = [];
      }
      mapping[name].push(id);
    });

    console.log('Generated muscle mapping:');
    console.log(JSON.stringify(mapping, null, 2));
    
    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(mapping, null, 2));
    alert('Muscle mapping copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Muscle Mapper Debug Tool</h1>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Select Muscle Group:</h3>
              <select 
                value={currentMuscleGroup} 
                onChange={(e) => setCurrentMuscleGroup(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Choose muscle group...</option>
                {muscleGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">2. Click on muscles in SVG</h3>
              <p className="text-sm text-base-content/70 mb-3">
                Select a muscle group above, then click on the corresponding muscles in the diagram.
                Clicked muscles will turn red.
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={resetMapping}
                  className="btn btn-outline btn-sm"
                >
                  Reset All
                </button>
                <button 
                  onClick={exportMapping}
                  className="btn btn-primary btn-sm"
                  disabled={clickedElements.length === 0}
                >
                  Export Mapping
                </button>
              </div>
            </div>

            {/* Current Mapping */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Mapping:</h3>
              <div className="bg-base-200 p-3 rounded-lg max-h-60 overflow-y-auto">
                {clickedElements.length === 0 ? (
                  <p className="text-sm text-base-content/50">No mappings yet...</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(
                      clickedElements.reduce((acc, { id, name }) => {
                        if (!acc[name]) acc[name] = [];
                        acc[name].push(id);
                        return acc;
                      }, {} as Record<string, string[]>)
                    ).map(([muscle, ids]) => (
                      <div key={muscle} className="text-sm">
                        <strong>{muscle}:</strong> {ids.join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SVG Display */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Muscle Diagram:</h3>
            <div 
              ref={containerRef}
              className="border border-base-300 rounded-lg bg-white p-4"
              style={{ minHeight: '400px' }}
            />
            
            {currentMuscleGroup && (
              <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  <strong>Active:</strong> {currentMuscleGroup} - Click on muscles in the diagram to map them.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 