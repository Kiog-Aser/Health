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
  User 
} from 'lucide-react';

interface AppLayoutProps {
  title: string;
  children: ReactNode;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: pathname === '/' },
    { name: 'Food', href: '/food', icon: Apple, current: pathname === '/food' },
    { name: 'Workouts', href: '/workout', icon: Dumbbell, current: pathname === '/workout' },
    { name: 'Progress', href: '/progress', icon: TrendingUp, current: pathname === '/progress' },
    { name: 'Goals', href: '/goals', icon: Target, current: pathname === '/goals' },
    { name: 'Biomarkers', href: '/biomarkers', icon: Activity, current: pathname === '/biomarkers' },
    { name: 'Profile', href: '/profile', icon: User, current: pathname === '/profile' },
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <header className="navbar bg-base-200 shadow-sm">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold">
            {title}
          </Link>
        </div>
        <div className="navbar-end">
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
          
          {/* Mobile menu */}
          <div className="lg:hidden">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="btm-nav lg:hidden bg-base-200">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={item.current ? 'active' : ''}
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