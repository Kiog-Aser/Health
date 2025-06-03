import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  useColorScheme,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { databaseService } from '../services/database';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

type AddFoodScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddFood'>;
type AddFoodScreenRouteProp = RouteProp<RootStackParamList, 'AddFood'>;

const { width } = Dimensions.get('window');

const AddFoodScreen: React.FC = () => {
  const navigation = useNavigation<AddFoodScreenNavigationProp>();
  const route = useRoute<AddFoodScreenRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    mealType: 'snack' as const,
  });
  const [imageUri, setImageUri] = useState<string | undefined>(route.params?.imageUri);
  const [isLoading, setIsLoading] = useState(false);

  const mealTypes = [
    { key: 'breakfast', label: '🌅 Breakfast', color: '#FF9500' },
    { key: 'lunch', label: '☀️ Lunch', color: '#007AFF' },
    { key: 'dinner', label: '🌙 Dinner', color: '#5856D6' },
    { key: 'snack', label: '🍎 Snack', color: '#34C759' },
  ] as const;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a food name');
      return false;
    }
    if (!formData.calories || isNaN(Number(formData.calories))) {
      Alert.alert('Validation Error', 'Please enter valid calories');
      return false;
    }
    return true;
  };

  const saveFoodEntry = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const foodEntry = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fat: Number(formData.fat) || 0,
        fiber: Number(formData.fiber) || 0,
        sugar: Number(formData.sugar) || 0,
        sodium: Number(formData.sodium) || 0,
        mealType: formData.mealType,
        timestamp: Date.now(),
        imageUri: imageUri,
      };

      await databaseService.addFoodEntry(foodEntry);

      Alert.alert(
        'Success!',
        'Food entry has been saved successfully.',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                name: '',
                calories: '',
                protein: '',
                carbs: '',
                fat: '',
                fiber: '',
                sugar: '',
                sodium: '',
                mealType: 'snack',
              });
              setImageUri(undefined);
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving food entry:', error);
      Alert.alert('Error', 'Failed to save food entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#fff', '#f8f9fa']}
          style={styles.card}
        >
          {/* Image Section */}
          <View style={styles.imageSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Food Image
            </Text>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.foodImage} />
                <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                <Ionicons name="camera-outline" size={40} color={isDark ? '#666' : '#999'} />
                <Text style={[styles.imagePlaceholderText, { color: isDark ? '#666' : '#999' }]}>
                  Tap to add image
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Basic Information
            </Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Food Name *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#333' : '#f0f0f0',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#ddd'
                }]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="e.g., Grilled Chicken Breast"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Calories *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#333' : '#f0f0f0',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#ddd'
                }]}
                value={formData.calories}
                onChangeText={(value) => handleInputChange('calories', value)}
                placeholder="250"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Meal Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Meal Type
            </Text>
            <View style={styles.mealTypeContainer}>
              {mealTypes.map((meal) => (
                <TouchableOpacity
                  key={meal.key}
                  style={[
                    styles.mealTypeButton,
                    formData.mealType === meal.key && { backgroundColor: meal.color },
                    formData.mealType !== meal.key && {
                      backgroundColor: isDark ? '#333' : '#f0f0f0',
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  onPress={() => handleInputChange('mealType', meal.key)}
                >
                  <Text style={[
                    styles.mealTypeText,
                    formData.mealType === meal.key 
                      ? { color: '#fff' }
                      : { color: isDark ? '#ccc' : '#666' }
                  ]}>
                    {meal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Macronutrients */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Macronutrients (grams)
            </Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Protein</Text>
                <TextInput
                  style={[styles.input, styles.macroInput, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.protein}
                  onChangeText={(value) => handleInputChange('protein', value)}
                  placeholder="0"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Carbs</Text>
                <TextInput
                  style={[styles.input, styles.macroInput, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.carbs}
                  onChangeText={(value) => handleInputChange('carbs', value)}
                  placeholder="0"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Fat</Text>
                <TextInput
                  style={[styles.input, styles.macroInput, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.fat}
                  onChangeText={(value) => handleInputChange('fat', value)}
                  placeholder="0"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Fiber</Text>
                <TextInput
                  style={[styles.input, styles.macroInput, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.fiber}
                  onChangeText={(value) => handleInputChange('fiber', value)}
                  placeholder="0"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Sugar</Text>
                <TextInput
                  style={[styles.input, styles.macroInput, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.sugar}
                  onChangeText={(value) => handleInputChange('sugar', value)}
                  placeholder="0"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.label, { color: isDark ? '#ccc' : '#666' }]}>Sodium (mg)</Text>
                <TextInput
                  style={[styles.input, styles.macroInput, { 
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#444' : '#ddd'
                  }]}
                  value={formData.sodium}
                  onChangeText={(value) => handleInputChange('sodium', value)}
                  placeholder="0"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={saveFoodEntry}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#007AFF', '#0051D0']}
            style={styles.saveButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Food Entry</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  foodImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 10,
    right: (width * 0.2) / 2,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: width * 0.6,
    height: width * 0.4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    minWidth: '45%',
  },
  macroInput: {
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingTop: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddFoodScreen; 