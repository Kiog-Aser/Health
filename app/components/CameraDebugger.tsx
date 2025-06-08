'use client';

import { useState, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { permissionService } from '../services/permissionService';

export default function CameraDebugger() {
  const [permissionState, setPermissionState] = useState<string>('unknown');
  const [cachedState, setCachedState] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastError, setLastError] = useState<string>('');

  useEffect(() => {
    updateStates();
  }, []);

  const updateStates = async () => {
    setIsChecking(true);
    try {
      const cached = permissionService.getCachedPermissionState();
      setCachedState(cached);
      
      const current = await permissionService.checkCameraPermission();
      setPermissionState(current);
      setLastError('');
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    setIsChecking(true);
    try {
      const result = await permissionService.requestCameraPermission();
      if (result.granted) {
        console.log('✅ Camera permission granted!');
        // Stop the stream immediately since this is just a test
        if (result.stream) {
          result.stream.getTracks().forEach(track => track.stop());
        }
      }
      await updateStates();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsChecking(false);
    }
  };

  const clearCache = () => {
    permissionService.clearPermissionCache();
    updateStates();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-error" />;
      case 'prompt':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-info" />;
    }
  };

  return (
    <div className="health-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Camera Permission Debugger
        </h3>
        <button
          onClick={updateStates}
          disabled={isChecking}
          className="btn btn-ghost btn-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Current State */}
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Current Permission State</h4>
          <div className="flex items-center gap-2">
            {getStatusIcon(permissionState)}
            <span className="font-mono text-sm">{permissionState}</span>
          </div>
        </div>

        {/* Cached State */}
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Cached Permission State</h4>
          {cachedState && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(cachedState.camera)}
                <span className="font-mono text-sm">camera: {cachedState.camera}</span>
              </div>
              <div className="text-xs text-base-content/60">
                Last checked: {cachedState.lastChecked ? new Date(cachedState.lastChecked).toLocaleString() : 'Never'}
              </div>
              <div className="text-xs text-base-content/60">
                Age: {cachedState.lastChecked ? Math.round((Date.now() - cachedState.lastChecked) / 1000) : 0} seconds
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {lastError && (
          <div className="alert alert-error">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{lastError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={requestPermission}
            disabled={isChecking}
            className="btn btn-primary btn-sm"
          >
            {isChecking ? 'Checking...' : 'Request Camera Permission'}
          </button>
          
          <button
            onClick={clearCache}
            className="btn btn-ghost btn-sm"
          >
            Clear Cache
          </button>
          
          <button
            onClick={() => permissionService.stopActiveStream()}
            className="btn btn-ghost btn-sm"
          >
            Stop Active Stream
          </button>
        </div>

        {/* Browser Info */}
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Browser Info</h4>
          <div className="text-xs space-y-1">
            <div>MediaDevices API: {navigator.mediaDevices ? '✅ Available' : '❌ Not Available'}</div>
            <div>Permissions API: {'permissions' in navigator ? '✅ Available' : '❌ Not Available'}</div>
            <div>Is PWA: {permissionService.isIOSPWA() ? '✅ Yes' : '❌ No'}</div>
            <div>User Agent: {navigator.userAgent}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 