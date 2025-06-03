import { FoodEntry, UserProfile, HealthTip, AIInsight, BiomarkerEntry, DailyStats } from '../types';

// Gemini API configuration using environment variables
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  confidence: number;
  analysis: string;
}

class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = GEMINI_API_KEY;
  }

  private async makeGeminiRequest(prompt: string, imageBase64?: string): Promise<string> {
    try {
      const body: any = {
        contents: [{
          parts: []
        }]
      };

      if (imageBase64) {
        body.contents[0].parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: imageBase64
          }
        });
      }

      body.contents[0].parts.push({
        text: prompt
      });

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  async analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
    const prompt = `
      Analyze this food image and provide detailed nutritional information. 
      Please provide your response in the following JSON format:
      
      {
        "name": "Food name",
        "calories": number,
        "protein": number (in grams),
        "carbs": number (in grams),
        "fat": number (in grams),
        "fiber": number (in grams),
        "sugar": number (in grams),
        "sodium": number (in mg),
        "confidence": number (0-1, how confident you are in this analysis),
        "analysis": "Brief description of what you see and your estimation reasoning"
      }
      
      Important guidelines:
      - Estimate portion sizes based on visual cues in the image
      - Consider typical serving sizes for the identified food items
      - Be conservative with calorie estimates if unsure
      - Provide realistic nutritional values
      - If you can't identify the food clearly, indicate low confidence
      - Include any visible ingredients or components in your analysis
      
      Only respond with valid JSON, no other text.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt, imageBase64);
      
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!result.name || typeof result.calories !== 'number') {
        throw new Error('Invalid response structure from Gemini');
      }

      return {
        name: result.name,
        calories: Math.round(result.calories),
        protein: Math.round(result.protein * 10) / 10,
        carbs: Math.round(result.carbs * 10) / 10,
        fat: Math.round(result.fat * 10) / 10,
        fiber: Math.round(result.fiber * 10) / 10,
        sugar: Math.round(result.sugar * 10) / 10,
        sodium: Math.round(result.sodium),
        confidence: Math.min(1, Math.max(0, result.confidence)),
        analysis: result.analysis
      };
    } catch (error) {
      console.error('Failed to analyze food image:', error);
      // Return fallback values
      return {
        name: 'Unknown Food',
        calories: 200,
        protein: 5,
        carbs: 25,
        fat: 8,
        fiber: 2,
        sugar: 5,
        sodium: 100,
        confidence: 0.1,
        analysis: 'Unable to analyze the image. Please add nutritional information manually.'
      };
    }
  }

  async generatePersonalizedTips(
    userProfile: UserProfile,
    recentFoodEntries: FoodEntry[],
    recentBiomarkers: BiomarkerEntry[],
    dailyStats: DailyStats[]
  ): Promise<HealthTip[]> {
    const prompt = `
      Based on the following user data, generate 3-5 personalized health tips:
      
      User Profile:
      - Age: ${userProfile.age}
      - Gender: ${userProfile.gender}
      - Height: ${userProfile.height}cm
      - Activity Level: ${userProfile.activityLevel}
      
      Recent Food Intake (last 7 days):
      ${recentFoodEntries.map(entry => 
        `- ${entry.name}: ${entry.calories} cal, ${entry.protein}g protein, ${entry.carbs}g carbs, ${entry.fat}g fat`
      ).join('\n')}
      
      Recent Biomarkers:
      ${recentBiomarkers.map(entry => 
        `- ${entry.type}: ${entry.value} ${entry.unit}`
      ).join('\n')}
      
      Daily Stats Summary:
      ${dailyStats.map(stat => 
        `- ${stat.date}: ${stat.calories.consumed} cal consumed, ${stat.workoutMinutes} min exercise`
      ).join('\n')}
      
      Please provide your response in the following JSON format:
      [
        {
          "title": "Tip title",
          "content": "Detailed tip content with actionable advice",
          "category": "nutrition|exercise|sleep|stress|general",
          "priority": "low|medium|high"
        }
      ]
      
      Focus on:
      - Specific, actionable advice
      - Areas for improvement based on the data
      - Positive reinforcement for good habits
      - Realistic goals and changes
      
      Only respond with valid JSON array, no other text.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      const tips = JSON.parse(jsonMatch[0]);
      
      return tips.map((tip: any, index: number) => ({
        id: `tip_${Date.now()}_${index}`,
        title: tip.title,
        content: tip.content,
        category: tip.category,
        priority: tip.priority,
        isPersonalized: true,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to generate personalized tips:', error);
      // Return fallback tips
      return [
        {
          id: `tip_${Date.now()}_fallback`,
          title: 'Stay Hydrated',
          content: 'Aim to drink at least 8 glasses of water throughout the day to maintain optimal hydration.',
          category: 'general',
          priority: 'medium',
          isPersonalized: false,
          timestamp: Date.now()
        }
      ];
    }
  }

  async generateHealthInsights(
    userProfile: UserProfile,
    foodEntries: FoodEntry[],
    workoutEntries: any[],
    biomarkerEntries: BiomarkerEntry[]
  ): Promise<AIInsight[]> {
    const prompt = `
      Analyze the following health data and generate insights about trends, patterns, and recommendations:
      
      User: ${userProfile.age} year old ${userProfile.gender}, ${userProfile.height}cm, ${userProfile.activityLevel} activity level
      
      Food Data (last 30 days):
      Total Entries: ${foodEntries.length}
      Average Daily Calories: ${foodEntries.reduce((sum, entry) => sum + entry.calories, 0) / foodEntries.length || 0}
      
      Workout Data:
      Total Workouts: ${workoutEntries.length}
      Total Duration: ${workoutEntries.reduce((sum, entry) => sum + entry.duration, 0)} minutes
      
      Biomarker Trends:
      ${biomarkerEntries.map(entry => `${entry.type}: ${entry.value} ${entry.unit}`).join(', ')}
      
      Generate insights in this JSON format:
      [
        {
          "type": "trend|recommendation|warning|achievement",
          "title": "Insight title",
          "message": "Detailed insight message",
          "data": {}
        }
      ]
      
      Focus on:
      - Identifying positive and negative trends
      - Celebrating achievements
      - Highlighting areas needing attention
      - Providing actionable recommendations
      
      Only respond with valid JSON array, no other text.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      const insights = JSON.parse(jsonMatch[0]);
      
      return insights.map((insight: any, index: number) => ({
        id: `insight_${Date.now()}_${index}`,
        type: insight.type,
        title: insight.title,
        message: insight.message,
        data: insight.data || {},
        timestamp: Date.now(),
        isRead: false
      }));
    } catch (error) {
      console.error('Failed to generate health insights:', error);
      return [];
    }
  }

  async generateMealSuggestions(
    userProfile: UserProfile,
    targetCalories: number,
    macroTargets: { protein: number; carbs: number; fat: number },
    dietaryRestrictions: string[] = []
  ): Promise<any[]> {
    const prompt = `
      Generate meal suggestions for a ${userProfile.age} year old ${userProfile.gender} with ${userProfile.activityLevel} activity level.
      
      Requirements:
      - Target Calories: ${targetCalories}
      - Target Protein: ${macroTargets.protein}g
      - Target Carbs: ${macroTargets.carbs}g
      - Target Fat: ${macroTargets.fat}g
      - Dietary Restrictions: ${dietaryRestrictions.join(', ') || 'None'}
      
      Provide 3 meal suggestions (breakfast, lunch, dinner) in this JSON format:
      [
        {
          "meal": "breakfast|lunch|dinner",
          "name": "Meal name",
          "description": "Brief description",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "ingredients": ["ingredient1", "ingredient2"],
          "instructions": "Simple preparation instructions"
        }
      ]
      
      Only respond with valid JSON array, no other text.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to generate meal suggestions:', error);
      return [];
    }
  }

  async analyzeWorkoutEffectiveness(
    workoutEntries: any[],
    userProfile: UserProfile
  ): Promise<string> {
    const prompt = `
      Analyze the workout effectiveness for a ${userProfile.age} year old ${userProfile.gender} with ${userProfile.activityLevel} activity level.
      
      Recent Workouts:
      ${workoutEntries.map(workout => 
        `- ${workout.name}: ${workout.type}, ${workout.duration} min, ${workout.intensity} intensity`
      ).join('\n')}
      
      Provide analysis on:
      - Workout frequency and consistency
      - Exercise variety and balance
      - Intensity distribution
      - Recommendations for improvement
      
      Keep the response under 300 words and focus on actionable insights.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      return response.trim();
    } catch (error) {
      console.error('Failed to analyze workout effectiveness:', error);
      return 'Unable to analyze workout data at this time. Please ensure you have recorded sufficient workout history.';
    }
  }

  // Utility method to check if API key is configured
  isConfigured(): boolean {
    return this.apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && this.apiKey.length > 0;
  }

  // Method to update API key
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

export const geminiService = new GeminiService(); 