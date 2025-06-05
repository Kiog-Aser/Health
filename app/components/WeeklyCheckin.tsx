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
  bodyFat?: number;
  muscleMass?: number;
  waistCircumference?: number;
  notes: string;
}

export default function WeeklyCheckin({ onComplete }: WeeklyCheckinProps) {
  const [checkinData, setCheckinData] = useState<CheckinData>({
    weight: 0,
    bodyFat: 0,
    muscleMass: 0,
    waistCircumference: 0,
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
      const bodyFatEntries = await databaseService.getBiomarkerEntries('body_fat');
      const muscleEntries = await databaseService.getBiomarkerEntries('muscle_mass');
      
      if (weightEntries.length > 0) {
        const lastWeightEntry = weightEntries[0];
        setLastCheckin(new Date(lastWeightEntry.timestamp));
        
        // Get data from one week ago for comparison
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const weekOldWeight = weightEntries.find(entry => 
          Math.abs(entry.timestamp - oneWeekAgo) < (3 * 24 * 60 * 60 * 1000) // within 3 days
        );
        
        if (weekOldWeight) {
          const weekOldBodyFat = bodyFatEntries.find(entry => 
            Math.abs(entry.timestamp - oneWeekAgo) < (3 * 24 * 60 * 60 * 1000)
          );
          const weekOldMuscle = muscleEntries.find(entry => 
            Math.abs(entry.timestamp - oneWeekAgo) < (3 * 24 * 60 * 60 * 1000)
          );
          
          setPreviousWeekData({
            weight: weekOldWeight.value,
            bodyFat: weekOldBodyFat?.value,
            muscleMass: weekOldMuscle?.value,
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
      
      // Body fat (optional)
      if (checkinData.bodyFat && checkinData.bodyFat > 0) {
        entries.push({
          id: `bodyfat_${timestamp}`,
          type: 'body_fat',
          value: checkinData.bodyFat,
          unit: '%',
          timestamp,
        });
      }
      
      // Muscle mass (optional)
      if (checkinData.muscleMass && checkinData.muscleMass > 0) {
        entries.push({
          id: `muscle_${timestamp}`,
          type: 'muscle_mass',
          value: checkinData.muscleMass,
          unit: 'kg',
          timestamp,
        });
      }
      
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
      
      // Save all entries
      for (const entry of entries) {
        await databaseService.addBiomarkerEntry(entry);
      }
      
      showSuccess('Weekly check-in completed!', 'Your progress has been recorded');
      
      // Reset form
      setCheckinData({
        weight: 0,
        bodyFat: 0,
        muscleMass: 0,
        waistCircumference: 0,
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
          {lastCheckin && (
            <div className="text-sm text-base-content/60">
              Last: {formatDate(lastCheckin)}
              {isOverdue() && (
                <span className="ml-2 badge badge-warning badge-sm">Overdue</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Weight Input */}
          <div>
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Weight (kg) *
              </span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.1"
                className="input input-bordered flex-1"
                value={checkinData.weight || ''}
                onChange={(e) => setCheckinData({
                  ...checkinData,
                  weight: parseFloat(e.target.value) || 0
                })}
                placeholder="Enter weight"
              />
              {previousWeekData?.weight && checkinData.weight > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  {(() => {
                    const indicator = getChangeIndicator(checkinData.weight, previousWeekData.weight);
                    if (!indicator) return <span className="text-base-content/60">No change</span>;
                    
                    return (
                      <div className={`flex items-center gap-1 ${
                        indicator.direction === 'up' ? 'text-orange-500' : 'text-green-500'
                      }`}>
                        {indicator.direction === 'up' ? 
                          <TrendingUp className="w-4 h-4" /> : 
                          <TrendingDown className="w-4 h-4" />
                        }
                        <span>{Math.abs(indicator.change).toFixed(1)}kg</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Body Fat Percentage */}
          <div>
            <label className="label">
              <span className="label-text">Body Fat (%)</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.1"
                className="input input-bordered flex-1"
                value={checkinData.bodyFat || ''}
                onChange={(e) => setCheckinData({
                  ...checkinData,
                  bodyFat: parseFloat(e.target.value) || 0
                })}
                placeholder="Optional"
              />
              {previousWeekData?.bodyFat && checkinData.bodyFat && checkinData.bodyFat > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  {(() => {
                    const indicator = getChangeIndicator(checkinData.bodyFat, previousWeekData.bodyFat);
                    if (!indicator) return <span className="text-base-content/60">No change</span>;
                    
                    return (
                      <div className={`flex items-center gap-1 ${
                        indicator.direction === 'up' ? 'text-orange-500' : 'text-green-500'
                      }`}>
                        {indicator.direction === 'up' ? 
                          <TrendingUp className="w-4 h-4" /> : 
                          <TrendingDown className="w-4 h-4" />
                        }
                        <span>{Math.abs(indicator.change).toFixed(1)}%</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Muscle Mass */}
          <div>
            <label className="label">
              <span className="label-text">Muscle Mass (kg)</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.1"
                className="input input-bordered flex-1"
                value={checkinData.muscleMass || ''}
                onChange={(e) => setCheckinData({
                  ...checkinData,
                  muscleMass: parseFloat(e.target.value) || 0
                })}
                placeholder="Optional"
              />
              {previousWeekData?.muscleMass && checkinData.muscleMass && checkinData.muscleMass > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  {(() => {
                    const indicator = getChangeIndicator(checkinData.muscleMass, previousWeekData.muscleMass);
                    if (!indicator) return <span className="text-base-content/60">No change</span>;
                    
                    return (
                      <div className={`flex items-center gap-1 ${
                        indicator.direction === 'up' ? 'text-green-500' : 'text-orange-500'
                      }`}>
                        {indicator.direction === 'up' ? 
                          <TrendingUp className="w-4 h-4" /> : 
                          <TrendingDown className="w-4 h-4" />
                        }
                        <span>{Math.abs(indicator.change).toFixed(1)}kg</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Waist Circumference */}
          <div>
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Waist Circumference (cm)
              </span>
            </label>
            <input
              type="number"
              step="0.1"
              className="input input-bordered w-full"
              value={checkinData.waistCircumference || ''}
              onChange={(e) => setCheckinData({
                ...checkinData,
                waistCircumference: parseFloat(e.target.value) || 0
              })}
              placeholder="Optional"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">
              <span className="label-text">Notes</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={checkinData.notes}
              onChange={(e) => setCheckinData({
                ...checkinData,
                notes: e.target.value
              })}
              placeholder="How are you feeling? Any observations about your progress?"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || checkinData.weight <= 0}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Complete Weekly Check-in
              </>
            )}
          </button>
        </div>
      </div>
      <ToastContainer />
    </>
  );
} 