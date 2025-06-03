# 🏥 HealthTracker Pro - Next.js Web App

A comprehensive health and fitness tracking web application built with Next.js, featuring PWA capabilities and AI-powered food scanning.

## 🚀 Features

- **📊 Dashboard**: Comprehensive health overview with daily stats, weekly charts, and AI insights
- **🍎 Food Tracking**: Log meals, track calories and macronutrients with AI-powered food scanning
- **🤖 AI Food Scanning**: Use your camera to scan food and get instant nutritional analysis
- **💪 Workout Tracking**: Record exercises, sessions, and fitness progress
- **📈 Progress Analytics**: Visualize health trends and goal achievements
- **👤 User Profile**: Manage personal information and app preferences
- **🌙 Dark/Light Theme**: Automatic theme switching with manual override
- **📱 PWA Support**: Install as a native-like app on any device
- **🎨 Modern UI**: Beautiful interface with Tailwind CSS and DaisyUI

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **AI/ML**: Google Gemini 2.0 Flash for food recognition
- **Styling**: Tailwind CSS + DaisyUI
- **Icons**: Lucide React
- **PWA**: next-pwa
- **TypeScript**: Full type safety
- **Charts**: Recharts (ready for integration)
- **Database**: MongoDB with Mongoose (configured)
- **Authentication**: NextAuth.js (configured)

## 🏃‍♂️ Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure AI Food Scanning** (Optional but recommended):
   ```bash
   # Create environment file
   cp .env.example .env.local
   
   # Add your Gemini API key to .env.local
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Visit [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

The app can be installed as a PWA on any device:

- **Desktop**: Click the install icon in your browser's address bar
- **Mobile**: Use "Add to Home Screen" from your browser menu
- **Features**: Offline support, push notifications, native-like experience

## 🤖 AI Food Scanning

The app features advanced AI-powered food recognition using Google's Gemini 2.0 Flash model:

### Features:
- **📸 Camera Integration**: Use your device's camera to scan food
- **🔍 Smart Recognition**: Identify food items from images
- **📊 Nutritional Analysis**: Get detailed nutrition info (calories, protein, carbs, fat, fiber, etc.)
- **🎯 Confidence Scoring**: AI provides confidence levels for accuracy
- **⚡ Instant Results**: Fast analysis with immediate feedback

### How to Use:
1. Go to the Food Tracking page
2. Click "Scan Food" button
3. Grant camera permissions when prompted
4. Point camera at your food
5. Tap capture button
6. AI analyzes and adds nutrition data automatically

### Setup:
1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env.local` file:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
3. Restart your development server

**Note**: The feature works entirely in the browser and requires an internet connection for AI analysis.

## 🎨 Customization

### Themes
The app supports three theme modes:
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes
- **Auto**: Follows system preference

### Colors
Customize the health-themed color palette in `tailwind.config.js`:
- Primary: #007AFF (iOS blue)
- Success: #34C759 (Health green)
- Warning: #FF9500 (Alert orange)
- Error: #FF3B30 (Danger red)

## 📂 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── food/             # Food tracking page
│   ├── workout/          # Workout tracking page
│   ├── progress/         # Progress analytics page
│   ├── profile/          # User profile page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page (redirects to dashboard)
│   ├── providers.tsx     # Theme and context providers
│   └── globals.css       # Global styles
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/      # Layout components
│   │   └── navigation/  # Navigation components
│   ├── types/           # TypeScript type definitions
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and database services
│   └── utils/           # Utility functions
├── public/
│   ├── manifest.json    # PWA manifest
│   └── icons/          # PWA icons
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check

## 🌟 Conversion from Expo

This project was converted from a React Native/Expo app to a Next.js web application:

### What Changed:
- ✅ React Native components → HTML/CSS components
- ✅ Expo navigation → Next.js App Router
- ✅ React Native styling → Tailwind CSS + DaisyUI
- ✅ Expo icons → Lucide React icons
- ✅ Mobile-first → Responsive web design
- ✅ Native features → Web alternatives

### What's Preserved:
- ✅ All core functionality and features
- ✅ Type safety with TypeScript
- ✅ Modern React patterns
- ✅ Health tracking logic
- ✅ Database integration ready
- ✅ Authentication ready

## 🚧 Roadmap

- [ ] Complete database integration
- [ ] Add chart components with Recharts
- [x] Implement camera-based food scanning with AI
- [ ] Add push notifications
- [ ] Integrate fitness device APIs
- [ ] Add social features
- [ ] Implement data export/import

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [DaisyUI](https://daisyui.com)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

---

**Note**: This is a web-first health tracking application designed to provide a superior experience compared to traditional mobile apps, with the flexibility to work on any device with a modern web browser. 