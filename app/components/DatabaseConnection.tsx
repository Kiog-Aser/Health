'use client';

import React, { useState } from 'react';
import { Database, Check, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';
import { externalDatabaseService } from '../services/externalDatabase';

interface DatabaseConnectionProps {
  className?: string;
}

const FREE_DB_PROVIDERS = [
  {
    name: 'Supabase',
    description: 'PostgreSQL with real-time features',
    url: 'https://supabase.com',
    freeTier: '2 projects, 500MB storage',
    icon: '🗃️',
    color: 'from-green-500 to-emerald-600',
    setup: 'Create project → Copy database URL'
  },
  {
    name: 'Neon',
    description: 'Serverless PostgreSQL',
    url: 'https://neon.tech',
    freeTier: '3GB storage, 100h compute',
    icon: '⚡',
    color: 'from-blue-500 to-indigo-600',
    setup: 'Sign up → Create database → Copy connection string'
  },
  {
    name: 'Turso',
    description: 'Edge SQLite database',
    url: 'https://turso.tech',
    freeTier: '8 databases, 1GB storage',
    icon: '🚀',
    color: 'from-purple-500 to-violet-600',
    setup: 'Create account → New database → Get URL'
  }
];

export default function DatabaseConnection({ className = "" }: DatabaseConnectionProps) {
  const [connectionString, setConnectionString] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectionString, setShowConnectionString] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async () => {
    if (!connectionString.trim()) return;
    
    setIsConnecting(true);
    
    try {
      const success = await externalDatabaseService.connect(connectionString);
      if (success) {
        setIsConnected(true);
      } else {
        alert('Failed to connect to database. Please check your connection string.');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await externalDatabaseService.disconnect();
    setIsConnected(false);
    setConnectionString('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Check if already connected on component mount
  React.useEffect(() => {
    const stored = localStorage.getItem('dbConnectionString');
    if (stored) {
      setConnectionString(stored);
      const isDbConnected = externalDatabaseService.isConnectedToDatabase();
      setIsConnected(isDbConnected);
    }
  }, []);

  return (
    <div className={`health-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Database Connection
        </h3>
        {isConnected && (
          <div className="flex items-center gap-2 text-success text-sm bg-success/10 px-3 py-1 rounded-full">
            <Check className="w-4 h-4" />
            Connected & Auto-Syncing
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-6">
          {/* Free Database Providers - Only show when not connected */}
          <div>
            <h4 className="text-sm font-medium text-base-content/80 mb-4">
              🎁 Recommended Free Database Providers
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {FREE_DB_PROVIDERS.map((provider) => (
                <div 
                  key={provider.name}
                  className="p-4 rounded-lg border border-base-300 hover:border-base-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{provider.icon}</span>
                      <h5 className="font-medium text-sm">{provider.name}</h5>
                    </div>
                    <a
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-focus"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-base-content/60 mb-2">
                    {provider.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-success font-medium">
                      {provider.freeTier}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/50 mt-2">
                    {provider.setup}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection String Input */}
          <div>
            <label className="text-sm font-medium text-base-content/80 mb-2 block">
              Database Connection String
            </label>
            <div className="relative">
              <input
                type={showConnectionString ? "text" : "password"}
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder="postgres://username:password@hostname:port/database"
                className="input input-bordered w-full pr-20 text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowConnectionString(!showConnectionString)}
                  className="btn btn-ghost btn-xs"
                >
                  {showConnectionString ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {connectionString && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(connectionString)}
                    className="btn btn-ghost btn-xs"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-base-content/60 mt-2">
              Your connection string is stored locally and encrypted. We never see your database credentials.
            </p>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={!connectionString.trim() || isConnecting}
            className="btn btn-primary w-full"
          >
            {isConnecting ? (
              <>
                <div className="loading loading-spinner loading-sm"></div>
                Testing Connection...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Connect Database
              </>
            )}
          </button>

          {/* Help Text */}
          <div className="p-4 rounded-lg bg-info/10 border border-info/20">
            <h5 className="text-sm font-medium text-info mb-2">💡 Quick Setup Guide</h5>
            <ol className="text-xs text-base-content/70 space-y-1 list-decimal list-inside">
              <li>Choose a free database provider above</li>
              <li>Create an account and database</li>
              <li>Copy the connection string</li>
              <li>Paste it above and click "Connect Database"</li>
              <li>Your data will automatically sync across all devices!</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <h4 className="text-lg font-semibold text-success mb-2">
              Database Connected & Auto-Syncing!
            </h4>
            <p className="text-sm text-base-content/60">
              Your health data automatically syncs across all devices in real-time.
            </p>
          </div>

          {/* Sync Status */}
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <h5 className="text-sm font-medium text-success mb-2">🔄 Auto-Sync Features</h5>
            <ul className="text-xs text-base-content/70 space-y-1">
              <li>• <strong>Real-time:</strong> Changes sync instantly when you add data</li>
              <li>• <strong>Cross-device:</strong> Data appears on all your devices within 15 minutes</li>
              <li>• <strong>Smart merging:</strong> Prevents conflicts when using multiple devices</li>
              <li>• <strong>Always secure:</strong> Your data stays private in your own database</li>
            </ul>
          </div>

          {/* Connection Details */}
          <div className="p-4 rounded-lg bg-base-200/50">
            <h5 className="text-sm font-medium mb-2">Connection Details</h5>
            <div className="flex items-center justify-between">
              <span className="text-xs text-base-content/60 font-mono">
                {connectionString.substring(0, 20)}...{connectionString.slice(-10)}
              </span>
              <button
                onClick={() => copyToClipboard(connectionString)}
                className="btn btn-ghost btn-xs"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDisconnect}
              className="btn btn-ghost flex-1"
            >
              Disconnect
            </button>
            <button
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const syncResult = await externalDatabaseService.syncAllData();
                  if (syncResult.success) {
                    const syncedCounts = syncResult.syncedCounts;
                    const pullCounts = syncResult.pullCounts;
                    
                    let message = `✅ ${syncResult.message}\n\n`;
                    
                    if (syncedCounts) {
                      const totalSynced = Object.values(syncedCounts).reduce((sum: number, count: number) => sum + count, 0);
                      if (totalSynced > 0) {
                        message += `Uploaded ${totalSynced} items to cloud\n`;
                      }
                    }
                    
                    if (pullCounts) {
                      const totalPulled = Object.values(pullCounts).reduce((sum: number, count: number) => sum + count, 0);
                      if (totalPulled > 0) {
                        message += `Downloaded ${totalPulled} items from other devices\n`;
                      }
                    }
                    
                    if (!syncedCounts && !pullCounts) {
                      message += 'Everything is already up to date!';
                    }
                    
                    alert(message);
                  } else {
                    alert(`❌ ${syncResult.message}`);
                  }
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="btn btn-primary flex-1"
            >
              {isSyncing ? (
                <>
                  <div className="loading loading-spinner loading-sm"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Manual Sync
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 