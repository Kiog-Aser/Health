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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { databaseService } from '../services/database';
import { HealthCalculations } from '../utils/healthCalculations';
import { RootStackParamList, FoodEntry } from '../types';

type FoodNavigationProp = StackNavigationProp<RootStackParamList>;

const FoodScreen: React.FC = () => {
  const navigation = useNavigation<FoodNavigationProp>();
  const colorScheme = useColorScheme();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
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
  };

  useEffect(() => {
    loadTodayFoodEntries();
  }, []);

  const loadTodayFoodEntries = async () => {
    try {
      setIsLoading(true);
      await databaseService.init();

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();

      const entries = await databaseService.getFoodEntries(startOfDay, endOfDay);
      setFoodEntries(entries);

      // Calculate daily totals
      const totals = entries.reduce(
        (acc, entry) => ({
          calories: acc.calories + entry.calories,
          protein: acc.protein + entry.protein,
          carbs: acc.carbs + entry.carbs,
          fat: acc.fat + entry.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setDailyTotals(totals);
    } catch (error) {
      console.error('Failed to load food entries:', error);
    } finally {
      setIsLoading(false);
    }
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
              
              // Recalculate daily totals after deletion
              const updatedEntries = foodEntries.filter(entry => entry.id !== entryId);
              const totals = updatedEntries.reduce(
                (acc, entry) => ({
                  calories: acc.calories + entry.calories,
                  protein: acc.protein + entry.protein,
                  carbs: acc.carbs + entry.carbs,
                  fat: acc.fat + entry.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              );
              setDailyTotals(totals);
            } catch (error) {
              console.error('Failed to delete food entry:', error);
              Alert.alert('Error', 'Failed to delete food entry');
            }
          },
        },
      ]
    );
  };

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

  const renderNutritionSummary = () => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Nutrition</Text>
      
      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>{dailyTotals.calories}</Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Calories</Text>
          <View style={[styles.nutritionBar, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.nutritionBarFill,
                { width: `${Math.min((dailyTotals.calories / 2000) * 100, 100)}%`, backgroundColor: '#FF6B35' }
              ]}
            />
          </View>
        </View>

        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>{Math.round(dailyTotals.protein)}g</Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Protein</Text>
          <View style={[styles.nutritionBar, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.nutritionBarFill,
                { width: `${Math.min((dailyTotals.protein / 150) * 100, 100)}%`, backgroundColor: '#4ECDC4' }
              ]}
            />
          </View>
        </View>

        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>{Math.round(dailyTotals.carbs)}g</Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Carbs</Text>
          <View style={[styles.nutritionBar, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.nutritionBarFill,
                { width: `${Math.min((dailyTotals.carbs / 250) * 100, 100)}%`, backgroundColor: '#667eea' }
              ]}
            />
          </View>
        </View>

        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>{Math.round(dailyTotals.fat)}g</Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Fat</Text>
          <View style={[styles.nutritionBar, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.nutritionBarFill,
                { width: `${Math.min((dailyTotals.fat / 65) * 100, 100)}%`, backgroundColor: '#f093fb' }
              ]}
            />
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
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(item.protein)}g</Text>
          <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(item.carbs)}g</Text>
          <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(item.fat)}g</Text>
          <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fat</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(item.fiber)}g</Text>
          <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fiber</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="restaurant" size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading your food entries...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderQuickActions()}
      {renderNutritionSummary()}
      
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
          />
        )}
      </View>
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
  quickActionsContainer: {
    flexDirection: 'row',
    padding: 20,
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
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  nutritionBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  nutritionBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  entriesSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
  },
});

export default FoodScreen; 