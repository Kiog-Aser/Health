import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  SegmentedButtons,
  Surface,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CartesianChart, Line, Area, Bar } from 'victory-native';
import { HealthReport, DailyStats } from '../types';

const { width } = Dimensions.get('window');

interface ReportsScreenProps {}

const ReportsScreen: React.FC<ReportsScreenProps> = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [reportPeriod, setReportPeriod] = useState('week');
  const [currentReport, setCurrentReport] = useState<HealthReport | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('calories');

  const theme = {
    colors: isDark ? {
      background: '#121212',
      surface: '#1E1E1E',
      primary: '#BB86FC',
      text: '#FFFFFF',
      textSecondary: '#B3B3B3',
      border: '#333333',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      chart: '#FFFFFF',
    } : {
      background: '#F5F5F5',
      surface: '#FFFFFF',
      primary: '#6200EE',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      chart: '#000000',
    }
  };

  useEffect(() => {
    loadReportData();
  }, [reportPeriod]);

  const loadReportData = async () => {
    // Generate mock data for the report
    const endDate = Date.now();
    const startDate = reportPeriod === 'week' 
      ? endDate - 7 * 24 * 60 * 60 * 1000
      : reportPeriod === 'month'
      ? endDate - 30 * 24 * 60 * 60 * 1000
      : endDate - 90 * 24 * 60 * 60 * 1000;

    // Mock daily stats
    const days = reportPeriod === 'week' ? 7 : reportPeriod === 'month' ? 30 : 90;
    const mockDailyStats: DailyStats[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate - i * 24 * 60 * 60 * 1000);
      mockDailyStats.push({
        date: date.toISOString().split('T')[0],
        calories: {
          consumed: Math.floor(Math.random() * 500) + 1800,
          burned: Math.floor(Math.random() * 400) + 200,
          target: 2000,
        },
        macros: {
          protein: Math.floor(Math.random() * 50) + 80,
          carbs: Math.floor(Math.random() * 100) + 200,
          fat: Math.floor(Math.random() * 30) + 60,
          fiber: Math.floor(Math.random() * 10) + 20,
        },
        water: Math.floor(Math.random() * 1000) + 2000, // ml
        steps: Math.floor(Math.random() * 5000) + 5000,
        workoutMinutes: Math.floor(Math.random() * 60) + 30,
        sleepHours: Math.random() * 2 + 7,
      });
    }

    setDailyStats(mockDailyStats);

    // Mock report summary
    const totalCaloriesConsumed = mockDailyStats.reduce((sum, day) => sum + day.calories.consumed, 0);
    const totalCaloriesBurned = mockDailyStats.reduce((sum, day) => sum + day.calories.burned, 0);
    const totalWorkouts = mockDailyStats.filter(day => day.workoutMinutes > 0).length;
    const avgWorkoutDuration = totalWorkouts > 0 
      ? mockDailyStats.reduce((sum, day) => sum + day.workoutMinutes, 0) / totalWorkouts 
      : 0;

    const mockReport: HealthReport = {
      id: Date.now().toString(),
      type: reportPeriod === 'week' ? 'weekly' : reportPeriod === 'month' ? 'monthly' : 'custom',
      startDate,
      endDate,
      summary: {
        totalCalories: totalCaloriesConsumed,
        avgCalories: Math.round(totalCaloriesConsumed / days),
        totalWorkouts,
        avgWorkoutDuration: Math.round(avgWorkoutDuration),
        weightChange: -1.2, // kg
        achievements: [
          '🏃‍♂️ Completed 5 workouts this week',
          '💧 Met daily water goal 6 days',
          '📈 Increased average steps by 15%',
        ],
        improvements: [
          'Consistency in workout schedule',
          'Better hydration habits',
          'Improved sleep quality',
        ],
        recommendations: [
          'Try increasing protein intake by 20g daily',
          'Add 2 more rest days between intense workouts',
          'Consider meditation for better sleep',
        ],
      },
      generatedAt: Date.now(),
    };

    setCurrentReport(mockReport);
  };

  const getChartData = () => {
    if (!dailyStats.length) return [];

    switch (selectedMetric) {
      case 'calories':
        return dailyStats.map((day, index) => ({
          day: index + 1,
          value: day.calories.consumed,
        }));
      case 'weight':
        return dailyStats.map((day, index) => ({
          day: index + 1,
          value: 75 + (Math.random() - 0.5) * 2, // Mock weight data
        }));
      case 'steps':
        return dailyStats.map((day, index) => ({
          day: index + 1,
          value: day.steps,
        }));
      case 'sleep':
        return dailyStats.map((day, index) => ({
          day: index + 1,
          value: day.sleepHours,
        }));
      default:
        return [];
    }
  };

  const getMacroData = () => {
    if (!dailyStats.length) return null;
    
    const avgMacros = dailyStats.reduce(
      (acc, day) => ({
        protein: acc.protein + day.macros.protein,
        carbs: acc.carbs + day.macros.carbs,
        fat: acc.fat + day.macros.fat,
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );

    const days = dailyStats.length;
    return {
      protein: Math.round(avgMacros.protein / days),
      carbs: Math.round(avgMacros.carbs / days),
      fat: Math.round(avgMacros.fat / days),
    };
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'calories': return '🔥';
      case 'weight': return '⚖️';
      case 'steps': return '👣';
      case 'sleep': return '😴';
      default: return '📊';
    }
  };

  const formatMetricValue = (value: number, metric: string) => {
    switch (metric) {
      case 'calories': return `${Math.round(value)} cal`;
      case 'weight': return `${value.toFixed(1)} kg`;
      case 'steps': return `${Math.round(value).toLocaleString()}`;
      case 'sleep': return `${value.toFixed(1)}h`;
      default: return value.toString();
    }
  };

  const renderSummaryCard = () => {
    if (!currentReport) return null;

    return (
      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
            📊 {reportPeriod === 'week' ? 'Weekly' : reportPeriod === 'month' ? 'Monthly' : 'Quarterly'} Summary
          </Title>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Avg Calories
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {currentReport.summary.avgCalories}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Workouts
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {currentReport.summary.totalWorkouts}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Avg Workout
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {currentReport.summary.avgWorkoutDuration}m
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Weight Change
              </Text>
              <Text style={[styles.summaryValue, { 
                color: currentReport.summary.weightChange < 0 ? theme.colors.success : theme.colors.error 
              }]}>
                {currentReport.summary.weightChange > 0 ? '+' : ''}{currentReport.summary.weightChange} kg
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderChart = () => {
    const chartData = getChartData();
    if (!chartData.length) return null;

    return (
      <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
              {getMetricIcon(selectedMetric)} {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend
            </Title>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.metricButtons}>
              {['calories', 'weight', 'steps', 'sleep'].map((metric) => (
                <Chip
                  key={metric}
                  selected={selectedMetric === metric}
                  onPress={() => setSelectedMetric(metric)}
                  style={[
                    styles.metricChip,
                    { backgroundColor: selectedMetric === metric ? theme.colors.primary : theme.colors.border }
                  ]}
                  textStyle={{ 
                    color: selectedMetric === metric ? '#FFFFFF' : theme.colors.text,
                    fontSize: 12 
                  }}
                >
                  {getMetricIcon(metric)} {metric}
                </Chip>
              ))}
            </View>
          </ScrollView>

          <View style={styles.chartContainer}>
            <View style={{ height: 200, width: width - 80 }}>
              <CartesianChart
                data={chartData}
                xKey="day"
                yKeys={["value"]}
                domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              >
                {({ points, chartBounds }) => (
                  selectedMetric === 'calories' || selectedMetric === 'steps' ? 
                    <Area 
                      points={points.value} 
                      y0={chartBounds.bottom}
                      color={theme.colors.primary}
                      opacity={0.3}
                      animate={{ type: "timing", duration: 300 }}
                    />
                  :
                    <Line 
                      points={points.value} 
                      color={theme.colors.primary} 
                      strokeWidth={2}
                      animate={{ type: "timing", duration: 300 }}
                    />
                )}
              </CartesianChart>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMacroChart = () => {
    const macroData = getMacroData();
    if (!macroData) return null;

    const macroArray = [
      { name: 'Protein', value: macroData.protein, color: theme.colors.success },
      { name: 'Carbs', value: macroData.carbs, color: theme.colors.warning },
      { name: 'Fat', value: macroData.fat, color: theme.colors.error },
    ];

    return (
      <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
            🥗 Average Macronutrients
          </Title>
          
          <View style={styles.macroGrid}>
            {macroArray.map((macro, index) => (
              <View key={macro.name} style={styles.macroItem}>
                <View style={[styles.macroColorIndicator, { backgroundColor: macro.color }]} />
                <Text style={[styles.macroName, { color: theme.colors.text }]}>{macro.name}</Text>
                <Text style={[styles.macroValue, { color: theme.colors.text }]}>{macro.value}g</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAchievements = () => {
    if (!currentReport?.summary.achievements.length) return null;

    return (
      <Card style={[styles.achievementsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
            🏆 Achievements
          </Title>
          {currentReport.summary.achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Text style={[styles.achievementText, { color: theme.colors.text }]}>
                {achievement}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (!currentReport?.summary.recommendations.length) return null;

    return (
      <Card style={[styles.recommendationsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
            💡 Recommendations
          </Title>
          {currentReport.summary.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons 
                name="bulb-outline" 
                size={16} 
                color={theme.colors.warning} 
                style={styles.recommendationIcon} 
              />
              <Text style={[styles.recommendationText, { color: theme.colors.text }]}>
                {recommendation}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E1E1E', '#121212'] : ['#6200EE', '#3700B3']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📊 Health Reports</Text>
        <Text style={styles.headerSubtitle}>
          Track your progress and insights
        </Text>
      </LinearGradient>

      <View style={styles.periodSelector}>
        <SegmentedButtons
          value={reportPeriod}
          onValueChange={setReportPeriod}
          buttons={[
            { value: 'week', label: '7 Days' },
            { value: 'month', label: '30 Days' },
            { value: 'quarter', label: '90 Days' },
          ]}
          style={{ backgroundColor: theme.colors.surface }}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSummaryCard()}
        {renderChart()}
        {renderMacroChart()}
        {renderAchievements()}
        {renderRecommendations()}

        <View style={styles.exportContainer}>
          <Button
            mode="outlined"
            icon="download"
            onPress={() => {
              // TODO: Implement export functionality
            }}
            style={styles.exportButton}
          >
            Export Report
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  periodSelector: {
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  chartCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  achievementsCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  recommendationsCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  metricChip: {
    marginRight: 8,
    height: 32,
  },
  chartContainer: {
    alignItems: 'center',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  macroItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  macroColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  macroName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  exportContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  exportButton: {
    borderRadius: 8,
  },
});

export default ReportsScreen; 