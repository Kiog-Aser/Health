import { databaseService } from './database';

export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  lastPerformed?: number; // timestamp
  bestSets: {
    weight: number;
    reps: number;
    timestamp: number;
  }[];
  recentSets: {
    weight: number;
    reps: number;
    timestamp: number;
    workoutId: string;
  }[];
  personalRecords: {
    maxWeight: { weight: number; reps: number; timestamp: number };
    maxReps: { weight: number; reps: number; timestamp: number };
    maxVolume: { weight: number; reps: number; timestamp: number; volume: number };
  };
}

class WorkoutHistoryService {
  private historyKey = 'workout_exercise_history';

  async getExerciseHistory(exerciseId: string): Promise<ExerciseHistory | null> {
    try {
      const allHistory = await this.getAllExerciseHistory();
      return allHistory[exerciseId] || null;
    } catch (error) {
      console.error('Failed to get exercise history:', error);
      return null;
    }
  }

  async getAllExerciseHistory(): Promise<Record<string, ExerciseHistory>> {
    try {
      const stored = localStorage.getItem(this.historyKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get all exercise history:', error);
      return {};
    }
  }

  async updateExerciseHistory(
    exerciseId: string,
    exerciseName: string,
    sets: { weight: number; reps: number; isCompleted: boolean; isWarmup?: boolean }[],
    workoutId: string
  ): Promise<void> {
    try {
      const allHistory = await this.getAllExerciseHistory();
      const currentHistory = allHistory[exerciseId] || {
        exerciseId,
        exerciseName,
        bestSets: [],
        recentSets: [],
        personalRecords: {
          maxWeight: { weight: 0, reps: 0, timestamp: 0 },
          maxReps: { weight: 0, reps: 0, timestamp: 0 },
          maxVolume: { weight: 0, reps: 0, timestamp: 0, volume: 0 }
        }
      };

      const completedSets = sets.filter(set => set.isCompleted && !set.isWarmup);
      const timestamp = Date.now();

      // Update last performed
      currentHistory.lastPerformed = timestamp;

      // Add to recent sets (keep last 20)
      const newRecentSets = completedSets.map(set => ({
        weight: set.weight,
        reps: set.reps,
        timestamp,
        workoutId
      }));

      currentHistory.recentSets = [
        ...newRecentSets,
        ...currentHistory.recentSets
      ].slice(0, 20);

      // Update personal records
      completedSets.forEach(set => {
        const volume = set.weight * set.reps;

        // Max weight
        if (set.weight > currentHistory.personalRecords.maxWeight.weight) {
          currentHistory.personalRecords.maxWeight = {
            weight: set.weight,
            reps: set.reps,
            timestamp
          };
        }

        // Max reps (at same or higher weight)
        if (set.reps > currentHistory.personalRecords.maxReps.reps && 
            set.weight >= currentHistory.personalRecords.maxReps.weight) {
          currentHistory.personalRecords.maxReps = {
            weight: set.weight,
            reps: set.reps,
            timestamp
          };
        }

        // Max volume
        if (volume > currentHistory.personalRecords.maxVolume.volume) {
          currentHistory.personalRecords.maxVolume = {
            weight: set.weight,
            reps: set.reps,
            timestamp,
            volume
          };
        }
      });

      // Update best sets (top 5 by volume)
      const allSets = [...currentHistory.recentSets, ...newRecentSets]
        .map(set => ({ ...set, volume: set.weight * set.reps }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5)
        .map(({ workoutId, volume, ...set }) => set);

      currentHistory.bestSets = allSets;

      // Save updated history
      allHistory[exerciseId] = currentHistory;
      localStorage.setItem(this.historyKey, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Failed to update exercise history:', error);
    }
  }

  async getLastWorkoutSets(exerciseId: string): Promise<{ weight: number; reps: number }[]> {
    try {
      const history = await this.getExerciseHistory(exerciseId);
      if (!history || history.recentSets.length === 0) {
        return [];
      }

      // Group recent sets by workout and get the most recent workout
      const setsByWorkout = history.recentSets.reduce((acc, set) => {
        if (!acc[set.workoutId]) {
          acc[set.workoutId] = [];
        }
        acc[set.workoutId].push(set);
        return acc;
      }, {} as Record<string, typeof history.recentSets>);

      const workoutIds = Object.keys(setsByWorkout).sort();
      const lastWorkoutId = workoutIds[workoutIds.length - 1];
      
      return setsByWorkout[lastWorkoutId] || [];
    } catch (error) {
      console.error('Failed to get last workout sets:', error);
      return [];
    }
  }

  async getSuggestedSets(exerciseId: string): Promise<{ weight: number; reps: number }[]> {
    try {
      const lastSets = await this.getLastWorkoutSets(exerciseId);
      if (lastSets.length > 0) {
        return lastSets;
      }

      // If no previous sets, suggest from best sets
      const history = await this.getExerciseHistory(exerciseId);
      if (history && history.bestSets.length > 0) {
        return history.bestSets.slice(0, 3);
      }

      return [];
    } catch (error) {
      console.error('Failed to get suggested sets:', error);
      return [];
    }
  }

  async getPersonalRecords(exerciseId: string): Promise<ExerciseHistory['personalRecords'] | null> {
    try {
      const history = await this.getExerciseHistory(exerciseId);
      return history?.personalRecords || null;
    } catch (error) {
      console.error('Failed to get personal records:', error);
      return null;
    }
  }

  async clearExerciseHistory(exerciseId: string): Promise<void> {
    try {
      const allHistory = await this.getAllExerciseHistory();
      delete allHistory[exerciseId];
      localStorage.setItem(this.historyKey, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Failed to clear exercise history:', error);
    }
  }

  async exportHistory(): Promise<string> {
    try {
      const allHistory = await this.getAllExerciseHistory();
      return JSON.stringify(allHistory, null, 2);
    } catch (error) {
      console.error('Failed to export history:', error);
      return '{}';
    }
  }

  async importHistory(historyJson: string): Promise<boolean> {
    try {
      const history = JSON.parse(historyJson);
      localStorage.setItem(this.historyKey, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }
}

export const workoutHistoryService = new WorkoutHistoryService(); 