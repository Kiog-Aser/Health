'use client';

import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from '../../../app/providers';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'Auto', icon: Palette },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-md border-b border-base-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-base-content">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="dropdown dropdown-end">
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-circle"
              aria-label="Theme selector"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </div>
            <ul 
              tabIndex={0} 
              className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300"
            >
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <li key={option.value}>
                    <button
                      onClick={() => setTheme(option.value)}
                      className={`flex items-center gap-3 ${
                        theme === option.value ? 'active bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                      {theme === option.value && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary"></div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
} 