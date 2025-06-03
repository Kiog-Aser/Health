/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#5AC8FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'health': '0 4px 20px -2px rgba(0, 122, 255, 0.15)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          'primary': '#007AFF',
          'secondary': '#5856D6',
          'accent': '#5AC8FA',
          'neutral': '#F2F2F7',
          'base-100': '#FFFFFF',
          'base-200': '#F2F2F7',
          'base-300': '#E5E5EA',
          'info': '#5AC8FA',
          'success': '#34C759',
          'warning': '#FF9500',
          'error': '#FF3B30',
        },
        dark: {
          'primary': '#0A84FF',
          'secondary': '#5E5CE6',
          'accent': '#64D2FF',
          'neutral': '#1C1C1E',
          'base-100': '#000000',
          'base-200': '#1C1C1E',
          'base-300': '#2C2C2E',
          'info': '#64D2FF',
          'success': '#30D158',
          'warning': '#FF9F0A',
          'error': '#FF453A',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    prefix: '',
    logs: true,
    themeRoot: ':root',
  },
}; 