import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  RadioButton,
  ProgressBar,
  Chip,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Goal, Milestone } from '../types';

interface GoalsScreenProps {}

const GoalsScreen: React.FC<GoalsScreenProps> = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'weight_loss' as Goal['type'],
    targetValue: '',
    unit: 'kg',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  const goalTypes = [
    { value: 'weight_loss', label: 'Weight Loss', icon: '⚖️' },
    { value: 'weight_gain', label: 'Weight Gain', icon: '📈' },
    { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
    { value: 'fitness', label: 'Fitness', icon: '🏃‍♂️' },
    { value: 'biomarker', label: 'Health Metric', icon: '🩺' },
    { value: 'custom', label: 'Custom', icon: '🎯' },
  ];

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
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    // TODO: Load from database
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: 'Lose 10 kg',
        description: 'Reach my target weight for summer',
        type: 'weight_loss',
        targetValue: 70,
        currentValue: 75,
        unit: 'kg',
        targetDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        isCompleted: false,
        milestones: [
          { id: '1', title: 'First 2kg', targetValue: 78, isCompleted: true, achievedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
          { id: '2', title: 'Halfway point', targetValue: 75, isCompleted: true, achievedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
          { id: '3', title: 'Final goal', targetValue: 70, isCompleted: false },
        ],
      },
      {
        id: '2',
        title: 'Run 5K in under 25 minutes',
        description: 'Improve my cardiovascular fitness',
        type: 'fitness',
        targetValue: 25,
        currentValue: 28,
        unit: 'minutes',
        targetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        isCompleted: false,
      },
    ];
    setGoals(mockGoals);
  };

  const calculateProgress = (goal: Goal): number => {
    if (goal.type === 'weight_loss') {
      const totalChange = Math.abs(goal.targetValue - goal.currentValue);
      const achieved = Math.abs(goal.currentValue - (goal.targetValue > goal.currentValue ? goal.currentValue + totalChange : goal.currentValue - totalChange));
      return Math.min((achieved / totalChange) * 100, 100);
    } else if (goal.type === 'fitness' && goal.unit === 'minutes') {
      // For time-based goals, progress is inverse (lower is better)
      const improvement = Math.max(0, goal.currentValue - goal.targetValue);
      const totalImprovement = goal.currentValue - goal.targetValue;
      return totalImprovement > 0 ? Math.min((improvement / totalImprovement) * 100, 100) : 0;
    } else {
      return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
    }
  };

  const getDaysLeft = (targetDate: number): number => {
    return Math.max(0, Math.ceil((targetDate - Date.now()) / (24 * 60 * 60 * 1000)));
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return theme.colors.success;
    if (progress >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  const handleSaveGoal = async () => {
    if (!newGoal.title || !newGoal.targetValue) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const goal: Goal = {
      id: editingGoal?.id || Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      targetValue: parseFloat(newGoal.targetValue),
      currentValue: editingGoal?.currentValue || 0,
      unit: newGoal.unit,
      targetDate: newGoal.targetDate.getTime(),
      createdAt: editingGoal?.createdAt || Date.now(),
      isCompleted: false,
      milestones: editingGoal?.milestones,
    };

    if (editingGoal) {
      setGoals(goals.map(g => g.id === goal.id ? goal : g));
    } else {
      setGoals([...goals, goal]);
    }

    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setNewGoal({
      title: '',
      description: '',
      type: 'weight_loss',
      targetValue: '',
      unit: 'kg',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    setEditingGoal(null);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.targetValue.toString(),
      unit: goal.unit,
      targetDate: new Date(goal.targetDate),
    });
    setModalVisible(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setGoals(goals.filter(g => g.id !== goalId)),
        },
      ]
    );
  };

  const renderGoalCard = (goal: Goal) => {
    const progress = calculateProgress(goal);
    const daysLeft = getDaysLeft(goal.targetDate);
    const goalType = goalTypes.find(t => t.value === goal.type);

    return (
      <Card key={goal.id} style={[styles.goalCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Text style={styles.goalEmoji}>{goalType?.icon}</Text>
              <View style={styles.goalTitleText}>
                <Title style={[styles.goalTitle, { color: theme.colors.text }]}>
                  {goal.title}
                </Title>
                <Paragraph style={[styles.goalDescription, { color: theme.colors.textSecondary }]}>
                  {goal.description}
                </Paragraph>
              </View>
            </View>
            <View style={styles.goalActions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => handleEditGoal(goal)}
                iconColor={theme.colors.primary}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteGoal(goal.id)}
                iconColor={theme.colors.error}
              />
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: theme.colors.text }]}>
                Progress: {progress.toFixed(1)}%
              </Text>
              <Chip
                style={[styles.daysChip, { backgroundColor: daysLeft > 7 ? theme.colors.success : theme.colors.warning }]}
                textStyle={{ color: '#FFFFFF', fontSize: 12 }}
              >
                {daysLeft} days left
              </Chip>
            </View>
            <ProgressBar
              progress={progress / 100}
              color={getProgressColor(progress)}
              style={styles.progressBar}
            />
            <Text style={[styles.progressValues, { color: theme.colors.textSecondary }]}>
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </Text>
          </View>

          {goal.milestones && goal.milestones.length > 0 && (
            <View style={styles.milestonesContainer}>
              <Text style={[styles.milestonesTitle, { color: theme.colors.text }]}>
                Milestones
              </Text>
              {goal.milestones.map((milestone) => (
                <View key={milestone.id} style={styles.milestoneItem}>
                  <Ionicons
                    name={milestone.isCompleted ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={milestone.isCompleted ? theme.colors.success : theme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.milestoneText,
                    { color: milestone.isCompleted ? theme.colors.success : theme.colors.textSecondary }
                  ]}>
                    {milestone.title}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
        <Text style={styles.headerTitle}>🎯 Your Goals</Text>
        <Text style={styles.headerSubtitle}>
          {goals.filter(g => !g.isCompleted).length} active goals
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Goals Yet
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
              Set your first health goal and start your journey to a healthier you!
            </Text>
          </View>
        ) : (
          goals.map(renderGoalCard)
        )}
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            resetForm();
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView>
            <Title style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </Title>

            <TextInput
              label="Goal Title"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Description"
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
            />

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Goal Type</Text>
            <RadioButton.Group
              onValueChange={(value) => setNewGoal({ ...newGoal, type: value as Goal['type'] })}
              value={newGoal.type}
            >
              {goalTypes.map((type) => (
                <View key={type.value} style={styles.radioItem}>
                  <RadioButton value={type.value} />
                  <Text style={[styles.radioLabel, { color: theme.colors.text }]}>
                    {type.icon} {type.label}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>

            <View style={styles.targetContainer}>
              <TextInput
                label="Target Value"
                value={newGoal.targetValue}
                onChangeText={(text) => setNewGoal({ ...newGoal, targetValue: text })}
                style={[styles.input, styles.targetInput]}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Unit"
                value={newGoal.unit}
                onChangeText={(text) => setNewGoal({ ...newGoal, unit: text })}
                style={[styles.input, styles.unitInput]}
                mode="outlined"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveGoal}
                style={styles.button}
              >
                {editingGoal ? 'Update' : 'Create'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  content: {
    flex: 1,
    padding: 20,
  },
  goalCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  goalTitleText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  goalActions: {
    flexDirection: 'row',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysChip: {
    height: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressValues: {
    fontSize: 12,
    textAlign: 'center',
  },
  milestonesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneText: {
    fontSize: 13,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  targetContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  targetInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default GoalsScreen; 