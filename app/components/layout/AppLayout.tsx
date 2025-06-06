'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Apple, 
  Dumbbell, 
  TrendingUp, 
  Settings,
  User
} from 'lucide-react';
import QuickCalorieWidget from '../ui/QuickCalorieWidget';
import { notificationService } from '../../services/notificationService';
import { databaseService } from '../../services/database';

interface AppLayoutProps {
  title: string;
  children: ReactNode;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  const pathname = usePathname();

  // Initialize notifications on app load
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await databaseService.init();
        const profile = await databaseService.getUserProfile();
        
        if (profile?.preferences?.notifications) {
          await notificationService.initializeNotifications(profile.preferences.notifications);
          notificationService.setupNotificationHandlers();
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: pathname === '/dashboard' || pathname === '/' },
    { name: 'Food', href: '/food', icon: Apple, current: pathname === '/food' },
    { name: 'Workouts', href: '/workout', icon: Dumbbell, current: pathname === '/workout' },
    { name: 'Progress', href: '/progress', icon: TrendingUp, current: pathname === '/progress' },
    { name: 'Settings', href: '/settings', icon: Settings, current: pathname === '/settings' || pathname === '/goals' || pathname === '/biomarkers' || pathname === '/profile' },
  ];

  // All navigation items for bottom nav
  const primaryNav = navigation;

  return (
    <div className="min-h-screen bg-base-100">
      {/* Main Content with padding for bottom nav on mobile */}
      <main className="container mx-auto px-4 py-6 max-w-7xl pb-24 lg:pb-6">
        {/* Desktop Navigation - Compact */}
        <div className="hidden lg:flex justify-between items-center mb-8 p-4 bg-base-200/50 backdrop-blur-sm rounded-2xl border border-base-300/50">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            🏥 HealthTracker Pro
          </Link>
          
          <div className="flex items-center gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    item.current 
                      ? 'bg-primary text-primary-content shadow-lg' 
                      : 'hover:bg-base-300 text-base-content/70 hover:text-base-content'
                  }`}
                >
                                      <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center gap-3">
            <QuickCalorieWidget />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300/50">
                <li><Link href="/settings">Profile & Settings</Link></li>
                <li><Link href="/progress">Progress Reports</Link></li>
                <li><hr className="my-2" /></li>
                <li><a>Sign Out</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        {children}
      </main>

      {/* Bottom Navigation for Mobile - Mobile App Style */}
      <div className="btm-nav lg:hidden bg-base-200/80 backdrop-blur-md border-t border-base-300/50 h-20">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                item.current 
                  ? 'active text-primary bg-primary/10' 
                  : 'text-base-content/60 hover:text-primary'
              } transition-all duration-300`}
            >
              <Icon className="w-5 h-5" />
              <span className="btm-nav-label text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 