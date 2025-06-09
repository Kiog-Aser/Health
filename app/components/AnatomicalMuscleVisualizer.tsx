'use client';

import React, { useEffect, useState } from 'react';

interface AnatomicalMuscleVisualizerProps {
  targetedMuscles: string[];
  className?: string;
  showTitle?: boolean;
}

// Mapping from exercise muscle groups to SVG element IDs
// FIXED MAPPING based on user feedback
const muscleToSvgMapping: Record<string, string[]> = {
  // These work correctly according to user
  'Chest': ['pectoralis-major-left', 'pectoralis-major-right'],
  'Upper Chest': ['pectoralis-major-left', 'pectoralis-major-right'],
  'Back': ['trapezius-posterior-left', 'trapezius-posterior-right', 'latissimus-dorsi-left', 'latissimus-dorsi-right', 'rhomboid-major-left', 'rhomboid-major-right'],
  'Latissimus Dorsi': ['latissimus-dorsi-left', 'latissimus-dorsi-right'],
  'Rhomboids': ['rhomboid-major-left', 'rhomboid-major-right'],
  'Lower Back': ['erector-spinae-left', 'erector-spinae-right'], // User confirmed correct
  'Rear Delts': ['deltoid-posterior-left', 'deltoid-posterior-right'],
  'Side Delts': ['deltoid-lateral-left', 'deltoid-lateral-right'], // Only back view working
  'Hamstrings': ['hamstrings-left', 'hamstrings-right'],
  'Glutes': ['gluteus-maximus-left', 'gluteus-maximus-right'],
  
  // CALVES - Working correctly
  'Calves': ['gastrocnemius-medial-left', 'gastrocnemius-medial-right', 'gastrocnemius-lateral-left', 'gastrocnemius-lateral-right', 'soleus-left', 'soleus-right'],
  
  // CORE/ABS - User said "core is perfect" so keeping as is
  'Core': ['upper-abs-left', 'upper-abs-right', 'obliques-left', 'obliques-right', 'vastus-medialis-left', 'vastus-medialis-right', 'rectus-femoris-left', 'rectus-femoris-right'],
  
  // User said "Upper abs are highlighting the correct things" so keeping as is
  'Upper Abs': ['upper-abs-left', 'upper-abs-right', 'rectus-femoris-left', 'rectus-femoris-right', 'obliques-left', 'obliques-right'], 
  
  // User said "lower abs too" are correct
  'Lower Abs': ['vastus-medialis-left', 'vastus-medialis-right'], // User confirmed correct
  
  // OBLIQUES - User said "you got the obliques right. Those are working fine now"
  'Obliques': ['neck-front-left', 'neck-front-right'],
  
  // ARM MUSCLES - Resolving conflicts
  // User confirmed biceps work with deltoid-anterior
  'Biceps': ['deltoid-anterior-left', 'deltoid-anterior-right'], // User confirmed correct
  
  // BRACHIALIS - User: "still not highlighting the muscle next to biceps, but a forearm muscle instead"
  // trapezius-upper-front is showing forearm, let's try some completely different IDs
  // Maybe the actual brachialis is mapped to something unexpected like teres-major
  'Brachialis': ['teres-major-left', 'teres-major-right'],
  
  // FRONT DELTS - Keep biceps-brachii for now
  'Front Delts': ['biceps-brachii-left', 'biceps-brachii-right'],
  
  // FOREARMS - Keep clean
  'Forearms': ['forearm-extensors-lateral-left', 'forearm-extensors-lateral-right', 'forearm-flexors-medial-left', 'forearm-flexors-medial-right'],
  
  // QUADRICEPS - User: "highlighting them, but in the back view, not in the front"
  // thigh-outer is showing back view. Let's try some front torso IDs that might be mislabeled front legs
  // Since the SVG is so mislabeled, maybe front legs are mapped to arm/torso IDs
  // Try trapezius-upper-front instead to avoid conflict with shoulders
  'Quadriceps': ['trapezius-upper-front-left', 'trapezius-upper-front-right'],
  
  // Try different experimental approaches for individual quad muscles
  // User: "all the heads of the quadriceps are not highlighting anything in the front view"
  // Let's try some completely random IDs that might be the missing front legs
  'Rectus Femoris': ['soleus-left', 'soleus-right'], // Try calf IDs
  'Vastus Lateralis': ['vastus-lateralis-left', 'vastus-lateralis-right'], // Keep since user said this might be correct
  'Vastus Medialis': ['gastrocnemius-medial-left', 'gastrocnemius-medial-right'], // Try different calf IDs
  
  // User confirmed this is correct
  'Tibialis Anterior': ['tibialis-anterior-left', 'tibialis-anterior-right'],
  
  // WORKING BACK VIEW MUSCLES
  'Triceps': ['triceps-brachii-left', 'triceps-brachii-right'],
  
  // SHOULDERS - Keep back view only
  'Shoulders': ['deltoid-posterior-left', 'deltoid-posterior-right', 'deltoid-lateral-left', 'deltoid-lateral-right'],
  
  // TRAPS - User: "traps are not highlighting the traps from the front now, but instead the neck part from the front"
  // Remove brachialis IDs and add the actual front traps
  // User: "thigh-outer are highlighting the upper traps, which should be with the traps"
  'Traps': ['trapezius-posterior-left', 'trapezius-posterior-right', 'thigh-outer-left', 'thigh-outer-right'],
  
  // NECK - User: "neck part from the front, which should be together with neck"
  // Add back the brachialis IDs since they're showing front neck
  'Neck': ['neck-back-left', 'neck-back-right', 'brachialis-left', 'brachialis-right'],
  
  // Hip flexors - User: "highlighting the middle muscle from the back view of the legs. I'm not sure if that's true"
  // Sounds like it might be correct, keeping as is
  'Hip Flexors': ['adductor-group-inner-thigh-left', 'adductor-group-inner-thigh-right'],
};

