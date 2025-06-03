'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Minus, Activity, Calendar, Edit, Trash2 } from 'lucide-react';
import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { BiomarkerEntry, BiomarkerType } from '../types';
import AppLayout from '../../src/components/layout/AppLayout';

const BIOMARKER_CONFIGS = {
  weight: { name: 'Weight', unit: 'kg', icon: '⚖️', color: 'bg-blue-500' },
  height: { name: 'Height', unit: 'cm', icon: '📏', color: 'bg-green-500' },
  body_fat: { name: 'Body Fat', unit: '%', icon: '🔥', color: 'bg-orange-500' },
  muscle_mass: { name: 'Muscle Mass', unit: 'kg', icon: '💪', color: 'bg-red-500' },
  blood_pressure_systolic: { name: 'Systolic BP', unit: 'mmHg', icon: '❤️', color: 'bg-pink-500' },
  blood_pressure_diastolic: { name: 'Diastolic BP', unit: 'mmHg', icon: '❤️', color: 'bg-pink-400' },
  heart_rate: { name: 'Heart Rate', unit: 'bpm', icon: '💓', color: 'bg-red-400' },
  blood_glucose: { name: 'Blood Glucose', unit: 'mg/dL', icon: '🩸', color: 'bg-purple-500' },
  cholesterol: { name: 'Cholesterol', unit: 'mg/dL', icon: '🫀', color: 'bg-indigo-500' },
  sleep_hours: { name: 'Sleep', unit: 'hours', icon: '😴', color: 'bg-blue-400' },
  water_intake: { name: 'Water Intake', unit: 'L', icon: '💧', color: 'bg-cyan-500' },
  steps: { name: 'Steps', unit: 'steps', icon: '👟', color: 'bg-emerald-500' },
  custom: { name: 'Custom', unit: '', icon: '📊', color: 'bg-gray-500' },
};

