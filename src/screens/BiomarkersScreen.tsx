import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, BiomarkerEntry, BiomarkerType } from '../types';
import { databaseService } from '../services/database';
import { LinearGradient } from 'expo-linear-gradient';

type BiomarkersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Biomarkers'>;

const BiomarkersScreen: React.FC = () => {
  const navigation = useNavigation<BiomarkersScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [biomarkers, setBiomarkers] = useState<BiomarkerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<BiomarkerType>('weight');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const biomarkerTypes = [
    { 
      key: 'weight' as BiomarkerType, 
      label: '⚖️ Weight', 
      unit: 'kg', 
      color: '#007AFF',
      icon: 'fitness-outline',
      description: 'Body weight measurement'
    },
    { 
      key: 'height' as BiomarkerType, 
      label: '📏 Height', 
      unit: 'cm', 
      color: '#34C759',
      icon: 'resize-outline',
      description: 'Height measurement'
    },
    { 
      key: 'body_fat' as BiomarkerType, 
      label: '🧑‍⚕️ Body Fat', 
      unit: '%', 
      color: '#FF9500',
      icon: 'body-outline',
      description: 'Body fat percentage'
    },
    { 
      key: 'muscle_mass' as BiomarkerType, 
      label: '💪 Muscle Mass', 
      unit: 'kg', 
      color: '#5856D6',
      icon: 'barbell-outline',
      description: 'Muscle mass measurement'
    },
    { 
      key: 'blood_pressure_systolic' as BiomarkerType, 
      label: '🩸 Blood Pressure (Systolic)', 
      unit: 'mmHg', 
      color: '#FF3B30',
      icon: 'heart-outline',
      description: 'Systolic blood pressure'
    },
    { 
      key: 'blood_pressure_diastolic' as BiomarkerType, 
      label: '🩸 Blood Pressure (Diastolic)', 
      unit: 'mmHg', 
      color: '#FF3B30',
      icon: 'heart-outline',
      description: 'Diastolic blood pressure'
    },
    { 
      key: 'heart_rate' as BiomarkerType, 
      label: '💓 Heart Rate', 
      unit: 'bpm', 
      color: '#E74C3C',
      icon: 'pulse-outline',
      description: 'Resting heart rate'
    },
    { 
      key: 'blood_glucose' as BiomarkerType, 
      label: '🩸 Blood Glucose', 
      unit: 'mg/dL', 
      color: '#8E44AD',
      icon: 'water-outline',
      description: 'Blood sugar level'
    },
    { 
      key: 'cholesterol' as BiomarkerType, 
      label: '🧪 Cholesterol', 
      unit: 'mg/dL', 
      color: '#F39C12',
      icon: 'analytics-outline',
      description: 'Total cholesterol level'
    },
    { 
      key: 'sleep_hours' as BiomarkerType, 
      label: '😴 Sleep', 
      unit: 'hours', 
      color: '#3498DB',
      icon: 'moon-outline',
      description: 'Hours of sleep'
    },
    { 
      key: 'water_intake' as BiomarkerType, 
      label: '💧 Water Intake', 
      unit: 'L', 
      color: '#1ABC9C',
      icon: 'water-outline',
      description: 'Daily water consumption'
    },
    { 
      key: 'steps' as BiomarkerType, 
      label: '👟 Steps', 
      unit: 'steps', 
      color: '#16A085',
      icon: 'walk-outline',
      description: 'Daily step count'
    },
  ] as const;

  useEffect(() => {
    loadBiomarkers();
  }, []);

  const loadBiomarkers = async () => {
    try {
      setIsLoading(true);
      const data = await databaseService.getBiomarkerEntries();
      setBiomarkers(data);
    } catch (error) {
      console.error('Error loading biomarkers:', error);
      Alert.alert('Error', 'Failed to load biomarkers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBiomarker = async () => {
    if (!value.trim() || isNaN(Number(value))) {
      Alert.alert('Validation Error', 'Please enter a valid numeric value');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const selectedBiomarker = biomarkerTypes.find(type => type.key === selectedType);
      if (!selectedBiomarker) return;

      const biomarkerEntry: BiomarkerEntry = {
        id: Date.now().toString(),
        type: selectedType,
        value: Number(value),
        unit: selectedBiomarker.unit,
        timestamp: Date.now(),
        notes: notes.trim(),
      };

      await databaseService.addBiomarkerEntry(biomarkerEntry);
      
      setBiomarkers(prev => [biomarkerEntry, ...prev]);
      setShowAddModal(false);
      setValue('');
      setNotes('');
      
      Alert.alert('Success!', 'Biomarker entry has been saved successfully.');
    } catch (error) {
      console.error('Error saving biomarker:', error);
      Alert.alert('Error', 'Failed to save biomarker entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLatestValue = (type: BiomarkerType) => {
    const latestEntry = biomarkers
      .filter(entry => entry.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return latestEntry;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderBiomarkerCard = ({ item }: { item: any }) => {
    const latestEntry = getLatestValue(item.key);
    
    return (
      <TouchableOpacity 
        style={[styles.biomarkerCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
        onPress={() => {
          setSelectedType(item.key);
          setShowAddModal(true);
        }}
      >
        <View style={styles.biomarkerHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon as any} size={24} color={item.color} />
          </View>
          <View style={styles.biomarkerInfo}>
            <Text style={[styles.biomarkerLabel, { color: isDark ? '#fff' : '#000' }]}>
              {item.label}
            </Text>
            <Text style={[styles.biomarkerDescription, { color: isDark ? '#ccc' : '#666' }]}>
              {item.description}
            </Text>
          </View>
        </View>
        
        {latestEntry ? (
          <View style={styles.biomarkerValue}>
            <Text style={[styles.valueText, { color: item.color }]}>
              {latestEntry.value} {latestEntry.unit}
            </Text>
            <Text style={[styles.dateText, { color: isDark ? '#999' : '#666' }]}>
              {formatDate(latestEntry.timestamp)}
            </Text>
          </View>
        ) : (
          <View style={styles.biomarkerValue}>
            <Text style={[styles.noDataText, { color: isDark ? '#666' : '#999' }]}>
              No data
            </Text>
            <Text style={[styles.addDataText, { color: item.color }]}>
              Tap to add
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRecentEntry = ({ item }: { item: BiomarkerEntry }) => {
    const biomarkerInfo = biomarkerTypes.find(type => type.key === item.type);
    
    return (
      <View style={[styles.recentEntryCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.recentEntryHeader}>
          <View style={[styles.smallIconContainer, { backgroundColor: biomarkerInfo?.color + '20' }]}>
            <Ionicons name={biomarkerInfo?.icon as any} size={16} color={biomarkerInfo?.color} />
          </View>
          <Text style={[styles.recentEntryLabel, { color: isDark ? '#fff' : '#000' }]}>
            {biomarkerInfo?.label}
          </Text>
          <Text style={[styles.recentEntryTime, { color: isDark ? '#999' : '#666' }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        <Text style={[styles.recentEntryValue, { color: biomarkerInfo?.color }]}>
          {item.value} {item.unit}
        </Text>
        {item.notes && (
          <Text style={[styles.recentEntryNotes, { color: isDark ? '#ccc' : '#666' }]}>
            {item.notes}
          </Text>
        )}
      </View>
    );
  };

  const recentEntries = biomarkers
    .slice(0, 5)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
          Loading biomarkers...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Quick Add
          </Text>
          <View style={styles.quickActionsContainer}>
            {biomarkerTypes.slice(0, 4).map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[styles.quickActionButton, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
                onPress={() => {
                  setSelectedType(type.key);
                  setShowAddModal(true);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon as any} size={20} color={type.color} />
                </View>
                <Text style={[styles.quickActionText, { color: isDark ? '#fff' : '#000' }]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Biomarkers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            All Biomarkers
          </Text>
          <FlatList
            data={biomarkerTypes}
            renderItem={renderBiomarkerCard}
            keyExtractor={(item) => item.key}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
          />
        </View>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Recent Entries
            </Text>
            <FlatList
              data={recentEntries}
              renderItem={renderRecentEntry}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Add Biomarker Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#333' : '#ddd' }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.modalCancelButton, { color: '#007AFF' }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
              Add Biomarker
            </Text>
            <TouchableOpacity 
              onPress={handleAddBiomarker}
              disabled={isSubmitting}
            >
              <Text style={[styles.modalSaveButton, { 
                color: isSubmitting ? '#999' : '#007AFF' 
              }]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <LinearGradient
              colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#fff', '#f8f9fa']}
              style={styles.modalCard}
            >
              {/* Biomarker Type Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Select Biomarker Type
                </Text>
                <FlatList
                  data={biomarkerTypes}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.typeSelectionButton,
                        selectedType === item.key && { 
                          backgroundColor: item.color + '20',
                          borderColor: item.color 
                        },
                        selectedType !== item.key && {
                          backgroundColor: isDark ? '#333' : '#f0f0f0',
                          borderColor: isDark ? '#444' : '#ddd'
                        }
                      ]}
                      onPress={() => setSelectedType(item.key)}
                    >
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                      <Text style={[
                        styles.typeSelectionText,
                        { color: isDark ? '#fff' : '#000' }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.key}
                  scrollEnabled={false}
                />
              </View>

              {/* Value Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Value
                </Text>
                <View style={styles.valueInputContainer}>
                  <TextInput
                    style={[styles.valueInput, { 
                      backgroundColor: isDark ? '#333' : '#f0f0f0',
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? '#444' : '#ddd'
                    }]}
                    value={value}
                    onChangeText={setValue}
                    placeholder="Enter value"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.unitText, { color: isDark ? '#ccc' : '#666' }]}>
                    {biomarkerTypes.find(type => type.key === selectedType)?.unit}
                  </Text>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Notes (Optional)
                </Text>
                <TextInput
                  style={[styles.notesInput, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about this measurement..."
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </LinearGradient>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  biomarkerCard: {
    flex: 0.48,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  biomarkerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  biomarkerInfo: {
    flex: 1,
  },
  biomarkerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  biomarkerDescription: {
    fontSize: 12,
  },
  biomarkerValue: {
    alignItems: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
  },
  noDataText: {
    fontSize: 14,
    marginBottom: 4,
  },
  addDataText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentEntryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  recentEntryLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  recentEntryTime: {
    fontSize: 12,
  },
  recentEntryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recentEntryNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
  },
  typeSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  typeSelectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 40,
  },
  notesInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
});

export default BiomarkersScreen; 