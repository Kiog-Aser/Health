import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '🏥 HealthTracker Pro',
  description: 'Your comprehensive health and fitness tracking companion',
  manifest: '/manifest.json',
  themeColor: '#007AFF',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HealthTracker Pro',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'HealthTracker Pro',
    title: 'HealthTracker Pro - Your Health Companion',
    description: 'Track your nutrition, workouts, and health metrics with ease',
  },
  twitter: {
    card: 'summary',
    title: 'HealthTracker Pro',
    description: 'Track your nutrition, workouts, and health metrics with ease',
  },
};

export const viewport: Viewport = {
  themeColor: '#007AFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <main className="min-h-screen bg-base-100">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
} 