export default function BiomarkersClient() {
  const [biomarkers, setBiomarkers] = useState<BiomarkerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<BiomarkerType | 'all'>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const [newEntry, setNewEntry] = useState({
    type: 'weight' as BiomarkerType,
    value: 0,
    unit: 'kg',
    notes: '',
  });

  useEffect(() => {
    loadBiomarkers();
  }, []);

  const loadBiomarkers = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      const data = await databaseService.getBiomarkerEntries();
      setBiomarkers(data);
    } catch (error) {
      console.error('Failed to load biomarkers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.value) return;

    const entry: BiomarkerEntry = {
      id: Date.now().toString(),
      type: newEntry.type,
      value: newEntry.value,
      unit: newEntry.unit,
      timestamp: Date.now(),
      notes: newEntry.notes || undefined,
    };

    try {
      await databaseService.addBiomarkerEntry(entry);
      setBiomarkers([entry, ...biomarkers]);
      setShowAddModal(false);
      resetNewEntry();
    } catch (error) {
      console.error('Failed to add biomarker entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await databaseService.deleteBiomarkerEntry(entryId);
      setBiomarkers(biomarkers.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Failed to delete biomarker entry:', error);
    }
  };

  const resetNewEntry = () => {
    setNewEntry({
      type: 'weight',
      value: 0,
      unit: 'kg',
      notes: '',
    });
  };

  const getFilteredBiomarkers = (): BiomarkerEntry[] => {
    let filtered = biomarkers;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(entry => entry.type === selectedType);
    }

    // Filter by timeframe
    const now = Date.now();
    const timeframes = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - timeframes[selectedTimeframe];
    filtered = filtered.filter(entry => entry.timestamp > cutoff);

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  const getBiomarkerSummary = () => {
    const summary: Record<BiomarkerType, { latest: BiomarkerEntry | null; count: number; trend: 'up' | 'down' | 'stable' }> = {} as any;

    Object.keys(BIOMARKER_CONFIGS).forEach(type => {
      const entries = biomarkers.filter(entry => entry.type === type).sort((a, b) => b.timestamp - a.timestamp);
      const latest = entries[0] || null;
      const count = entries.length;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (entries.length >= 2) {
        const recent = entries.slice(0, Math.min(5, entries.length));
        const values = recent.map(e => e.value);
        const calculatedTrend = HealthCalculations.calculateTrend(values.reverse());
        trend = calculatedTrend === 'increasing' ? 'up' : calculatedTrend === 'decreasing' ? 'down' : 'stable';
      }

      summary[type as BiomarkerType] = { latest, count, trend };
    });

    return summary;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthStatus = (type: BiomarkerType, value: number): { status: string; color: string } => {
    switch (type) {
      case 'blood_pressure_systolic':
        if (value < 90) return { status: 'Low', color: 'text-blue-500' };
        if (value < 120) return { status: 'Normal', color: 'text-green-500' };
        if (value < 140) return { status: 'Elevated', color: 'text-yellow-500' };
        return { status: 'High', color: 'text-red-500' };
      
      case 'blood_pressure_diastolic':
        if (value < 60) return { status: 'Low', color: 'text-blue-500' };
        if (value < 80) return { status: 'Normal', color: 'text-green-500' };
        if (value < 90) return { status: 'Elevated', color: 'text-yellow-500' };
        return { status: 'High', color: 'text-red-500' };
      
      case 'heart_rate':
        if (value < 60) return { status: 'Low', color: 'text-blue-500' };
        if (value < 100) return { status: 'Normal', color: 'text-green-500' };
        return { status: 'High', color: 'text-red-500' };
      
      case 'blood_glucose':
        if (value < 70) return { status: 'Low', color: 'text-blue-500' };
        if (value < 100) return { status: 'Normal', color: 'text-green-500' };
        if (value < 126) return { status: 'Prediabetic', color: 'text-yellow-500' };
        return { status: 'Diabetic', color: 'text-red-500' };
      
      default:
        return { status: '', color: '' };
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="🩺 Biomarkers">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const summary = getBiomarkerSummary();
  const filteredBiomarkers = getFilteredBiomarkers();

  return (
    <AppLayout title="🩺 Biomarkers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Health Biomarkers</h1>
            <p className="text-base-content/60">Track your vital health metrics over time</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(BIOMARKER_CONFIGS).map(([type, config]) => {
            const data = summary[type as BiomarkerType];
            if (!data.latest) return null;

            const healthStatus = getHealthStatus(type as BiomarkerType, data.latest.value);

            return (
              <div key={type} className="health-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-sm font-medium">{config.name}</span>
                  </div>
                  {getTrendIcon(data.trend)}
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold">
                    {data.latest.value} {data.latest.unit}
                  </div>
                  {healthStatus.status && (
                    <div className={`text-xs ${healthStatus.color}`}>
                      {healthStatus.status}
                    </div>
                  )}
                  <div className="text-xs text-base-content/60">
                    {new Date(data.latest.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="label">
              <span className="label-text">Filter by Type</span>
            </label>
            <select
              className="select select-bordered select-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as BiomarkerType | 'all')}
            >
              <option value="all">All Types</option>
              {Object.entries(BIOMARKER_CONFIGS).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              <span className="label-text">Time Period</span>
            </label>
            <div className="join">
              <button
                className={`btn btn-sm join-item ${selectedTimeframe === 'week' ? 'btn-active' : ''}`}
                onClick={() => setSelectedTimeframe('week')}
              >
                Week
              </button>
              <button
                className={`btn btn-sm join-item ${selectedTimeframe === 'month' ? 'btn-active' : ''}`}
                onClick={() => setSelectedTimeframe('month')}
              >
                Month
              </button>
              <button
                className={`btn btn-sm join-item ${selectedTimeframe === 'year' ? 'btn-active' : ''}`}
                onClick={() => setSelectedTimeframe('year')}
              >
                Year
              </button>
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Entries</h2>
          
          {filteredBiomarkers.length === 0 ? (
            <div className="health-card p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-base-content/40" />
              <h3 className="text-lg font-semibold mb-2">No entries found</h3>
              <p className="text-base-content/60 mb-4">
                Start tracking your health metrics by adding your first biomarker entry.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBiomarkers.map((entry) => {
                const config = BIOMARKER_CONFIGS[entry.type];
                const healthStatus = getHealthStatus(entry.type, entry.value);

                return (
                  <div key={entry.id} className="health-card p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white text-sm`}>
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{config.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {entry.value} {entry.unit}
                            </span>
                            {healthStatus.status && (
                              <span className={`text-xs px-2 py-1 rounded-full bg-base-200 ${healthStatus.color}`}>
                                {healthStatus.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-base-content/60">
                            <Calendar className="w-3 h-3" />
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-base-content/70 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="btn btn-ghost btn-sm"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Entry Modal */}
        {showAddModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Add Biomarker Entry</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Biomarker Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={newEntry.type}
                    onChange={(e) => {
                      const type = e.target.value as BiomarkerType;
                      setNewEntry({
                        ...newEntry,
                        type,
                        unit: BIOMARKER_CONFIGS[type].unit,
                      });
                    }}
                  >
                    {Object.entries(BIOMARKER_CONFIGS).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.icon} {config.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Value</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newEntry.value}
                      onChange={(e) => setNewEntry({ ...newEntry, value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Unit</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={newEntry.unit}
                      onChange={(e) => setNewEntry({ ...newEntry, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Notes (optional)</span>
                  </label>
                  <textarea
                    placeholder="Any additional notes about this measurement..."
                    className="textarea textarea-bordered w-full"
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  className="btn btn-primary"
                  disabled={!newEntry.value}
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 