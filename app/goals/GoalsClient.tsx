'use client';

import { useState, useEffect } from 'react';
import { Plus, Target, Calendar, TrendingUp, Award, Edit, Trash2, CheckCircle } from 'lucide-react';
import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { Goal, Milestone } from '../types';
import AppLayout from '../components/layout/AppLayout';

export default function GoalsClient() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'active' | 'completed'>('all');

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'weight_loss' as Goal['type'],
    targetValue: 0,
    currentValue: 0,
    unit: 'kg',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();
      const goalsData = await databaseService.getGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.targetValue) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: newGoal.currentValue,
      unit: newGoal.unit,
      targetDate: new Date(newGoal.targetDate).getTime(),
      createdAt: Date.now(),
      isCompleted: false,
      milestones: generateMilestones(newGoal.currentValue, newGoal.targetValue, newGoal.unit),
    };

    try {
      await databaseService.addGoal(goal);
      setGoals([goal, ...goals]);
      setShowAddModal(false);
      resetNewGoal();
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    try {
      await databaseService.updateGoal(updatedGoal);
      setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await databaseService.deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const updatedGoal = { ...goal, isCompleted: true };
      await handleUpdateGoal(updatedGoal);
    }
  };

  const generateMilestones = (start: number, target: number, unit: string): Milestone[] => {
    const diff = Math.abs(target - start);
    const milestones: Milestone[] = [];
    
    if (diff > 0) {
      const step = diff / 4; // Create 4 milestones
      for (let i = 1; i <= 4; i++) {
        const value = start + (start < target ? step * i : -step * i);
        milestones.push({
          id: `milestone-${i}`,
          title: `${Math.round(value * 10) / 10}${unit}`,
          targetValue: Math.round(value * 10) / 10,
          isCompleted: false,
        });
      }
    }
    
    return milestones;
  };

  const resetNewGoal = () => {
    setNewGoal({
      title: '',
      description: '',
      type: 'weight_loss',
      targetValue: 0,
      currentValue: 0,
      unit: 'kg',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const getGoalProgress = (goal: Goal): number => {
    return HealthCalculations.calculateGoalProgress(goal.currentValue, goal.targetValue, 0);
  };

  const getFilteredGoals = (): Goal[] => {
    switch (selectedCategory) {
      case 'active':
        return goals.filter(g => !g.isCompleted);
      case 'completed':
        return goals.filter(g => g.isCompleted);
      default:
        return goals;
    }
  };

  const getGoalTypeIcon = (type: Goal['type']) => {
    switch (type) {
      case 'weight_loss':
      case 'weight_gain':
        return '⚖️';
      case 'muscle_gain':
        return '💪';
      case 'fitness':
        return '🏃‍♂️';
      case 'biomarker':
        return '🩺';
      default:
        return '🎯';
    }
  };

  const getGoalTypeLabel = (type: Goal['type']) => {
    switch (type) {
      case 'weight_loss':
        return 'Weight Loss';
      case 'weight_gain':
        return 'Weight Gain';
      case 'muscle_gain':
        return 'Muscle Gain';
      case 'fitness':
        return 'Fitness';
      case 'biomarker':
        return 'Health Metric';
      default:
        return 'Custom';
    }
  };

  const getDaysRemaining = (targetDate: number): number => {
    return Math.ceil((targetDate - Date.now()) / (24 * 60 * 60 * 1000));
  };

  if (isLoading) {
    return (
      <AppLayout title="🎯 Goals">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="🎯 Goals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your Goals</h1>
            <p className="text-base-content/60">Track your fitness and health objectives</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${selectedCategory === 'all' ? 'tab-active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Goals
          </button>
          <button
            className={`tab ${selectedCategory === 'active' ? 'tab-active' : ''}`}
            onClick={() => setSelectedCategory('active')}
          >
            Active
          </button>
          <button
            className={`tab ${selectedCategory === 'completed' ? 'tab-active' : ''}`}
            onClick={() => setSelectedCategory('completed')}
          >
            Completed
          </button>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {getFilteredGoals().length === 0 ? (
            <div className="health-card p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-base-content/40" />
              <h3 className="text-lg font-semibold mb-2">No goals found</h3>
              <p className="text-base-content/60 mb-4">
                {selectedCategory === 'all' 
                  ? "Start by creating your first health or fitness goal."
                  : `No ${selectedCategory} goals found.`
                }
              </p>
              {selectedCategory === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Goal
                </button>
              )}
            </div>
          ) : (
            getFilteredGoals().map((goal) => (
              <div key={goal.id} className="health-card p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getGoalTypeIcon(goal.type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold">{goal.title}</h3>
                        <p className="text-sm text-base-content/60">{getGoalTypeLabel(goal.type)}</p>
                      </div>
                      {goal.isCompleted && (
                        <div className="badge badge-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </div>
                      )}
                    </div>

                    {goal.description && (
                      <p className="text-base-content/70 mb-4">{goal.description}</p>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-base-content/60">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            goal.isCompleted ? 'bg-success' : 'bg-primary'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.max(0, getGoalProgress(goal)))}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-base-content/60 mt-1">
                        {getGoalProgress(goal)}% complete
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center gap-4 text-sm text-base-content/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {getDaysRemaining(goal.targetDate)} days remaining
                      </div>
                    </div>

                    {/* Milestones */}
                    {goal.milestones && goal.milestones.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Milestones</p>
                        <div className="flex gap-2 flex-wrap">
                          {goal.milestones.map((milestone) => (
                            <div
                              key={milestone.id}
                              className={`badge ${
                                milestone.isCompleted ? 'badge-success' : 'badge-outline'
                              }`}
                            >
                              {milestone.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!goal.isCompleted && (
                      <button
                        onClick={() => handleCompleteGoal(goal.id)}
                        className="btn btn-success btn-sm"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="btn btn-ghost btn-sm"
                      title="Edit goal"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="btn btn-error btn-sm"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Goal Modal */}
        {showAddModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Create New Goal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Goal Title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Lose 5kg in 3 months"
                    className="input input-bordered w-full"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Description (optional)</span>
                  </label>
                  <textarea
                    placeholder="Describe your goal and motivation..."
                    className="textarea textarea-bordered w-full"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Goal Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as Goal['type'] })}
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="weight_gain">Weight Gain</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="fitness">Fitness</option>
                    <option value="biomarker">Health Metric</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Current Value</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newGoal.currentValue}
                      onChange={(e) => setNewGoal({ ...newGoal, currentValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Target Value</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input input-bordered w-full"
                      value={newGoal.targetValue}
                      onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Unit</span>
                    </label>
                    <input
                      type="text"
                      placeholder="kg, lbs, minutes, etc."
                      className="input input-bordered w-full"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Target Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    />
                  </div>
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
                  onClick={handleAddGoal}
                  className="btn btn-primary"
                  disabled={!newGoal.title || !newGoal.targetValue}
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 