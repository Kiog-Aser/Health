import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  useColorScheme,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Switch,
  List,
  Divider,
  Portal,
  Modal,
  TextInput,
  RadioButton,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, UserPreferences } from '../types';

interface SettingsScreenProps {}

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [tempValue, setTempValue] = useState<string>('');

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
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    // TODO: Load from database
    const mockProfile: UserProfile = {
      id: '1',
      name: 'John Doe',
      age: 28,
      gender: 'male',
      height: 175, // cm
      activityLevel: 'moderately_active',
      preferences: {
        units: 'metric',
        theme: 'auto',
        notifications: {
          mealReminders: true,
          workoutReminders: true,
          goalReminders: true,
          weeklyReports: false,
        },
        privacy: {
          dataSharing: false,
          analytics: true,
        },
      },
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    };
    setUserProfile(mockProfile);
  };

  const updatePreference = async (
    section: keyof UserPreferences,
    key: string,
    value: any
  ) => {
    if (!userProfile) return;

    const updatedProfile = {
      ...userProfile,
      preferences: {
        ...userProfile.preferences,
        [section]: typeof userProfile.preferences[section] === 'object' 
          ? { ...userProfile.preferences[section], [key]: value }
          : value,
      },
    };

    setUserProfile(updatedProfile);
    // TODO: Save to database
  };

  const updateProfile = async (field: keyof UserProfile, value: any) => {
    if (!userProfile) return;

    const updatedProfile = {
      ...userProfile,
      [field]: value,
    };

    setUserProfile(updatedProfile);
    // TODO: Save to database
  };

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
    setModalVisible(true);
  };

  const handleSaveField = async () => {
    if (!userProfile || !editingField) return;

    let value: any = tempValue;
    
    // Convert to appropriate type
    if (editingField === 'age' || editingField === 'height') {
      value = parseInt(tempValue, 10);
      if (isNaN(value)) {
        Alert.alert('Error', 'Please enter a valid number');
        return;
      }
    }

    await updateProfile(editingField as keyof UserProfile, value);
    setModalVisible(false);
    setEditingField('');
    setTempValue('');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported in JSON format. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement data export
            Alert.alert('Export Complete', 'Your data has been exported successfully.');
          },
        },
      ]
    );
  };

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  if (!userProfile) {
    return (
      <View style={[styles.container, styles.loading, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E1E1E', '#121212'] : ['#6200EE', '#3700B3']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize your experience
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              👤 Profile Information
            </Title>
            
            <List.Item
              title="Name"
              description={userProfile.name}
              left={(props) => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditField('name', userProfile.name)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Age"
              description={`${userProfile.age} years`}
              left={(props) => <List.Icon {...props} icon="cake" color={theme.colors.primary} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditField('age', userProfile.age.toString())}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Height"
              description={`${userProfile.height} cm`}
              left={(props) => <List.Icon {...props} icon="ruler" color={theme.colors.primary} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditField('height', userProfile.height.toString())}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Gender"
              description={userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}
              left={(props) => <List.Icon {...props} icon="gender-male-female" color={theme.colors.primary} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditField('gender', userProfile.gender)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Activity Level"
              description={userProfile.activityLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              left={(props) => <List.Icon {...props} icon="dumbbell" color={theme.colors.primary} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditField('activityLevel', userProfile.activityLevel)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* App Preferences */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🎨 App Preferences
            </Title>
            
            <View style={styles.preferenceItem}>
              <Text style={[styles.preferenceLabel, { color: theme.colors.text }]}>Units</Text>
              <SegmentedButtons
                value={userProfile.preferences.units}
                onValueChange={(value) => updatePreference('units', 'units', value)}
                buttons={[
                  { value: 'metric', label: 'Metric' },
                  { value: 'imperial', label: 'Imperial' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={[styles.preferenceLabel, { color: theme.colors.text }]}>Theme</Text>
              <SegmentedButtons
                value={userProfile.preferences.theme}
                onValueChange={(value) => updatePreference('theme', 'theme', value)}
                buttons={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'auto', label: 'Auto' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🔔 Notifications
            </Title>
            
            <List.Item
              title="Meal Reminders"
              description="Get reminded to log your meals"
              left={(props) => <List.Icon {...props} icon="food-apple" color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={userProfile.preferences.notifications.mealReminders}
                  onValueChange={(value) => updatePreference('notifications', 'mealReminders', value)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Workout Reminders"
              description="Get reminded to exercise"
              left={(props) => <List.Icon {...props} icon="dumbbell" color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={userProfile.preferences.notifications.workoutReminders}
                  onValueChange={(value) => updatePreference('notifications', 'workoutReminders', value)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Goal Reminders"
              description="Get notified about goal progress"
              left={(props) => <List.Icon {...props} icon="target" color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={userProfile.preferences.notifications.goalReminders}
                  onValueChange={(value) => updatePreference('notifications', 'goalReminders', value)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Weekly Reports"
              description="Receive weekly health summaries"
              left={(props) => <List.Icon {...props} icon="chart-line" color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={userProfile.preferences.notifications.weeklyReports}
                  onValueChange={(value) => updatePreference('notifications', 'weeklyReports', value)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* Privacy */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🔒 Privacy & Security
            </Title>
            
            <List.Item
              title="Data Sharing"
              description="Share anonymous data to improve the app"
              left={(props) => <List.Icon {...props} icon="share-variant" color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={userProfile.preferences.privacy.dataSharing}
                  onValueChange={(value) => updatePreference('privacy', 'dataSharing', value)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Analytics"
              description="Help us improve by sharing usage data"
              left={(props) => <List.Icon {...props} icon="chart-bar" color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={userProfile.preferences.privacy.analytics}
                  onValueChange={(value) => updatePreference('privacy', 'analytics', value)}
                />
              )}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📊 Data Management
            </Title>
            
            <List.Item
              title="Export Data"
              description="Download all your health data"
              left={(props) => <List.Icon {...props} icon="download" color={theme.colors.primary} />}
              onPress={handleExportData}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Delete Account"
              description="Permanently delete your account and data"
              left={(props) => <List.Icon {...props} icon="delete-forever" color={theme.colors.error} />}
              onPress={handleDeleteAccount}
              titleStyle={{ color: theme.colors.error }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* Support & Legal */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              💡 Support & Legal
            </Title>
            
            <List.Item
              title="Help Center"
              description="Get answers to common questions"
              left={(props) => <List.Icon {...props} icon="help-circle" color={theme.colors.primary} />}
              onPress={() => openURL('https://help.healthtrackerpro.com')}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Contact Support"
              description="Reach out to our support team"
              left={(props) => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
              onPress={() => openURL('mailto:support@healthtrackerpro.com')}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-account" color={theme.colors.primary} />}
              onPress={() => openURL('https://healthtrackerpro.com/privacy')}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms of service"
              left={(props) => <List.Icon {...props} icon="file-document" color={theme.colors.primary} />}
              onPress={() => openURL('https://healthtrackerpro.com/terms')}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📱 App Information
            </Title>
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" color={theme.colors.primary} />}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
            
            <List.Item
              title="Build"
              description="2024.01.15"
              left={(props) => <List.Icon {...props} icon="hammer-wrench" color={theme.colors.primary} />}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setEditingField('');
            setTempValue('');
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.text }]}>
            Edit {editingField.charAt(0).toUpperCase() + editingField.slice(1)}
          </Title>

          {editingField === 'gender' ? (
            <RadioButton.Group
              onValueChange={setTempValue}
              value={tempValue}
            >
              <View style={styles.radioItem}>
                <RadioButton value="male" />
                <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Male</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="female" />
                <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Female</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="other" />
                <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Other</Text>
              </View>
            </RadioButton.Group>
          ) : editingField === 'activityLevel' ? (
            <RadioButton.Group
              onValueChange={setTempValue}
              value={tempValue}
            >
              {[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'lightly_active', label: 'Lightly Active' },
                { value: 'moderately_active', label: 'Moderately Active' },
                { value: 'very_active', label: 'Very Active' },
                { value: 'extra_active', label: 'Extra Active' },
              ].map((level) => (
                <View key={level.value} style={styles.radioItem}>
                  <RadioButton value={level.value} />
                  <Text style={[styles.radioLabel, { color: theme.colors.text }]}>
                    {level.label}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>
          ) : (
            <TextInput
              label={editingField.charAt(0).toUpperCase() + editingField.slice(1)}
              value={tempValue}
              onChangeText={setTempValue}
              style={styles.input}
              mode="outlined"
              keyboardType={editingField === 'age' || editingField === 'height' ? 'numeric' : 'default'}
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => {
                setModalVisible(false);
                setEditingField('');
                setTempValue('');
              }}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveField}
              style={styles.button}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  preferenceItem: {
    marginBottom: 20,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  segmentedButtons: {
    borderRadius: 8,
  },
  footerSpace: {
    height: 40,
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
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
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

export default SettingsScreen; 