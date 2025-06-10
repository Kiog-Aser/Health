// Test script to add sample data for sync testing
// Run this in the browser console to add test data

const testData = {
  foodEntries: [
    {
      id: 'test-food-1',
      name: 'Test Apple',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4,
      sugar: 19,
      sodium: 1,
      timestamp: Date.now(),
      mealType: 'snack'
    },
    {
      id: 'test-food-2',
      name: 'Test Banana',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      fiber: 3,
      sugar: 14,
      sodium: 1,
      timestamp: Date.now() - 1000,
      mealType: 'breakfast'
    }
  ],
  workoutEntries: [
    {
      id: 'test-workout-1',
      name: 'Morning Run',
      type: 'cardio',
      duration: 30,
      calories: 300,
      intensity: 'moderate',
      timestamp: Date.now() - 2000
    }
  ],
  biomarkerEntries: [
    {
      id: 'test-bio-1',
      type: 'weight',
      value: 70.5,
      unit: 'kg',
      timestamp: Date.now() - 3000
    }
  ],
  goals: [
    {
      id: 'test-goal-1',
      title: 'Lose 5kg',
      description: 'Weight loss goal',
      type: 'weight_loss',
      targetValue: 65,
      currentValue: 70.5,
      unit: 'kg',
      targetDate: Date.now() + (90 * 24 * 60 * 60 * 1000),
      createdAt: Date.now() - 4000,
      isCompleted: false
    }
  ],
  userProfile: {
    id: 'test-user-1',
    name: 'Test User',
    age: 30,
    gender: 'male',
    height: 175,
    activityLevel: 'moderately_active',
    preferences: {
      units: 'metric',
      theme: 'auto',
      notifications: {
        mealReminders: true,
        workoutReminders: true,
        goalReminders: true,
        weeklyReports: true
      },
      privacy: {
        dataSharing: false,
        analytics: true
      },
      apiKeys: {
        geminiApiKey: ''
      }
    },
    createdAt: Date.now() - 5000,
    updatedAt: Date.now() - 1000
  }
};

// Function to add test data to localStorage
function addTestData() {
  console.log('Adding test data to localStorage...');
  
  // Add each data type to localStorage
  Object.keys(testData).forEach(key => {
    const existing = JSON.parse(localStorage.getItem(key) || (key === 'userProfile' ? 'null' : '[]'));
    
    if (key === 'userProfile') {
      localStorage.setItem(key, JSON.stringify(testData[key]));
    } else {
      const merged = Array.isArray(existing) ? [...existing, ...testData[key]] : testData[key];
      localStorage.setItem(key, JSON.stringify(merged));
    }
  });
  
  console.log('Test data added successfully!');
  console.log('You can now test the sync functionality.');
}

// Function to clear test data
function clearTestData() {
  console.log('Clearing test data...');
  Object.keys(testData).forEach(key => {
    if (key === 'userProfile') {
      localStorage.removeItem(key);
    } else {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter(item => !item.id?.startsWith('test-'));
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  });
  console.log('Test data cleared!');
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.addTestData = addTestData;
  window.clearTestData = clearTestData;
}

console.log('Test sync data script loaded!');
console.log('Run addTestData() to add test data');
console.log('Run clearTestData() to remove test data'); 