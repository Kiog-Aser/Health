'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export default function CameraDiagnostic() {
  const [diagnostics, setDiagnostics] = useState({
    webrtcSupport: false,
    mediaDevicesSupport: false,
    cameraPermission: 'unknown' as 'unknown' | 'granted' | 'denied' | 'prompt',
    availableCameras: [] as MediaDeviceInfo[],
    videoConstraintsSupport: false,
    streamActive: false,
    videoElementWorking: false
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    runInitialDiagnostics();
    return () => {
      stopTestStream();
    };
  }, []);

  const runInitialDiagnostics = async () => {
    setIsRunning(true);
    
    const newDiagnostics = { ...diagnostics };

    // Check WebRTC support
    newDiagnostics.webrtcSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Check MediaDevices API support
    newDiagnostics.mediaDevicesSupport = !!(navigator.mediaDevices);

    if (navigator.mediaDevices) {
      try {
        // Check available cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        newDiagnostics.availableCameras = devices.filter(device => device.kind === 'videoinput');
        
        // Check permission status if available
        if ('permissions' in navigator) {
          try {
            const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            newDiagnostics.cameraPermission = permission.state;
          } catch (e) {
            console.log('Permission API not supported');
          }
        }
      } catch (error) {
        console.error('Error checking devices:', error);
      }
    }

    setDiagnostics(newDiagnostics);
    setIsRunning(false);
  };

  const testCameraAccess = async () => {
    setIsRunning(true);
    const newDiagnostics = { ...diagnostics };

    try {
      // Stop existing stream
      stopTestStream();

      // Test basic camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });

      setTestStream(stream);
      newDiagnostics.streamActive = true;
      newDiagnostics.cameraPermission = 'granted';
      newDiagnostics.videoConstraintsSupport = true;

      // Test video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const handleLoadedMetadata = () => {
          newDiagnostics.videoElementWorking = true;
          setDiagnostics({ ...newDiagnostics });
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Video play error:', playError);
        }
      }

    } catch (error) {
      console.error('Camera test failed:', error);
      newDiagnostics.streamActive = false;
      newDiagnostics.cameraPermission = 'denied';
      
      if (error instanceof Error) {
        console.log('Error details:', {
          name: error.name,
          message: error.message
        });
      }
    }

    setDiagnostics(newDiagnostics);
    setIsRunning(false);
  };

  const stopTestStream = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getStatusIcon = (key: string, value: boolean | string | MediaDeviceInfo[]) => {
    if (key === 'availableCameras') {
      const cameras = value as MediaDeviceInfo[];
      return cameras.length > 0 ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-error" />;
    }
    
    if (typeof value === 'boolean') {
      return value ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-error" />;
    }
    
    if (value === 'granted') return <CheckCircle className="w-4 h-4 text-success" />;
    if (value === 'denied') return <XCircle className="w-4 h-4 text-error" />;
    if (value === 'prompt') return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <Info className="w-4 h-4 text-info" />;
  };

  const getStatusText = (key: string, value: any) => {
    switch (key) {
      case 'webrtcSupport':
        return value ? 'WebRTC Supported' : 'WebRTC Not Supported';
      case 'mediaDevicesSupport':
        return value ? 'MediaDevices API Available' : 'MediaDevices API Not Available';
      case 'cameraPermission':
        return `Camera Permission: ${value}`;
      case 'availableCameras':
        return `Available Cameras: ${value.length}`;
      case 'videoConstraintsSupport':
        return value ? 'Video Constraints Work' : 'Video Constraints Failed';
      case 'streamActive':
        return value ? 'Camera Stream Active' : 'No Camera Stream';
      case 'videoElementWorking':
        return value ? 'Video Element Working' : 'Video Element Issues';
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className="health-card p-6">
      <h3 className="text-lg font-semibold mb-4">📷 Camera Diagnostic Tool</h3>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={runInitialDiagnostics}
            disabled={isRunning}
            className="btn btn-secondary btn-sm"
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </button>
          
          <button
            onClick={testCameraAccess}
            disabled={isRunning}
            className="btn btn-primary btn-sm"
          >
            {isRunning ? 'Testing...' : 'Test Camera'}
          </button>
          
          <button
            onClick={stopTestStream}
            disabled={!testStream}
            className="btn btn-ghost btn-sm"
          >
            Stop Test
          </button>
        </div>

        {/* Diagnostic Results */}
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">System Capabilities</h4>
          <div className="space-y-2">
            {Object.entries(diagnostics).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                {getStatusIcon(key, value)}
                <span className="text-sm">{getStatusText(key, value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Video */}
        {testStream && (
          <div className="bg-black rounded-lg overflow-hidden aspect-video max-w-sm">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Camera List */}
        {diagnostics.availableCameras.length > 0 && (
          <div className="bg-base-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Available Cameras</h4>
            <div className="space-y-2">
              {diagnostics.availableCameras.map((camera, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium">{camera.label || `Camera ${index + 1}`}</div>
                  <div className="text-base-content/60 text-xs">ID: {camera.deviceId}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-base-content/60 bg-base-200 p-3 rounded">
          <p><strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Make sure you're using HTTPS or localhost</li>
            <li>Grant camera permissions when prompted</li>
            <li>Try refreshing the page if camera fails</li>
            <li>Check if other apps are using the camera</li>
            <li>Try different browsers (Chrome/Firefox recommended)</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 