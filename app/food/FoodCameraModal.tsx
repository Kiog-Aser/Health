'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Zap, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
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
  const [apiStatus, setApiStatus] = useState<'pending' | 'configured' | 'not-configured'>('pending');
  const [videoReady, setVideoReady] = useState(false);
  const [videoState, setVideoState] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Monitor video state for debugging
  const monitorVideoState = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const state = `ReadyState: ${video.readyState}, Paused: ${video.paused}, CurrentTime: ${video.currentTime.toFixed(2)}, Duration: ${video.duration || 'N/A'}, Width: ${video.videoWidth}, Height: ${video.videoHeight}`;
      setVideoState(state);
      console.log('📊 Video State:', state);
      
      // Auto-set ready if we have dimensions and reasonable ready state
      if (!videoReady && video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
        console.log('🎯 Auto-detecting video ready state');
        setVideoReady(true);
      }
    }
  };

  // Check API configuration and initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      checkApiConfiguration();
      
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        initializeCamera();
      }, 200);
      
      // Start monitoring video state
      const interval = setInterval(monitorVideoState, 1000);
      return () => clearInterval(interval);
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Handle camera switching only (not initial load)
  useEffect(() => {
    if (isOpen && permissionStatus === 'granted' && stream) {
      console.log('🔄 Camera switch triggered, reinitializing...');
      initializeCamera();
    }
  }, [facingMode]);

  const cleanup = () => {
    stopCamera();
    setVideoReady(false);
    setPermissionStatus('pending');
    setError('');
  };

  const checkApiConfiguration = async () => {
    setApiStatus('pending');
    try {
      if (!geminiService.isConfigured()) {
        setApiStatus('not-configured');
        setError('AI service not configured. Please add your Gemini API key to enable food scanning.');
        return;
      }

      // Test the connection
      const isConnected = await geminiService.testConnection();
      if (isConnected) {
        setApiStatus('configured');
        setError('');
      } else {
        setApiStatus('not-configured');
        setError('Unable to connect to AI service. Please check your API key and internet connection.');
      }
    } catch (err) {
      console.error('API configuration check failed:', err);
      setApiStatus('not-configured');
      setError('Failed to verify AI service configuration.');
    }
  };

  const initializeCamera = async () => {
    try {
      setError('');
      setPermissionStatus('pending');
      setVideoReady(false);

      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      console.log('🚀 Starting camera initialization with facing mode:', facingMode);
      
      // Include facing mode constraint since that's when it works
      const constraints = {
        video: {
          facingMode: facingMode
        }
      };

      console.log('Requesting camera access with constraints:', constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Got camera stream:', newStream);
      console.log('Video tracks:', newStream.getVideoTracks());

      setStream(newStream);
      setPermissionStatus('granted');

      // Wait for React to update before assigning to video element
      setTimeout(() => {
        if (videoRef.current && newStream) {
          const video = videoRef.current;
          
          console.log('🎥 Setting up video element (delayed assignment)...');
          
          // Clear any existing source first
          video.srcObject = null;
          
          // Assign the stream after a brief delay
          setTimeout(() => {
            console.log('🔗 Assigning stream to video element...');
            video.srcObject = newStream;
            video.load();
            
            // Event handler for metadata
            video.onloadedmetadata = () => {
              console.log('✅ Video metadata loaded!', {
                width: video.videoWidth,
                height: video.videoHeight,
                readyState: video.readyState
              });
              setVideoReady(true);
            };
            
            // Try to play
            video.play().then(() => {
              console.log('✅ Video playing automatically!');
              setVideoReady(true);
            }).catch(err => {
              console.log('⚠️ Autoplay failed:', err);
              setVideoReady(true); // Still set ready since video works
            });
          }, 50);
        }
      }, 100);

    } catch (err) {
      console.error('❌ Camera access failed:', err);
      setPermissionStatus('denied');
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please ensure your device has a camera.');
        } else if (err.name === 'OverconstrainedError') {
          // Try without facing mode constraint
          console.log('🔄 Retrying without facing mode constraint...');
          setTimeout(() => tryBasicCamera(), 500);
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Unknown error accessing camera.');
      }
    }
  };

  const tryBasicCamera = async () => {
    try {
      console.log('🔄 Trying basic camera without facing mode...');
      
      const basicConstraints = {
        video: true
      };

      const newStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      setStream(newStream);
      setPermissionStatus('granted');
      setError('');

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = newStream;
        video.load();
        
        video.onloadedmetadata = () => {
          console.log('✅ Basic camera metadata loaded');
          setVideoReady(true);
        };
        
        video.play().then(() => {
          console.log('✅ Basic camera playing');
          setVideoReady(true);
        }).catch(console.error);
      }
    } catch (err) {
      console.error('Basic camera access failed:', err);
      setError('Unable to access camera with any settings.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      console.log('Stopping camera stream');
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track);
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    console.log('Toggling camera from', facingMode, 'to', facingMode === 'user' ? 'environment' : 'user');
    setFacingMode(current => current === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing || isAnalyzing || !videoReady) {
      console.log('Cannot capture:', {
        videoRef: !!videoRef.current,
        canvasRef: !!canvasRef.current,
        isCapturing,
        isAnalyzing,
        videoReady
      });
      return;
    }

    if (apiStatus !== 'configured') {
      setError('AI service is not properly configured. Cannot analyze food.');
      return;
    }

    try {
      setIsCapturing(true);
      setError('');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to get canvas context');
      }

      console.log('Capturing photo from video:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });

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
      
      console.log('Image captured successfully, size:', imageFile.size);
      
      // Analyze the image
      await analyzeFood(imageFile);

    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, isAnalyzing, apiStatus, videoReady]);

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
        setError('Unable to analyze the food. The AI couldn\'t identify the food in the image. Please try again with a clearer photo or add the food manually.');
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
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Scan Food with AI</h2>
            {apiStatus === 'configured' && (
              <div className="flex items-center gap-1 text-success text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>AI Ready</span>
              </div>
            )}
            {apiStatus === 'not-configured' && (
              <div className="flex items-center gap-1 text-warning text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Setup Required</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* API Configuration Status */}
          {apiStatus === 'not-configured' && (
            <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h3 className="font-semibold text-warning mb-1">AI Service Setup Required</h3>
                  <p className="text-sm text-base-content/80 mb-2">
                    To use AI food scanning, you need to configure your Gemini API key.
                  </p>
                  <ol className="text-sm text-base-content/80 list-decimal list-inside space-y-1">
                    <li>Get a free API key from <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="link link-primary">Google AI Studio</a></li>
                    <li>Create a file named <code className="bg-base-200 px-1 rounded">.env.local</code> in your project root</li>
                    <li>Add: <code className="bg-base-200 px-1 rounded">NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here</code></li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

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

              {/* Camera Status */}
              {!videoReady && stream && (
                <div className="bg-info/10 p-3 rounded-lg text-center">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  <span className="text-sm">Initializing camera...</span>
                </div>
              )}

              {/* Video Container */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full h-full object-cover"
                />
                
                {/* Simple loading overlay */}
                {!videoReady && stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Starting camera...</p>
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            console.log('🔄 Manual play attempt');
                            const video = videoRef.current;
                            video.play().then(() => {
                              console.log('✅ Manual play worked!');
                              setVideoReady(true);
                            }).catch(error => {
                              console.error('❌ Manual play failed:', error);
                              // Force ready state anyway
                              setVideoReady(true);
                            });
                          }
                        }}
                        className="btn btn-sm btn-primary mt-3"
                      >
                        ▶ Start Video
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Simple viewfinder when ready */}
                {videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                  </div>
                )}

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
                  disabled={isCapturing || isAnalyzing || !videoReady}
                  title="Switch camera"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={isCapturing || isAnalyzing || apiStatus !== 'configured' || !videoReady}
                  className="btn btn-primary btn-circle btn-lg"
                  title={
                    !videoReady ? 'Camera not ready' :
                    apiStatus !== 'configured' ? 'AI service not configured' : 
                    'Capture and analyze food'
                  }
                >
                  {isCapturing || isAnalyzing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={() => {
                    console.log('🔄 Restarting camera...');
                    initializeCamera();
                  }}
                  className="btn btn-ghost btn-circle"
                  disabled={isCapturing || isAnalyzing}
                  title="Restart camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {/* Debug info (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-base-content/40 bg-base-200 p-2 rounded">
                  <div>Status: {permissionStatus} | Video Ready: {videoReady ? 'Yes' : 'No'} | 
                  Stream: {stream ? 'Active' : 'None'} | API: {apiStatus}</div>
                  {videoState && <div className="mt-1">Video: {videoState}</div>}
                  
                  {stream && videoRef.current && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => {
                          const video = videoRef.current!;
                          console.log('🔧 Debug: Direct stream assignment');
                          video.srcObject = stream;
                          video.load();
                          setTimeout(() => {
                            video.play().then(() => setVideoReady(true)).catch(console.error);
                          }, 100);
                        }}
                        className="btn btn-xs btn-secondary"
                      >
                        Force Stream
                      </button>
                      <button
                        onClick={() => {
                          console.log('🔧 Debug: Force ready state');
                          setVideoReady(true);
                        }}
                        className="btn btn-xs btn-accent"
                      >
                        Force Ready
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="alert alert-error">
                  <AlertCircle className="w-5 h-5" />
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