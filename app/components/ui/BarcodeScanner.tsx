'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Zap, Camera, AlertTriangle, RotateCcw, RefreshCw, Loader2, Search } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ 
  onScanSuccess, 
  onClose, 
  isOpen 
}: BarcodeScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [videoReady, setVideoReady] = useState(false);
  const [scanningActive, setScanningActive] = useState(false);
  const [manualEntry, setManualEntry] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
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
    setIsScanning(false);
    setVideoReady(false);
    setPermissionStatus('pending');
    setError('');
    setScanningActive(false);
    setShowManualEntry(false);
    setManualEntry('');
  }, [stream]);

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

      console.log('🚀 Starting barcode scanner camera initialization with facing mode:', facingMode);
      
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
            // Start barcode scanning after video is ready
            setTimeout(() => startBarcodeScanning(), 500);
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
          setTimeout(() => startBarcodeScanning(), 500);
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

  const startBarcodeScanning = () => {
    if (!videoRef.current || !canvasRef.current || scanningActive) return;
    
    console.log('🔍 Starting barcode scanning...');
    setScanningActive(true);
    setIsScanning(true);

    // Check if BarcodeDetector is available
    const hasBarcodeDetector = 'BarcodeDetector' in window;
    
    if (!hasBarcodeDetector) {
      console.log('⚠️ BarcodeDetector not available, showing manual entry option');
      setError('Automatic scanning not supported on this device. Please use manual entry below.');
      setShowManualEntry(true);
      setIsScanning(false);
      return;
    }

    // Create scanning interval
    scanIntervalRef.current = setInterval(() => {
      scanForBarcode();
    }, 500); // Scan every 500ms
  };

  const scanForBarcode = async () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0);

      // Try to detect barcodes using BarcodeDetector
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: [
              'code_128',
              'code_39',
              'code_93',
              'codabar',
              'ean_13',
              'ean_8',
              'itf',
              'upc_a',
              'upc_e',
              'qr_code',
              'data_matrix',
              'aztec',
              'pdf417'
            ]
          });
          
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            console.log('✅ Barcode detected:', barcode.rawValue);
            handleBarcodeFound(barcode.rawValue);
            return;
          }
        } catch (detectionError) {
          console.log('Barcode detection failed:', detectionError);
          // Continue trying without stopping the scanner
        }
      }
      
    } catch (err) {
      console.log('Barcode scan attempt failed:', err);
      // Don't show error for scan failures, just continue scanning
    }
  };

  const handleBarcodeFound = (barcodeText: string) => {
    console.log('🎯 Barcode found:', barcodeText);
    
    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanningActive(false);
    setIsScanning(false);
    
    // Clean up and call success handler
    cleanup();
    onScanSuccess(barcodeText);
  };

  const handleManualSubmit = () => {
    if (manualEntry.trim().length >= 8) {
      // Validate that it's mostly numbers (allow some characters for certain barcode types)
      const cleaned = manualEntry.trim().replace(/[^0-9]/g, '');
      if (cleaned.length >= 8) {
        console.log('🎯 Manual barcode entered:', cleaned);
        cleanup();
        onScanSuccess(cleaned);
      } else {
        setError('Please enter a valid barcode (at least 8 digits)');
      }
    } else {
      setError('Barcode must be at least 8 characters long');
    }
  };

  const toggleCamera = () => {
    console.log('Toggling camera from', facingMode, 'to', facingMode === 'user' ? 'environment' : 'user');
    setFacingMode(current => current === 'user' ? 'environment' : 'user');
  };

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !stream) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        initializeCamera();
      }, 200);
    } else if (!isOpen) {
      cleanup();
    }

    return () => {
      if (!isOpen) {
        cleanup();
      }
    };
  }, [isOpen]);

  // Handle camera switching
  useEffect(() => {
    if (isOpen && permissionStatus === 'granted' && stream) {
      console.log('🔄 Camera switch triggered, reinitializing...');
      initializeCamera();
    }
  }, [facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-2">
      <div className="bg-base-100 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Barcode Scanner</h2>
              <p className="text-sm text-base-content/60">Point camera at product barcode</p>
            </div>
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
                  We need access to your camera to scan barcodes
                </p>
                <div className="space-y-2">
                  <button
                    onClick={initializeCamera}
                    className="btn btn-primary"
                  >
                    Grant Camera Access
                  </button>
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="btn btn-outline btn-sm"
                  >
                    Enter Barcode Manually
                  </button>
                </div>
              </div>
            </div>
          )}

          {permissionStatus === 'granted' && (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Instructions */}
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-center">
                  <Zap className="w-4 h-4 inline mr-2" />
                  Point camera at barcode - scanning automatically
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
                
                {/* Scanning overlay */}
                {videoReady && isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-32 border-2 border-red-500 border-dashed rounded-lg opacity-70">
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Scanning status */}
                {isScanning && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      <Loader2 className="w-3 h-3 animate-spin inline mr-2" />
                      Scanning for barcode...
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={toggleCamera}
                  className="btn btn-ghost btn-circle"
                  disabled={!videoReady}
                  title="Switch camera"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    console.log('🔄 Restarting camera...');
                    initializeCamera();
                  }}
                  className="btn btn-ghost btn-circle"
                  disabled={!videoReady}
                  title="Restart camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="btn btn-outline btn-sm"
                  title="Enter barcode manually"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Manual Entry
                </button>
              </div>

              {/* Manual Entry */}
              {showManualEntry && (
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Enter Barcode Manually</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualEntry}
                      onChange={(e) => setManualEntry(e.target.value)}
                      placeholder="Enter barcode numbers (e.g., 1234567890123)"
                      className="input input-bordered flex-1"
                      maxLength={20}
                    />
                    <button
                      onClick={handleManualSubmit}
                      className="btn btn-primary"
                      disabled={manualEntry.length < 8}
                    >
                      Search
                    </button>
                  </div>
                  <p className="text-xs text-base-content/60 mt-1">
                    Find the barcode numbers on your product and enter them here
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="alert alert-error">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden canvas for barcode detection */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
} 