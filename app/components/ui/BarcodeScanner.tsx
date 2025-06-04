'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Zap } from 'lucide-react';

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
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleScanSuccess = useCallback((decodedText: string) => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    onScanSuccess(decodedText);
  }, [onScanSuccess]);

  const handleScanFailure = useCallback((error: string) => {
    // Handle scan failure silently - most "failures" are just lack of barcode in view
    console.log(error);
  }, []);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      try {
        setError(null);
        setIsScanning(true);
        
        scannerRef.current = new Html5QrcodeScanner(
          "barcode-scanner-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
            aspectRatio: 1.777778,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
          },
          false
        );

        scannerRef.current.render(handleScanSuccess, handleScanFailure);
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to initialize camera. Please check permissions and try again.');
        setIsScanning(false);
      }
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          console.error('Error clearing scanner:', err);
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, handleScanSuccess, handleScanFailure]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-[90vw] max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Scan Barcode</h2>
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

        {/* Scanner Content */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-error text-sm mb-4">{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  window.location.reload(); // Reload to reinitialize camera
                }}
                className="btn btn-primary btn-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Scanner Container */}
              <div className="relative">
                <div 
                  id="barcode-scanner-container" 
                  className="rounded-xl overflow-hidden bg-black/5"
                  style={{ minHeight: '300px' }}
                />
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                    <div className="bg-base-100 rounded-xl p-4 shadow-lg">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span className="ml-2 text-sm">Initializing camera...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 space-y-2">
                <h3 className="font-medium text-sm">Instructions:</h3>
                <ul className="text-xs text-base-content/60 space-y-1">
                  <li>• Hold the barcode steady in the camera view</li>
                  <li>• Ensure good lighting for best results</li>
                  <li>• The scanner will automatically detect the barcode</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="btn btn-outline btn-block"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 