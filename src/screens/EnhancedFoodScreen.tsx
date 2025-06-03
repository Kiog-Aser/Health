import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  Image,
  Alert,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { RootStackParamList, FoodEntry, Goal } from '../types';

type FoodNavigationProp = StackNavigationProp<RootStackParamList>;

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

interface DietProfile {
  goal: 'cutting' | 'bulking' | 'maintaining';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
}

const EnhancedFoodScreen: React.FC = () => {
  const navigation = useNavigation<FoodNavigationProp>();
  const colorScheme = useColorScheme();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>({
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73,
    water: 2500,
  });
  const [dietProfile, setDietProfile] = useState<DietProfile>({
    goal: 'maintaining',
    activityLevel: 'moderately_active',
    weight: 75,
    height: 175,
    age: 25,
    gender: 'male',
  });
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  });
  const [weeklyStats, setWeeklyStats] = useState({
    avgCalories: 0,
    avgProtein: 0,
    daysOnTrack: 0,
    totalDeficit: 0,
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#1C1C1E' : '#F2F2F7',
    primary: isDark ? '#0A84FF' : '#007AFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6D6D70',
    accent: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    cardBackground: isDark ? '#2C2C2E' : '#FFFFFF',
    border: isDark ? '#38383A' : '#C6C6C8',
    success: '#34C759',
    progressBg: isDark ? '#48484A' : '#E5E5EA',
  };

  useEffect(() => {
    loadFoodData();
    calculateNutritionGoals();
  }, []);

  useEffect(() => {
    calculateDailyTotals();
    calculateWeeklyStats();
  }, [foodEntries]);

  const loadFoodData = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();

      const entries = await databaseService.getFoodEntries(startOfDay, endOfDay);
      setFoodEntries(entries);
    } catch (error) {
      console.error('Failed to load food entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNutritionGoals = () => {
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (dietProfile.gender === 'male') {
      bmr = 10 * dietProfile.weight + 6.25 * dietProfile.height - 5 * dietProfile.age + 5;
    } else {
      bmr = 10 * dietProfile.weight + 6.25 * dietProfile.height - 5 * dietProfile.age - 161;
    }

    // Apply activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
    };

    let tdee = bmr * activityMultipliers[dietProfile.activityLevel];

    // Adjust for goal
    switch (dietProfile.goal) {
      case 'cutting':
        tdee *= 0.8; // 20% deficit
        break;
      case 'bulking':
        tdee *= 1.15; // 15% surplus
        break;
      case 'maintaining':
        // No change
        break;
    }

    // Calculate macros
    const protein = dietProfile.weight * 2.2; // 2.2g per kg
    const fat = (tdee * 0.25) / 9; // 25% of calories from fat
    const carbs = (tdee - (protein * 4) - (fat * 9)) / 4; // Remaining calories from carbs

    setNutritionGoals({
      calories: Math.round(tdee),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      water: dietProfile.weight * 35, // 35ml per kg
    });
  };

  const calculateDailyTotals = () => {
    const totals = foodEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
        fiber: acc.fiber + entry.fiber,
        sugar: acc.sugar + entry.sugar,
        sodium: acc.sodium + entry.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
    setDailyTotals(totals);
  };

  const calculateWeeklyStats = () => {
    // Mock calculations for now
    setWeeklyStats({
      avgCalories: 2180,
      avgProtein: 145,
      daysOnTrack: 5,
      totalDeficit: -1400,
    });
  };

  const deleteFoodEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteFoodEntry(entryId);
              setFoodEntries(entries => entries.filter(entry => entry.id !== entryId));
            } catch (error) {
              console.error('Failed to delete food entry:', error);
              Alert.alert('Error', 'Failed to delete food entry');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerTop}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nutrition</Text>
        <TouchableOpacity onPress={() => setShowGoalModal(true)} style={styles.goalButton}>
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.timeSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            onPress={() => setSelectedTimeframe(period)}
            style={[
              styles.timePeriod,
              selectedTimeframe === period && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.timePeriodText,
              { color: selectedTimeframe === period ? 'white' : colors.textSecondary }
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('FoodCamera')}
      >
        <Ionicons name="camera" size={24} color="white" />
        <Text style={styles.actionButtonText}>Scan Food</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('AddFood', {})}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.actionButtonText}>Add Manually</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNutritionOverview = () => {
    const caloriesProgress = dailyTotals.calories / nutritionGoals.calories;
    const proteinProgress = dailyTotals.protein / nutritionGoals.protein;
    const carbsProgress = dailyTotals.carbs / nutritionGoals.carbs;
    const fatProgress = dailyTotals.fat / nutritionGoals.fat;
    const remainingCalories = nutritionGoals.calories - dailyTotals.calories;

    return (
      <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.caloriesSection}>
          <View style={styles.caloriesHeader}>
            <Text style={[styles.caloriesRemaining, { color: colors.text }]}>
              {Math.max(0, remainingCalories)}
            </Text>
            <Text style={[styles.caloriesLabel, { color: colors.textSecondary }]}>
              Calories Remaining
            </Text>
          </View>
          
          <View style={styles.caloriesBreakdown}>
            <View style={styles.caloriesItem}>
              <Text style={[styles.caloriesValue, { color: colors.text }]}>
                {nutritionGoals.calories}
              </Text>
              <Text style={[styles.caloriesItemLabel, { color: colors.textSecondary }]}>
                Goal
              </Text>
            </View>
            <Text style={[styles.caloriesMinus, { color: colors.textSecondary }]}>-</Text>
            <View style={styles.caloriesItem}>
              <Text style={[styles.caloriesValue, { color: colors.text }]}>
                {dailyTotals.calories}
              </Text>
              <Text style={[styles.caloriesItemLabel, { color: colors.textSecondary }]}>
                Food
              </Text>
            </View>
            <Text style={[styles.caloriesMinus, { color: colors.textSecondary }]}>+</Text>
            <View style={styles.caloriesItem}>
              <Text style={[styles.caloriesValue, { color: colors.text }]}>
                0
              </Text>
              <Text style={[styles.caloriesItemLabel, { color: colors.textSecondary }]}>
                Exercise
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.macrosGrid}>
          <View style={styles.macroItem}>
            <View style={[styles.macroProgress, { backgroundColor: colors.progressBg }]}>
              <View
                style={[
                  styles.macroProgressFill,
                  { width: `${Math.min(carbsProgress * 100, 100)}%`, backgroundColor: '#667eea' }
                ]}
              />
            </View>
            <Text style={[styles.macroValue, { color: colors.text }]}>
              {Math.round(dailyTotals.carbs)}/{nutritionGoals.carbs}g
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
          </View>

          <View style={styles.macroItem}>
            <View style={[styles.macroProgress, { backgroundColor: colors.progressBg }]}>
              <View
                style={[
                  styles.macroProgressFill,
                  { width: `${Math.min(fatProgress * 100, 100)}%`, backgroundColor: '#f093fb' }
                ]}
              />
            </View>
            <Text style={[styles.macroValue, { color: colors.text }]}>
              {Math.round(dailyTotals.fat)}/{nutritionGoals.fat}g
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fat</Text>
          </View>

          <View style={styles.macroItem}>
            <View style={[styles.macroProgress, { backgroundColor: colors.progressBg }]}>
              <View
                style={[
                  styles.macroProgressFill,
                  { width: `${Math.min(proteinProgress * 100, 100)}%`, backgroundColor: '#4ECDC4' }
                ]}
              />
            </View>
            <Text style={[styles.macroValue, { color: colors.text }]}>
              {Math.round(dailyTotals.protein)}/{nutritionGoals.protein}g
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderInsights = () => (
    <View style={[styles.insightsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
      
      <View style={styles.insightsList}>
        <View style={styles.insightItem}>
          <View style={[styles.insightIcon, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="trending-up" size={16} color={colors.accent} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              Protein Goal Achieved
            </Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              You're hitting your protein targets consistently
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View style={[styles.insightIcon, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="water" size={16} color={colors.warning} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              Increase Water Intake
            </Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              Aim for 8-10 glasses per day for better hydration
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View style={[styles.insightIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="time" size={16} color={colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              Meal Timing
            </Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              Consider eating earlier to optimize metabolism
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFoodEntry = ({ item }: { item: FoodEntry }) => (
    <View style={[styles.foodEntryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.foodEntryHeader}>
        {item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.foodImage} />
        )}
        <View style={styles.foodEntryInfo}>
          <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.mealType, { color: colors.textSecondary }]}>
            {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {new Date(item.timestamp).toLocaleTimeString('en', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </Text>
        </View>
        <View style={styles.foodEntryActions}>
          <View style={styles.foodEntryStats}>
            <Text style={[styles.calorieValue, { color: colors.text }]}>{item.calories}</Text>
            <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>cal</Text>
          </View>
          <TouchableOpacity
            onPress={() => deleteFoodEntry(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {item.confidence && item.confidence < 0.8 && (
        <View style={[styles.confidenceWarning, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={[styles.confidenceText, { color: colors.warning }]}>
            AI estimate - please verify accuracy
          </Text>
        </View>
      )}

      <View style={styles.macroBreakdown}>
        <View style={styles.macroBreakdownItem}>
          <Text style={[styles.macroBreakdownValue, { color: colors.text }]}>
            {Math.round(item.protein)}g
          </Text>
          <Text style={[styles.macroBreakdownLabel, { color: colors.textSecondary }]}>
            Protein
          </Text>
        </View>
        <View style={styles.macroBreakdownItem}>
          <Text style={[styles.macroBreakdownValue, { color: colors.text }]}>
            {Math.round(item.carbs)}g
          </Text>
          <Text style={[styles.macroBreakdownLabel, { color: colors.textSecondary }]}>
            Carbs
          </Text>
        </View>
        <View style={styles.macroBreakdownItem}>
          <Text style={[styles.macroBreakdownValue, { color: colors.text }]}>
            {Math.round(item.fat)}g
          </Text>
          <Text style={[styles.macroBreakdownLabel, { color: colors.textSecondary }]}>
            Fat
          </Text>
        </View>
        <View style={styles.macroBreakdownItem}>
          <Text style={[styles.macroBreakdownValue, { color: colors.text }]}>
            {Math.round(item.fiber)}g
          </Text>
          <Text style={[styles.macroBreakdownLabel, { color: colors.textSecondary }]}>
            Fiber
          </Text>
        </View>
      </View>
    </View>
  );

  const renderGoalModal = () => (
    <Modal
      visible={showGoalModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowGoalModal(false)}>
            <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Nutrition Goals</Text>
          <TouchableOpacity onPress={() => setShowGoalModal(false)}>
            <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.goalSection}>
            <Text style={[styles.goalSectionTitle, { color: colors.text }]}>Diet Goal</Text>
            <View style={styles.goalOptions}>
              {(['cutting', 'maintaining', 'bulking'] as const).map((goal) => (
                <TouchableOpacity
                  key={goal}
                  onPress={() => setDietProfile(prev => ({ ...prev, goal }))}
                  style={[
                    styles.goalOption,
                    { 
                      backgroundColor: dietProfile.goal === goal ? colors.primary : colors.surface,
                      borderColor: colors.border 
                    }
                  ]}
                >
                  <Text style={[
                    styles.goalOptionText,
                    { color: dietProfile.goal === goal ? 'white' : colors.text }
                  ]}>
                    {goal.charAt(0).toUpperCase() + goal.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.goalSection}>
            <Text style={[styles.goalSectionTitle, { color: colors.text }]}>Current Goals</Text>
            <View style={styles.goalInputs}>
              <View style={styles.goalInput}>
                <Text style={[styles.goalInputLabel, { color: colors.textSecondary }]}>
                  Calories
                </Text>
                <TextInput
                  style={[styles.goalInputField, { 
                    backgroundColor: colors.surface, 
                    color: colors.text,
                    borderColor: colors.border 
                  }]}
                  value={nutritionGoals.calories.toString()}
                  onChangeText={(value) => setNutritionGoals(prev => ({ 
                    ...prev, 
                    calories: parseInt(value) || 0 
                  }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.goalInput}>
                <Text style={[styles.goalInputLabel, { color: colors.textSecondary }]}>
                  Protein (g)
                </Text>
                <TextInput
                  style={[styles.goalInputField, { 
                    backgroundColor: colors.surface, 
                    color: colors.text,
                    borderColor: colors.border 
                  }]}
                  value={nutritionGoals.protein.toString()}
                  onChangeText={(value) => setNutritionGoals(prev => ({ 
                    ...prev, 
                    protein: parseInt(value) || 0 
                  }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.goalInput}>
                <Text style={[styles.goalInputLabel, { color: colors.textSecondary }]}>
                  Carbs (g)
                </Text>
                <TextInput
                  style={[styles.goalInputField, { 
                    backgroundColor: colors.surface, 
                    color: colors.text,
                    borderColor: colors.border 
                  }]}
                  value={nutritionGoals.carbs.toString()}
                  onChangeText={(value) => setNutritionGoals(prev => ({ 
                    ...prev, 
                    carbs: parseInt(value) || 0 
                  }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.goalInput}>
                <Text style={[styles.goalInputLabel, { color: colors.textSecondary }]}>
                  Fat (g)
                </Text>
                <TextInput
                  style={[styles.goalInputField, { 
                    backgroundColor: colors.surface, 
                    color: colors.text,
                    borderColor: colors.border 
                  }]}
                  value={nutritionGoals.fat.toString()}
                  onChangeText={(value) => setNutritionGoals(prev => ({ 
                    ...prev, 
                    fat: parseInt(value) || 0 
                  }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="restaurant" size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading your nutrition data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {renderHeader()}
      {renderQuickActions()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderNutritionOverview()}
        {renderInsights()}
        
        <View style={styles.entriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Meals</Text>
          
          {foodEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No meals logged today
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Start by scanning or adding your first meal!
              </Text>
            </View>
          ) : (
            <FlatList
              data={foodEntries}
              renderItem={renderFoodEntry}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {renderGoalModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  goalButton: {
    padding: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    borderRadius: 8,
    padding: 2,
  },
  timePeriod: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timePeriodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  caloriesSection: {
    marginBottom: 24,
  },
  caloriesHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesRemaining: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  caloriesLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  caloriesBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  caloriesItem: {
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  caloriesItemLabel: {
    fontSize: 12,
  },
  caloriesMinus: {
    fontSize: 18,
    fontWeight: '600',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  macroProgress: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
  },
  insightsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  entriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  foodEntryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  foodEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  foodEntryInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  foodEntryActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  foodEntryStats: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  calorieLabel: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  confidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  macroBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroBreakdownItem: {
    alignItems: 'center',
  },
  macroBreakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroBreakdownLabel: {
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalSection: {
    marginTop: 24,
  },
  goalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  goalOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  goalOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  goalInputs: {
    gap: 16,
  },
  goalInput: {
    gap: 8,
  },
  goalInputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalInputField: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
});

export default EnhancedFoodScreen; 