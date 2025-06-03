import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Temporarily removing Victory Native charts until proper setup
// import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis } from 'victory-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { databaseService } from '../services/database';
import { geminiService } from '../services/geminiService';
import { HealthCalculations } from '../utils/healthCalculations';
import { RootStackParamList, DailyStats, FoodEntry, UserProfile, AIInsight, BiomarkerEntry } from '../types';

type DashboardNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface DashboardData {
  todayStats: DailyStats | null;
  weeklyCalories: { day: string; consumed: number; burned: number }[];
  recentInsights: AIInsight[];
  currentWeight: number;
  goalProgress: number;
  healthScore: number;
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayStats: null,
    weeklyCalories: [],
    recentInsights: [],
    currentWeight: 0,
    goalProgress: 0,
    healthScore: 75,
  });

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
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Initialize database if needed
      await databaseService.init();

      const today = HealthCalculations.formatDate(new Date());
      const todayStats = await databaseService.getDailyStats(today);

      // Get weekly calorie data
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = HealthCalculations.formatDate(date);
        const stats = await databaseService.getDailyStats(dateStr);
        
        weeklyData.push({
          day: date.toLocaleDateString('en', { weekday: 'short' }),
          consumed: stats?.calories.consumed || 0,
          burned: stats?.calories.burned || 0,
        });
      }

      // Get recent AI insights
      const insights = await databaseService.getAIInsights();
      const recentInsights = insights.slice(0, 3);

      // Get current weight (latest biomarker entry)
      const weightEntries = await databaseService.getBiomarkerEntries('weight');
      const currentWeight = weightEntries.length > 0 ? weightEntries[0].value : 70;

      // Calculate health score
      const recentFoodEntries = await databaseService.getFoodEntries(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
        Date.now()
      );
      
      const nutritionScore = HealthCalculations.calculateNutritionScore(recentFoodEntries, 2000);
      const sleepScore = HealthCalculations.calculateSleepScore(todayStats?.sleepHours || 7);
      const healthScore = HealthCalculations.calculateHealthScore(
        nutritionScore,
        sleepScore,
        todayStats?.workoutMinutes || 0
      );

      setDashboardData({
        todayStats,
        weeklyCalories: weeklyData,
        recentInsights,
        currentWeight,
        goalProgress: 65, // This would be calculated from actual goals
        healthScore,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => navigation.navigate('FoodCamera')}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="camera" size={24} color="white" />
          </LinearGradient>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Scan Food</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => navigation.navigate('WorkoutLog', {})}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="fitness" size={24} color="white" />
          </LinearGradient>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Log Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Biomarkers')}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="pulse" size={24} color="white" />
          </LinearGradient>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Add Biomarker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Goals')}
        >
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="flag" size={24} color="white" />
          </LinearGradient>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Goals</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTodayOverview = () => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Overview</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FF6B35' }]}>
            <Ionicons name="flame" size={20} color="white" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {dashboardData.todayStats?.calories.consumed || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#4ECDC4' }]}>
            <Ionicons name="fitness" size={20} color="white" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {dashboardData.todayStats?.workoutMinutes || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#667eea' }]}>
            <Ionicons name="water" size={20} color="white" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {dashboardData.todayStats?.water || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Liters</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#f093fb' }]}>
            <Ionicons name="walk" size={20} color="white" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {(dashboardData.todayStats?.steps || 0).toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Steps</Text>
        </View>
      </View>
    </View>
  );

  const renderHealthScore = () => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Health Score</Text>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(dashboardData.healthScore) }]}>
          <Text style={styles.scoreText}>{dashboardData.healthScore}</Text>
        </View>
      </View>
      
      <View style={styles.scoreDescription}>
        <Text style={[styles.scoreDescriptionText, { color: colors.textSecondary }]}>
          {getScoreDescription(dashboardData.healthScore)}
        </Text>
      </View>

      <View style={styles.scoreBreakdown}>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreItemLabel, { color: colors.textSecondary }]}>Nutrition</Text>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                { width: '75%', backgroundColor: colors.accent }
              ]}
            />
          </View>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreItemLabel, { color: colors.textSecondary }]}>Activity</Text>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                { width: '60%', backgroundColor: colors.primary }
              ]}
            />
          </View>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreItemLabel, { color: colors.textSecondary }]}>Sleep</Text>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                { width: '85%', backgroundColor: '#667eea' }
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderWeeklyChart = () => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Calories</Text>
      
      <View style={styles.chartContainer}>
        {/* VictoryChart component is temporarily removed */}
      </View>
    </View>
  );

  const renderAIInsights = () => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>AI Insights</Text>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
      </View>

      {dashboardData.recentInsights.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bulb-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Keep tracking your health data to receive personalized insights!
          </Text>
        </View>
      ) : (
        dashboardData.recentInsights.map((insight, index) => (
          <View key={insight.id} style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: getInsightColor(insight.type) }]}>
              <Ionicons name={getInsightIcon(insight.type)} size={16} color="white" />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
              <Text style={[styles.insightMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                {insight.message}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.accent;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  const getScoreDescription = (score: number): string => {
    if (score >= 80) return 'Excellent! Keep up the great work.';
    if (score >= 60) return 'Good progress, room for improvement.';
    return 'Focus on building healthier habits.';
  };

  const getInsightColor = (type: string): string => {
    switch (type) {
      case 'achievement': return colors.accent;
      case 'warning': return colors.warning;
      case 'recommendation': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getInsightIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'achievement': return 'trophy';
      case 'warning': return 'warning';
      case 'recommendation': return 'bulb';
      default: return 'information-circle';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="medical" size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading your health data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {renderQuickActions()}
      {renderTodayOverview()}
      {renderHealthScore()}
      {renderWeeklyChart()}
      {renderAIInsights()}
      
      <View style={{ height: 20 }} />
    </ScrollView>
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    width: (width - 60) / 2,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    width: '22%',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreDescription: {
    marginBottom: 16,
  },
  scoreDescriptionText: {
    fontSize: 14,
    fontWeight: '400',
  },
  scoreBreakdown: {
    gap: 12,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginLeft: 12,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartContainer: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});

export default DashboardScreen; 