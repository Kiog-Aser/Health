'use client';

import { useState, useEffect } from 'react';
import { Scale, Ruler, Target, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { databaseService } from '../services/database';
import { BiomarkerEntry, BiomarkerType } from '../types';
import { useToast } from './ui/ToastNotification';

interface WeeklyCheckinProps {
  onComplete?: () => void;
}

interface CheckinData {
  weight: number;
  waistCircumference?: number;
  chestCircumference?: number;
  armCircumference?: number;
  notes: string;
}

export default function WeeklyCheckin({ onComplete }: WeeklyCheckinProps) {
  const [checkinData, setCheckinData] = useState<CheckinData>({
    weight: 0,
    waistCircumference: 0,
    chestCircumference: 0,
    armCircumference: 0,
    notes: '', 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);
  const [previousWeekData, setPreviousWeekData] = useState<Partial<CheckinData> | null>(null);
  const { showSuccess, showError, ToastContainer } = useToast();

  useEffect(() => {
    loadPreviousData();
  }, []);

  const loadPreviousData = async () => {
    try {
      await databaseService.init();
      
      // Get the most recent weight entry
      const weightEntries = await databaseService.getBiomarkerEntries('weight');
      
      if (weightEntries.length > 0) {
        const lastWeightEntry = weightEntries[0];
        setLastCheckin(new Date(lastWeightEntry.timestamp));
        
        // Get data from one week ago for comparison
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const weekOldWeight = weightEntries.find(entry => 
          Math.abs(entry.timestamp - oneWeekAgo) < (3 * 24 * 60 * 60 * 1000) // within 3 days
        );
        
        if (weekOldWeight) {
          setPreviousWeekData({
            weight: weekOldWeight.value,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load previous data:', error);
    }
  };

  const handleSubmit = async () => {
    if (checkinData.weight <= 0) {
      showError('Invalid weight', 'Please enter a valid weight');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const timestamp = Date.now();
      
      // Create biomarker entries
      const entries: BiomarkerEntry[] = [];
      
      // Weight (required)
      entries.push({
        id: `weight_${timestamp}`,
        type: 'weight',
        value: checkinData.weight,
        unit: 'kg',
        timestamp,
        notes: checkinData.notes || undefined,
      });
      
      // Waist circumference (optional)
      if (checkinData.waistCircumference && checkinData.waistCircumference > 0) {
        entries.push({
          id: `waist_${timestamp}`,
          type: 'custom',
          value: checkinData.waistCircumference,
          unit: 'cm',
          timestamp,
          notes: 'Waist circumference',
        });
      }
      
      // Chest circumference (optional)
      if (checkinData.chestCircumference && checkinData.chestCircumference > 0) {
        entries.push({
          id: `chest_${timestamp}`,
          type: 'custom',
          value: checkinData.chestCircumference,
          unit: 'cm',
          timestamp,
          notes: 'Chest circumference',
        });
      }
      
      // Arm circumference (optional)
      if (checkinData.armCircumference && checkinData.armCircumference > 0) {
        entries.push({
          id: `arm_${timestamp}`,
          type: 'custom',
          value: checkinData.armCircumference,
          unit: 'cm',
          timestamp,
          notes: 'Arm circumference',
        });
      }
      
      // Save all entries
      for (const entry of entries) {
        await databaseService.addBiomarkerEntry(entry);
      }
      
      showSuccess('Weekly check-in completed!', 'Your progress has been recorded');
      
      // Reset form
      setCheckinData({
        weight: 0,
        waistCircumference: 0,
        chestCircumference: 0,
        armCircumference: 0,
        notes: '',
      });
      
      // Reload previous data
      await loadPreviousData();
      
      if (onComplete) {
        onComplete();
      }
      
    } catch (error) {
      console.error('Failed to save check-in:', error);
      showError('Failed to save check-in', 'Please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChangeIndicator = (current: number, previous?: number) => {
    if (!previous || current === 0) return null;
    
    const change = current - previous;
    const changePercent = Math.abs((change / previous) * 100);
    
    if (Math.abs(change) < 0.1) return null; // No significant change
    
    return {
      change: change,
      percent: changePercent,
      direction: change > 0 ? 'up' : 'down',
    };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = () => {
    if (!lastCheckin) return false;
    const daysSinceLastCheckin = (Date.now() - lastCheckin.getTime()) / (24 * 60 * 60 * 1000);
    return daysSinceLastCheckin >= 7;
  };

  return (
    <>
      <div className="health-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Weekly Check-in
          </h2>
          {isOverdue() && (
            <div className="badge badge-error badge-outline">
              Overdue
            </div>
          )}
        </div>

        {lastCheckin && (
          <div className="alert alert-info mb-6">
            <Calendar className="w-5 h-5" />
            <div>
              <div className="font-medium">Last check-in: {formatDate(lastCheckin)}</div>
              <div className="text-sm opacity-75">
                {Math.floor((Date.now() - lastCheckin.getTime()) / (24 * 60 * 60 * 1000))} days ago
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight - Required */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                Weight (kg) *
              </span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="70.5"
              className="input input-bordered"
              value={checkinData.weight || ''}
              onChange={(e) => setCheckinData({
                ...checkinData,
                weight: parseFloat(e.target.value) || 0
              })}
            />
            {previousWeekData?.weight && checkinData.weight > 0 && (
              <div className="mt-2">
                {(() => {
                  const indicator = getChangeIndicator(checkinData.weight, previousWeekData.weight);
                  if (!indicator) return null;
                  
                  return (
                    <div className={`flex items-center gap-1 text-sm ${
                      indicator.direction === 'up' ? 'text-orange-500' : 'text-green-500'
                    }`}>
                      {indicator.direction === 'up' ? 
                        <TrendingUp className="w-4 h-4" /> : 
                        <TrendingDown className="w-4 h-4" />
                      }
                      {Math.abs(indicator.change).toFixed(1)}kg ({indicator.percent.toFixed(1)}%)
                      from last week
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Waist Circumference */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Waist (cm)
              </span>
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="85"
              className="input input-bordered"
              value={checkinData.waistCircumference || ''}
              onChange={(e) => setCheckinData({
                ...checkinData,
                waistCircumference: parseFloat(e.target.value) || 0
              })}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Measure at navel level
              </span>
            </label>
          </div>

          {/* Chest Circumference */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Chest (cm)
              </span>
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="100"
              className="input input-bordered"
              value={checkinData.chestCircumference || ''}
              onChange={(e) => setCheckinData({
                ...checkinData,
                chestCircumference: parseFloat(e.target.value) || 0
              })}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Measure around fullest part
              </span>
            </label>
          </div>

          {/* Arm Circumference */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Arm (cm)
              </span>
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="32"
              className="input input-bordered"
              value={checkinData.armCircumference || ''}
              onChange={(e) => setCheckinData({
                ...checkinData,
                armCircumference: parseFloat(e.target.value) || 0
              })}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Measure at largest point (flexed)
              </span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="form-control mt-6">
          <label className="label">
            <span className="label-text font-medium">Notes (optional)</span>
          </label>
          <textarea
            className="textarea textarea-bordered"
            placeholder="How are you feeling? Any observations about your progress..."
            rows={3}
            value={checkinData.notes}
            onChange={(e) => setCheckinData({
              ...checkinData,
              notes: e.target.value
            })}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || checkinData.weight <= 0}
            className="btn btn-primary btn-wide"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Complete Check-in
              </>
            )}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h4 className="font-medium mb-2">📏 Measurement Tips:</h4>
          <ul className="text-sm space-y-1 text-base-content/70">
            <li>• Measure at the same time each week (preferably morning)</li>
            <li>• Use the same measuring tape for consistency</li>
            <li>• Take measurements before eating or drinking</li>
            <li>• Stand straight and breathe normally while measuring</li>
          </ul>
        </div>
      </div>
      
      <ToastContainer />
    </>
  );
} 