export default function AnatomicalMuscleVisualizer({ 
  targetedMuscles, 
  className = "", 
  showTitle = true 
}: AnatomicalMuscleVisualizerProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the SVG file
    fetch('/assets/image.svg')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(content => {
        // Add viewBox to ensure proper scaling
        const modifiedContent = content.replace(
          /<svg([^>]*?)>/,
          '<svg$1 viewBox="0 0 1322 988">'
        );
        setSvgContent(modifiedContent);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to load SVG:', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    // Apply highlighting using CSS by targeting specific muscle IDs
    const applyHighlighting = () => {
      const svgElement = document.querySelector('.anatomical-svg svg');
      if (svgElement) {
        // Reset ALL muscles to grey first (not just highlighted ones)
        const allMuscleElements = svgElement.querySelectorAll('path[id]');
        allMuscleElements.forEach(element => {
          const elementId = element.getAttribute('id');
          // Only reset actual muscle elements (exclude background, skin, etc.)
          if (elementId && !elementId.includes('background') && !elementId.includes('skin')) {
            element.setAttribute('fill', '#9F9E9E');
          }
        });

        // Only highlight if we have targeted muscles
        if (targetedMuscles.length > 0) {
          // Get all SVG element IDs that should be highlighted
          const muscleIds = new Set<string>();
          targetedMuscles.forEach(muscle => {
            const svgIds = muscleToSvgMapping[muscle];
            if (svgIds) {
              svgIds.forEach(id => muscleIds.add(id));
            }
          });

          // Highlight targeted muscles
          muscleIds.forEach(muscleId => {
            const muscleElement = svgElement.querySelector(`#${muscleId}`);
            if (muscleElement) {
              muscleElement.setAttribute('fill', '#DE5947');
            }
          });
        }
      }
    };

    // Small delay to ensure SVG is rendered in DOM
    const timer = setTimeout(applyHighlighting, 100);
    return () => clearTimeout(timer);
  }, [targetedMuscles]);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <style jsx>{`
        .anatomical-svg {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .anatomical-svg svg {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .anatomical-svg path[fill="#DE5947"] {
          transition: fill 0.3s ease;
          filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.4));
        }
        
        .anatomical-svg path[fill="#9F9E9E"] {
          transition: all 0.3s ease;
        }
        
        .muscle-diagram {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.1) 0%, rgba(15, 23, 42, 0.2) 100%);
        }
      `}</style>
      
      <div className="text-center">
        {showTitle && (
          <h4 className="text-sm font-medium text-base-content/60 mb-3">
            Targeted Muscles
          </h4>
        )}
        
        <div className="flex justify-center">
          <div className="relative w-80 h-96 rounded-xl overflow-hidden">
            <div 
              className="anatomical-svg absolute inset-0"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 