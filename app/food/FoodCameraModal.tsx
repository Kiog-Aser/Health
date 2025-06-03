'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Zap, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/database';
import { FoodEntry } from '../types';

interface FoodCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded: (entry: FoodEntry) => void;
}

export default function FoodCameraModal({ isOpen, onClose, onFoodAdded }: FoodCameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const initializeCamera = async () => {
    try {
      setError('');
      setPermissionStatus('pending');

      // Check if Gemini is configured
      if (!geminiService.isConfigured()) {
        setError('AI service not configured. Please add your Gemini API key.');
        return;
      }

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(newStream);
      setPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setPermissionStatus('denied');
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(current => current === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing || isAnalyzing) return;

    try {
      setIsCapturing(true);
      setError('');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image blob'));
        }, 'image/jpeg', 0.8);
      });

      // Convert blob to File
      const imageFile = new File([blob], 'food-image.jpg', { type: 'image/jpeg' });
      
      // Analyze the image
      await analyzeFood(imageFile);

    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, isAnalyzing]);

  const analyzeFood = async (imageFile: File) => {
    try {
      setIsAnalyzing(true);
      setError('');

      const analysisResult = await geminiService.analyzeFoodImage(imageFile);

      if (analysisResult) {
        // Create the food entry
        const foodEntry: FoodEntry = {
          id: Date.now().toString(),
          name: analysisResult.name,
          calories: analysisResult.calories,
          protein: analysisResult.protein,
          carbs: analysisResult.carbs,
          fat: analysisResult.fat,
          fiber: analysisResult.fiber,
          sugar: analysisResult.sugar,
          sodium: analysisResult.sodium,
          timestamp: Date.now(),
          mealType: 'snack',
          confidence: analysisResult.confidence,
          aiAnalysis: analysisResult.analysis,
        };

        // Save to database
        await databaseService.addFoodEntry(foodEntry);

        // Notify parent component
        onFoodAdded(foodEntry);

        // Show success message and close modal
        alert(`Food analyzed successfully!\n\nFound: ${analysisResult.name}\nCalories: ${analysisResult.calories}\nConfidence: ${Math.round(analysisResult.confidence * 100)}%`);
        onClose();

      } else {
        setError('Unable to analyze the food. Please try again or add the food manually.');
      }
    } catch (err) {
      console.error('Error analyzing food:', err);
      setError('Failed to analyze food. Please check your internet connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Scan Food with AI</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {permissionStatus === 'pending' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Requesting camera access...</p>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Camera className="w-12 h-12 text-error" />
              <div className="text-center">
                <p className="font-semibold text-error mb-2">Camera Access Required</p>
                <p className="text-sm text-base-content/60 mb-4">
                  We need access to your camera to scan and analyze food items with AI
                </p>
                <button
                  onClick={initializeCamera}
                  className="btn btn-primary"
                >
                  Grant Camera Access
                </button>
              </div>
            </div>
          )}

          {permissionStatus === 'granted' && (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-center">
                  <Zap className="w-4 h-4 inline mr-2" />
                  Point camera at food and tap capture - AI will analyze nutrition automatically
                </p>
              </div>

              {/* Video Container */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-primary border-dashed rounded-lg opacity-60">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                  </div>
                </div>

                {/* Analyzing overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Analyzing food with AI...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={toggleCamera}
                  className="btn btn-ghost btn-circle"
                  disabled={isCapturing || isAnalyzing}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={isCapturing || isAnalyzing}
                  className="btn btn-primary btn-circle btn-lg"
                >
                  {isCapturing || isAnalyzing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                </button>

                <div className="w-12 h-12" /> {/* Spacer for symmetry */}
              </div>

              {/* Error message */}
              {error && (
                <div className="alert alert-error">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
} 