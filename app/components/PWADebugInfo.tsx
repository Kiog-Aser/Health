'use client';

import { useState, useEffect } from 'react';
import { Info, Camera, Smartphone, RefreshCw } from 'lucide-react';
import { pwaService } from '../services/pwaService';
import { permissionService } from '../services/permissionService';

interface PWADebugInfoProps {
  className?: string;
}

export default function PWADebugInfo({ className = '' }: PWADebugInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pwaInfo, setPWAInfo] = useState<any>(null);
  const [permissionInfo, setPermissionInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      updateInfo();
    }
  }, [isOpen]);

  const updateInfo = async () => {
    const pwa = pwaService.getPWAInfo();
    const permission = permissionService.getCachedPermissionState();
    const cameraState = await permissionService.checkCameraPermission();
    
    setPWAInfo(pwa);
    setPermissionInfo({
      ...permission,
      currentState: cameraState
    });
  };

  const refreshPermissions = async () => {
    await pwaService.refreshPermissions();
    updateInfo();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`btn btn-ghost btn-sm ${className}`}
        title="PWA Debug Info"
      >
        <Info className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            PWA Debug Info
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* PWA Status */}
          <div>
            <h4 className="font-medium text-sm text-primary mb-2">PWA Status</h4>
            <div className="bg-base-200 p-3 rounded text-xs space-y-1">
              {pwaInfo && Object.entries(pwaInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-base-content/60">{key}:</span>
                  <span className={typeof value === 'boolean' ? (value ? 'text-success' : 'text-error') : ''}>
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Permissions */}
          <div>
            <h4 className="font-medium text-sm text-primary mb-2 flex items-center gap-1">
              <Camera className="w-4 h-4" />
              Camera Permissions
            </h4>
            <div className="bg-base-200 p-3 rounded text-xs space-y-1">
              {permissionInfo && Object.entries(permissionInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-base-content/60">{key}:</span>
                  <span className={key.includes('State') || key === 'camera' ? 
                    (value === 'granted' ? 'text-success' : value === 'denied' ? 'text-error' : 'text-warning') : ''
                  }>
                    {key === 'lastChecked' && typeof value === 'number' ? 
                      new Date(value).toLocaleString() : 
                      String(value)
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User Agent */}
          <div>
            <h4 className="font-medium text-sm text-primary mb-2">Device Info</h4>
            <div className="bg-base-200 p-3 rounded text-xs">
              <div className="break-all text-base-content/70">
                {navigator.userAgent}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={refreshPermissions}
              className="btn btn-primary btn-sm flex-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Permissions
            </button>
            <button
              onClick={updateInfo}
              className="btn btn-ghost btn-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Update Info
            </button>
          </div>

          {/* iOS PWA Tips */}
          {pwaInfo?.isIOSPWA && (
            <div className="alert alert-info text-xs">
              <Info className="w-4 h-4" />
              <div>
                <div className="font-semibold">iOS PWA Tips:</div>
                <ul className="text-xs mt-1 space-y-1">
                  <li>• Camera permissions may reset between sessions</li>
                  <li>• Try granting permissions in Safari first</li>
                  <li>• Restart the PWA if permissions seem stuck</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 