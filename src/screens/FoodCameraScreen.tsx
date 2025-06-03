import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/database';
import { LinearGradient } from 'expo-linear-gradient';

type FoodCameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FoodCamera'>;

const { width, height } = Dimensions.get('window');

const FoodCameraScreen: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<FoodCameraScreenNavigationProp>();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo && photo.base64) {
        await analyzeFood(photo.uri, photo.base64);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFood = async (imageUri: string, base64: string) => {
    try {
      setAnalyzing(true);
      
      // Analyze food with Gemini AI
      const analysisResult = await geminiService.analyzeFoodImage(base64);
      
      if (analysisResult) {
        // Save the food entry to database
        const foodEntry = {
          id: Date.now().toString(),
          name: analysisResult.name,
          calories: analysisResult.calories,
          protein: analysisResult.protein,
          carbs: analysisResult.carbs,
          fat: analysisResult.fat,
          fiber: analysisResult.fiber,
          sugar: analysisResult.sugar,
          sodium: analysisResult.sodium,
          imageUri,
          timestamp: Date.now(),
          mealType: 'snack' as const,
          confidence: analysisResult.confidence,
          aiAnalysis: analysisResult.analysis,
        };

        await databaseService.addFoodEntry(foodEntry);

        Alert.alert(
          'Food Analyzed!',
          `Found: ${analysisResult.name}\nCalories: ${analysisResult.calories}\nConfidence: ${Math.round(analysisResult.confidence * 100)}%`,
          [
            {
              text: 'View Details',
              onPress: () => {
                navigation.goBack();
                navigation.navigate('Home');
              },
            },
            {
              text: 'Scan Another',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'Analysis Failed',
          'Could not analyze the food. Please try again or add manually.',
          [
            {
              text: 'Add Manually',
              onPress: () => navigation.navigate('AddFood', { imageUri }),
            },
            {
              text: 'Try Again',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error analyzing food:', error);
      Alert.alert(
        'Analysis Error',
        'Failed to analyze food. Please check your internet connection and try again.',
        [
          {
            text: 'Add Manually',
            onPress: () => navigation.navigate('AddFood', { imageUri }),
          },
          {
            text: 'Retry',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setAnalyzing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <LinearGradient
          colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#f8f9fa', '#e9ecef']}
          style={styles.permissionGradient}
        >
          <Ionicons name="camera-outline" size={80} color={isDark ? '#fff' : '#007AFF'} />
          <Text style={[styles.permissionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: isDark ? '#ccc' : '#666' }]}>
            We need access to your camera to scan and analyze food items with AI
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Top overlay with instructions */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topOverlay}
        >
          <Text style={styles.instructionText}>
            Point camera at food and tap capture
          </Text>
          <Text style={styles.subInstructionText}>
            AI will analyze nutrition automatically
          </Text>
        </LinearGradient>

        {/* Viewfinder overlay */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Bottom controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomOverlay}
        >
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isLoading || analyzing}
            >
              {isLoading || analyzing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {analyzing && (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color="#fff" style={styles.analyzingSpinner} />
              <Text style={styles.analyzingText}>Analyzing food with AI...</Text>
            </View>
          )}
        </LinearGradient>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionGradient: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    margin: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  subInstructionText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 30,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  analyzingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  analyzingSpinner: {
    marginRight: 10,
  },
  analyzingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FoodCameraScreen; 