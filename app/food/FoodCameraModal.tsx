'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Camera, X, RotateCcw, RefreshCw, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FoodEntry } from '../types';
import { geminiService } from '../services/geminiService';
import FoodAnalysisModal from '../components/ui/FoodAnalysisModal';

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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check API configuration and initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      checkApiConfiguration();
      
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        initializeCamera();
      }, 200);
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
    setAnalysisResult(null);
    setShowAnalysisModal(false);
    setCapturedImage(null);
  };

  const checkApiConfiguration = async () => {
    setApiStatus('pending');
    try {
      const isConfigured = await geminiService.isConfigured();
      if (!isConfigured) {
        setApiStatus('not-configured');
        setError('AI service not configured. Please add your Gemini API key in Settings to enable food scanning.');
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
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      console.log('Requesting camera access with constraints:', constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Got camera stream:', newStream);

      setStream(newStream);
      setPermissionStatus('granted');

      // Wait for React to update before assigning to video element
      setTimeout(() => {
        if (videoRef.current && newStream) {
          const video = videoRef.current;
          
          console.log('🎥 Setting up video element...');
          video.srcObject = newStream;
          video.load();
          
          // Event handlers
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
        }
      }, 100);

    } catch (err: any) {
      console.error('❌ Camera access failed:', err);
      setPermissionStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'OverconstrainedError') {
        console.log('🔄 Retrying without facing mode constraint...');
        setTimeout(() => tryBasicCamera(), 500);
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  const tryBasicCamera = async () => {
    try {
      console.log('🔄 Trying basic camera without facing mode...');
      
      const basicConstraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
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
      
      // Store the captured image
      setCapturedImage(imageFile);
      
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
        // Show detailed analysis modal
        setAnalysisResult(analysisResult);
        setShowAnalysisModal(true);
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

  const handleAnalysisConfirm = async (foodEntry: FoodEntry) => {
    try {
      onFoodAdded(foodEntry);
      setShowAnalysisModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to save food entry:', error);
      setError('Failed to save food entry. Please try again.');
    }
  };

  const handleAnalysisClose = () => {
    setShowAnalysisModal(false);
    setAnalysisResult(null);
    setCapturedImage(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-2">
        <div className="bg-base-100 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Food Scanner</h2>
                <p className="text-sm text-base-content/60">Capture and analyze food with AI</p>
              </div>
              {apiStatus === 'configured' && (
                <div className="flex items-center gap-1 text-success text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Ready</span>
                </div>
              )}
              {apiStatus === 'not-configured' && (
                <div className="flex items-center gap-1 text-warning text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Setup Required</span>
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
          <div className="p-4 flex flex-col h-[calc(95vh-5rem)] overflow-hidden">
            {/* API Configuration Status */}
            {apiStatus === 'not-configured' && (
              <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-warning mb-1">AI Service Setup Required</h3>
                    <p className="text-sm text-base-content/80 mb-2">
                      Configure your Gemini API key to enable AI food scanning.
                    </p>
                    <div className="text-xs text-base-content/70">
                      Add NEXT_PUBLIC_GEMINI_API_KEY to your environment and restart the server.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {permissionStatus === 'pending' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-center">Requesting camera access...</p>
                <p className="text-sm text-base-content/60 text-center">
                  Please allow camera permissions when prompted
                </p>
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
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
              <div className="flex-1 flex flex-col space-y-4">
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
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex-1">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    controls={false}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Loading overlay */}
                  {!videoReady && stream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                      <div className="text-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Starting camera...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Viewfinder when ready */}
                  {videoReady && !isAnalyzing && (
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
                        <p className="text-sm opacity-70 mt-1">This may take a few seconds</p>
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

      {/* Analysis Result Modal */}
      <FoodAnalysisModal
        isOpen={showAnalysisModal}
        onClose={handleAnalysisClose}
        onConfirm={handleAnalysisConfirm}
        analysisResult={analysisResult}
        capturedImage={capturedImage || undefined}
      />
    </>
  );
} 