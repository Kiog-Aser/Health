class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async showNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      actions?: Array<{ action: string; title: string; }>;
      requireInteraction?: boolean;
    } = {}
  ): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    const notificationOptions: any = {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-192x192.png',
      tag: options.tag || 'health-tracker',
      data: options.data || {},
      requireInteraction: options.requireInteraction || false,
      vibrate: [200, 100, 200], // Vibration pattern for mobile
    };

    // Add actions if using service worker (which supports actions)
    if (this.registration && options.actions) {
      notificationOptions.actions = options.actions;
    }

    if (this.registration) {
      // Use service worker for better notification handling
      await this.registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to basic notification
      new Notification(title, notificationOptions);
    }
  }

  // Meal reminder notifications
  async scheduleMealReminder(): Promise<void> {
    const now = new Date();
    const mealTimes = [
      { name: 'Breakfast', hour: 8, minute: 0 },
      { name: 'Lunch', hour: 12, minute: 30 },
      { name: 'Dinner', hour: 18, minute: 0 },
    ];

    for (const meal of mealTimes) {
      const mealTime = new Date();
      mealTime.setHours(meal.hour, meal.minute, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (mealTime <= now) {
        mealTime.setDate(mealTime.getDate() + 1);
      }

      const timeUntilMeal = mealTime.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.showNotification(
          `${meal.name} Time! 🍽️`,
          {
            body: `Don't forget to log your ${meal.name.toLowerCase()} in HealthTracker Pro`,
            tag: `meal-${meal.name.toLowerCase()}`,
            actions: [
              { action: 'log-meal', title: 'Log Meal' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          }
        );
        // Reschedule for next day
        this.scheduleMealReminder();
      }, timeUntilMeal);
    }
  }

  // Workout reminder notifications
  async scheduleWorkoutReminder(): Promise<void> {
    const now = new Date();
    const workoutTime = new Date();
    workoutTime.setHours(17, 0, 0, 0); // 5 PM default

    // If time has passed today, schedule for tomorrow
    if (workoutTime <= now) {
      workoutTime.setDate(workoutTime.getDate() + 1);
    }

    const timeUntilWorkout = workoutTime.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.showNotification(
        'Workout Time! 💪',
        {
          body: 'Ready to crush your fitness goals? Log your workout now!',
          tag: 'workout-reminder',
          actions: [
            { action: 'log-workout', title: 'Log Workout' },
            { action: 'skip', title: 'Skip Today' }
          ]
        }
      );
      // Reschedule for next day
      this.scheduleWorkoutReminder();
    }, timeUntilWorkout);
  }

  // Weekly check-in reminder
  async scheduleWeeklyCheckin(): Promise<void> {
    const now = new Date();
    const nextSunday = new Date();
    
    // Calculate next Sunday at 9 AM
    const daysUntilSunday = (7 - now.getDay()) % 7;
    nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    nextSunday.setHours(9, 0, 0, 0);

    const timeUntilCheckin = nextSunday.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.showNotification(
        'Weekly Check-in Time! 📊',
        {
          body: 'Time for your weekly progress check-in. How are you doing this week?',
          tag: 'weekly-checkin',
          requireInteraction: true,
          actions: [
            { action: 'checkin', title: 'Do Check-in' },
            { action: 'later', title: 'Remind Later' }
          ]
        }
      );
      // Reschedule for next week
      this.scheduleWeeklyCheckin();
    }, timeUntilCheckin);
  }

  // Goal deadline reminder
  async scheduleGoalReminder(goalName: string, deadline: Date): Promise<void> {
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    
    // Remind 1 day before deadline
    const reminderTime = timeUntilDeadline - (24 * 60 * 60 * 1000);
    
    if (reminderTime > 0) {
      setTimeout(async () => {
        await this.showNotification(
          'Goal Deadline Approaching! 🎯',
          {
            body: `Your goal "${goalName}" is due tomorrow. Keep pushing!`,
            tag: `goal-${goalName}`,
            actions: [
              { action: 'view-goal', title: 'View Goal' },
              { action: 'dismiss', title: 'Got it' }
            ]
          }
        );
      }, reminderTime);
    }
  }

  // Hydration reminder
  async scheduleHydrationReminder(): Promise<void> {
    const reminderInterval = 2 * 60 * 60 * 1000; // Every 2 hours
    
    const scheduleNext = () => {
      setTimeout(async () => {
        const now = new Date();
        const hour = now.getHours();
        
        // Only send during waking hours (8 AM - 10 PM)
        if (hour >= 8 && hour < 22) {
          await this.showNotification(
            'Stay Hydrated! 💧',
            {
              body: 'Time for a glass of water. Your body will thank you!',
              tag: 'hydration',
              actions: [
                { action: 'log-water', title: 'Log Water' },
                { action: 'dismiss', title: 'Dismiss' }
              ]
            }
          );
        }
        
        // Schedule next reminder
        scheduleNext();
      }, reminderInterval);
    };
    
    scheduleNext();
  }

  // Initialize all notifications based on user preferences
  async initializeNotifications(preferences: {
    mealReminders: boolean;
    workoutReminders: boolean;
    goalReminders: boolean;
    weeklyReports: boolean;
  }): Promise<void> {
    await this.init();
    
    if (preferences.mealReminders) {
      await this.scheduleMealReminder();
    }
    
    if (preferences.workoutReminders) {
      await this.scheduleWorkoutReminder();
    }
    
    if (preferences.weeklyReports) {
      await this.scheduleWeeklyCheckin();
    }
    
    // Always schedule hydration reminders for health
    await this.scheduleHydrationReminder();
  }

  // Handle notification clicks
  setupNotificationHandlers(): void {
    if (typeof window === 'undefined') return;

    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'notification-click') {
        const { action, tag } = event.data;
        
        switch (action) {
          case 'log-meal':
            window.location.href = '/food';
            break;
          case 'log-workout':
            window.location.href = '/workout';
            break;
          case 'checkin':
            window.location.href = '/progress';
            break;
          case 'view-goal':
            window.location.href = '/goals';
            break;
          case 'log-water':
            // Could open a quick water logging modal
            break;
        }
      }
    });
  }
}

export const notificationService = new NotificationService(); 