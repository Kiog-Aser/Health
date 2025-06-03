'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Apple, 
  Dumbbell, 
  TrendingUp, 
  User 
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    title: '🏥 HealthTracker Pro',
  },
  {
    name: 'Nutrition',
    href: '/food',
    icon: Apple,
    title: '🍎 Food Tracking',
  },
  {
    name: 'Fitness',
    href: '/workout',
    icon: Dumbbell,
    title: '💪 Workouts',
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    title: '📈 Progress',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    title: '👤 Profile',
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 