'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Apple, 
  Dumbbell, 
  TrendingUp, 
  Target, 
  Activity, 
  User,
  MoreHorizontal
} from 'lucide-react';

interface AppLayoutProps {
  title: string;
  children: ReactNode;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: pathname === '/dashboard' || pathname === '/' },
    { name: 'Food', href: '/food', icon: Apple, current: pathname === '/food' },
    { name: 'Workouts', href: '/workout', icon: Dumbbell, current: pathname === '/workout' },
    { name: 'Progress', href: '/progress', icon: TrendingUp, current: pathname === '/progress' },
    { name: 'Goals', href: '/goals', icon: Target, current: pathname === '/goals' },
    { name: 'Biomarkers', href: '/biomarkers', icon: Activity, current: pathname === '/biomarkers' },
    { name: 'Profile', href: '/profile', icon: User, current: pathname === '/profile' },
  ];

  // Primary navigation for bottom nav (most important 4 + more)
  const primaryNav = navigation.slice(0, 4);
  const secondaryNav = navigation.slice(4);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header - Simplified for mobile app feel */}
      <header className="navbar bg-base-200 shadow-sm">
        <div className="navbar-start">
          <Link href="/dashboard" className="btn btn-ghost text-xl font-bold">
            🏥 HealthTracker
          </Link>
        </div>
        <div className="navbar-end">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 ${
                        item.current ? 'active' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
          {/* Mobile more menu for secondary nav */}
          <div className="lg:hidden">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                {secondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 ${
                          item.current ? 'active' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with padding for bottom nav on mobile */}
      <main className="container mx-auto px-4 py-6 max-w-7xl pb-20 lg:pb-6">
        {children}
      </main>

      {/* Bottom Navigation for Mobile - Mobile App Style */}
      <div className="btm-nav lg:hidden bg-base-200 border-t border-base-300">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${item.current ? 'active text-primary' : 'text-base-content/60'} transition-colors`}
            >
              <Icon className="w-5 h-5" />
              <span className="btm-nav-label text-xs">{item.name}</span>
            </Link>
          );
        })}
        
        {/* More button */}
        <div className="dropdown dropdown-top dropdown-end">
          <div tabIndex={0} role="button" className={`${secondaryNav.some(item => item.current) ? 'active text-primary' : 'text-base-content/60'} transition-colors`}>
            <MoreHorizontal className="w-5 h-5" />
            <span className="btm-nav-label text-xs">More</span>
          </div>
          <ul tabIndex={0} className="dropdown-content menu menu-sm z-[1] p-2 shadow bg-base-100 rounded-box w-52 mb-2">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 ${
                      item.current ? 'active' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
} 