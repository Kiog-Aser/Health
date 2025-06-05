'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Apple, 
  Dumbbell, 
  TrendingUp, 
  Settings,
  MoreHorizontal,
  User
} from 'lucide-react';
import QuickCalorieWidget from '../ui/QuickCalorieWidget';

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
    { name: 'Settings', href: '/settings', icon: Settings, current: pathname === '/settings' || pathname === '/goals' || pathname === '/biomarkers' || pathname === '/profile' },
  ];

  // Primary navigation for bottom nav (most important 4 + more)
  const primaryNav = navigation.slice(0, 4);
  const secondaryNav = navigation.slice(4);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Desktop Header with Full Navigation */}
      <header className="navbar bg-base-200/80 backdrop-blur-md shadow-sm border-b border-base-300/50">
        <div className="navbar-start">
          <Link href="/dashboard" className="btn btn-ghost text-xl font-bold gradient-text">
            🏥 HealthTracker
          </Link>
        </div>
        
        {/* Desktop Navigation - Center */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 bg-base-100/80 backdrop-blur-sm rounded-box shadow-sm border border-base-300/50">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      item.current 
                        ? 'active bg-primary text-primary-content shadow-lg' 
                        : 'hover:bg-base-200 hover:shadow-md'
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
        
        <div className="navbar-end gap-3">
          {/* Quick Calorie Widget - Desktop only */}
          <div className="hidden lg:block">
            <QuickCalorieWidget />
          </div>
          
          {/* Mobile more menu for secondary nav */}
          <div className="lg:hidden">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300/50">
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
          
          {/* Desktop user menu */}
          <div className="hidden lg:block">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <User className="w-4 h-4" />
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
      </header>

      {/* Main Content with padding for bottom nav on mobile */}
      <main className="container mx-auto px-4 py-6 max-w-7xl pb-20 lg:pb-6">
        {children}
      </main>

      {/* Bottom Navigation for Mobile - Mobile App Style */}
      <div className="btm-nav lg:hidden bg-base-200/80 backdrop-blur-md border-t border-base-300/50">
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
        
        {/* More button */}
        <div className="dropdown dropdown-top dropdown-end">
          <div tabIndex={0} role="button" className={`${
            secondaryNav.some(item => item.current) 
              ? 'active text-primary bg-primary/10' 
              : 'text-base-content/60 hover:text-primary'
          } transition-all duration-300`}>
            <MoreHorizontal className="w-5 h-5" />
            <span className="btm-nav-label text-xs">More</span>
          </div>
          <ul tabIndex={0} className="dropdown-content menu menu-sm z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 mb-2 border border-base-300/50">
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