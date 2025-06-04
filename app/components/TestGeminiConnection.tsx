'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export default function TestGeminiConnection() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error' | 'not-configured'>('idle');
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setTesting(true);
    setResult('idle');
    setError('');

    try {
      // Check if configured
      if (!geminiService.isConfigured()) {
        setResult('not-configured');
        setError('Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.');
        return;
      }

      // Test connection
      const isConnected = await geminiService.testConnection();
      
      if (isConnected) {
        setResult('success');
      } else {
        setResult('error');
        setError('Failed to connect to Gemini API. Please check your API key and internet connection.');
      }
    } catch (err) {
      setResult('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (result) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'not-configured':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (result) {
      case 'success':
        return 'Gemini API connection successful! Food scanning is ready to use.';
      case 'error':
        return `Connection failed: ${error}`;
      case 'not-configured':
        return error;
      default:
        return 'Click the button above to test your Gemini API connection.';
    }
  };

  const getStatusColor = () => {
    switch (result) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'not-configured':
        return 'text-warning';
      default:
        return 'text-base-content/60';
    }
  };

  return (
    <div className="health-card p-6">
      <h3 className="text-lg font-semibold mb-4">🤖 AI Food Scanning Status</h3>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={testing}
          className="btn btn-primary btn-block"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test Gemini API Connection'
          )}
        </button>

        {result !== 'idle' && (
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            result === 'success' ? 'bg-success/10' : 
            result === 'error' ? 'bg-error/10' : 
            'bg-warning/10'
          }`}>
            {getStatusIcon()}
            <div className="flex-1">
              <p className={`text-sm ${getStatusColor()}`}>
                {getStatusMessage()}
              </p>
              
              {result === 'not-configured' && (
                <div className="mt-3">
                  <p className="text-xs text-base-content/60 mb-2">Quick setup:</p>
                  <ol className="text-xs text-base-content/60 list-decimal list-inside space-y-1">
                    <li>Get API key from <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="link link-primary">Google AI Studio</a></li>
                    <li>Create <code className="bg-base-200 px-1 rounded">.env.local</code> file</li>
                    <li>Add: <code className="bg-base-200 px-1 rounded">NEXT_PUBLIC_GEMINI_API_KEY=your_key</code></li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 