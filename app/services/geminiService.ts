'use client';

import { GoogleGenAI } from '@google/genai';
import { FoodEntry } from '../types';
import { databaseService } from './database';

interface DetailedIngredient {
  name: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
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
  vitaminC: number;
  calcium: number;
  iron: number;
  potassium: number;
  vitaminA: number;
  vitaminD: number;
  saturatedFat: number;
  cholesterol: number;
  confidence: number;
  analysis: string;
  detectedIngredients: DetailedIngredient[];
  recommendedMealType: FoodEntry['mealType'];
  mealTypeConfidence: number;
  portionSize: string;
  healthScore: number;
  healthNotes: string[];
  cookingMethod?: string;
  cuisine?: string;
  allergens: string[];
  nutritionHighlights: string[];
  servingRecommendation: string;
}

class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // AI instance will be initialized when needed with user's API key
  }

  /**
   * Get user's Gemini API key from stored preferences
   */
  private async getApiKey(): Promise<string | null> {
    try {
      const profile = await databaseService.getUserProfile();
      return profile?.preferences?.apiKeys?.geminiApiKey || null;
    } catch (error) {
      console.error('Failed to get API key:', error);
      return null;
    }
  }

  /**
   * Initialize AI instance with user's API key
   */
  private async initializeAI(): Promise<void> {
    const apiKey = await this.getApiKey();
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.ai = null;
    }
  }

  /**
   * Convert a File object to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Determine meal type based on food characteristics and time of day
   */
  private determineMealType(foodName: string, currentHour?: number): { 
    mealType: FoodEntry['mealType']; 
    confidence: number;
  } {
    const hour = currentHour || new Date().getHours();
    const lowerName = foodName.toLowerCase();

    // Time-based suggestions
    let timeSuggestion: FoodEntry['mealType'] = 'snack';
    if (hour >= 6 && hour < 11) timeSuggestion = 'breakfast';
    else if (hour >= 11 && hour < 15) timeSuggestion = 'lunch';
    else if (hour >= 17 && hour < 22) timeSuggestion = 'dinner';

    // Food-based classification
    const breakfastKeywords = ['cereal', 'toast', 'pancake', 'waffle', 'coffee', 'juice', 'fruit', 'yogurt', 'oatmeal', 'eggs', 'bacon'];
    const lunchKeywords = ['sandwich', 'salad', 'soup', 'wrap', 'burger', 'pizza', 'pasta', 'rice'];
    const dinnerKeywords = ['steak', 'chicken', 'fish', 'roast', 'casserole', 'curry', 'stir fry'];
    const snackKeywords = ['chip', 'cookie', 'candy', 'nut', 'bar', 'cracker', 'fruit'];

    let foodSuggestion: FoodEntry['mealType'] = 'snack';
    let confidence = 0.3;

    if (breakfastKeywords.some(keyword => lowerName.includes(keyword))) {
      foodSuggestion = 'breakfast';
      confidence = 0.7;
    } else if (lunchKeywords.some(keyword => lowerName.includes(keyword))) {
      foodSuggestion = 'lunch';
      confidence = 0.7;
    } else if (dinnerKeywords.some(keyword => lowerName.includes(keyword))) {
      foodSuggestion = 'dinner';
      confidence = 0.7;
    } else if (snackKeywords.some(keyword => lowerName.includes(keyword))) {
      foodSuggestion = 'snack';
      confidence = 0.8;
    }

    // Combine time and food suggestions
    if (foodSuggestion === timeSuggestion) {
      return { mealType: foodSuggestion, confidence: Math.min(confidence + 0.2, 1.0) };
    } else {
      // If time and food don't match, prefer food suggestion but lower confidence
      return { mealType: foodSuggestion, confidence: confidence * 0.8 };
    }
  }

  /**
   * Analyze food image using enhanced Gemini Vision API
   */
  async analyzeFoodImage(imageFile: File): Promise<FoodAnalysisResult | null> {
    try {
      await this.initializeAI();
      if (!this.ai) {
        throw new Error('Gemini API key not configured. Please add your API key in Settings.');
      }

      const base64Data = await this.fileToBase64(imageFile);
      
      const prompt = `
        Analyze this food image and provide comprehensive nutritional and contextual information. 
        Please provide your response in the following JSON format:
        
        {
          "name": "Primary food name (be specific, e.g., 'Grilled Chicken Caesar Salad' not just 'Salad')",
          "calories": number (estimated total calories for the visible portion),
          "protein": number (in grams),
          "carbs": number (in grams),
          "fat": number (in grams),
          "fiber": number (in grams),
          "sugar": number (in grams),
          "sodium": number (in mg),
          "vitaminC": number (in mg, 0 if none),
          "calcium": number (in mg, 0 if none),
          "iron": number (in mg, 0 if none),
          "potassium": number (in mg, 0 if none),
          "vitaminA": number (in IU, 0 if none),
          "vitaminD": number (in IU, 0 if none),
          "saturatedFat": number (in grams),
          "cholesterol": number (in mg),
          "confidence": number (0-1, overall confidence in nutritional analysis),
          "analysis": "Detailed description of what you see and reasoning for estimates",
          "detectedIngredients": [
            {
              "name": "ingredient name",
              "quantity": "estimated amount (e.g., '2 cups', '100g')",
              "calories": estimated_calories_for_this_ingredient,
              "protein": protein_grams,
              "carbs": carb_grams,
              "fat": fat_grams
            }
          ],
          "portionSize": "Description of portion size (e.g., 'Large serving', 'Single portion', '2 cups')",
          "healthScore": number (1-10, where 10 is very healthy),
          "healthNotes": ["specific health-related observations"],
          "cookingMethod": "apparent cooking method if visible",
          "cuisine": "cuisine type if identifiable",
          "allergens": ["potential allergens present"],
          "nutritionHighlights": ["key nutritional benefits or concerns"],
          "servingRecommendation": "suggested serving size for optimal nutrition"
        }
        
        Analysis Guidelines:
        - Estimate portion sizes carefully based on visual cues (plates, utensils, hands for scale)
        - Consider preparation methods that affect nutrition (fried vs grilled, etc.)
        - Identify all visible ingredients and components
        - Provide realistic nutritional values based on standard food databases
        - Be conservative with estimates if uncertain
        - Note any visible sauces, dressings, or added fats
        - Consider cooking methods that affect calorie content
        - Health score should consider nutritional balance, processing level, and ingredient quality
        - Include common allergens: dairy, eggs, nuts, soy, wheat, shellfish, fish
        - Estimate micronutrients based on visible ingredients (fruits/vegetables for vitamins, dairy for calcium, etc.)
        - Include key nutritional highlights (high protein, good source of fiber, antioxidants, etc.)
        
        Only respond with valid JSON, no other text.
      `;

      // Generate content with text and image using the new API
      const response = await this.ai!.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: imageFile.type,
                },
              },
            ],
          },
        ],
      });

      if (!response || !response.text) {
        throw new Error('No response received from Gemini');
      }

      const responseText = response.text;
      console.log('Enhanced Gemini response:', responseText);

      // Clean the response to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!result.name || typeof result.calories !== 'number') {
        throw new Error('Invalid response structure from Gemini');
      }

      // Determine meal type
      const mealTypeAnalysis = this.determineMealType(result.name);

      return {
        name: result.name,
        calories: Math.round(result.calories),
        protein: Math.round((result.protein || 0) * 10) / 10,
        carbs: Math.round((result.carbs || 0) * 10) / 10,
        fat: Math.round((result.fat || 0) * 10) / 10,
        fiber: Math.round((result.fiber || 0) * 10) / 10,
        sugar: Math.round((result.sugar || 0) * 10) / 10,
        sodium: Math.round(result.sodium || 0),
        vitaminC: Math.round(result.vitaminC || 0),
        calcium: Math.round(result.calcium || 0),
        iron: Math.round(result.iron || 0),
        potassium: Math.round(result.potassium || 0),
        vitaminA: Math.round(result.vitaminA || 0),
        vitaminD: Math.round(result.vitaminD || 0),
        saturatedFat: Math.round((result.saturatedFat || 0) * 10) / 10,
        cholesterol: Math.round(result.cholesterol || 0),
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        analysis: result.analysis || 'Food analysis completed',
        detectedIngredients: result.detectedIngredients || [],
        recommendedMealType: mealTypeAnalysis.mealType,
        mealTypeConfidence: mealTypeAnalysis.confidence,
        portionSize: result.portionSize || 'Standard serving',
        healthScore: Math.min(10, Math.max(1, result.healthScore || 5)),
        healthNotes: result.healthNotes || [],
        cookingMethod: result.cookingMethod,
        cuisine: result.cuisine,
        allergens: result.allergens || [],
        nutritionHighlights: result.nutritionHighlights || [],
        servingRecommendation: result.servingRecommendation || 'No serving recommendation provided'
      };
    } catch (error) {
      console.error('Failed to analyze food image:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('key')) {
          console.error('API Key Error: Please ensure NEXT_PUBLIC_GEMINI_API_KEY is set correctly');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          console.error('API Quota Error: You may have exceeded your API quota');
        } else if (error.message.includes('permission') || error.message.includes('authentication')) {
          console.error('Authentication Error: Please check your API key permissions');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.error('Network Error: Please check your internet connection');
        }
      }
      
      return null;
    }
  }

  /**
   * Get detailed ingredient analysis for inspection
   */
  async getIngredientDetails(ingredientName: string): Promise<any> {
    try {
      await this.initializeAI();
      if (!this.ai) {
        return null;
      }

      const prompt = `
        Provide detailed nutritional and health information about: ${ingredientName}
        
        Return JSON with:
        {
          "name": "${ingredientName}",
          "nutritionPer100g": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "vitamins": ["key vitamins"],
            "minerals": ["key minerals"]
          },
          "healthBenefits": ["list of health benefits"],
          "potentialConcerns": ["any health concerns"],
          "commonAllergens": ["allergens if any"],
          "bestPreparationMethods": ["cooking suggestions"]
        }
      `;

      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });

      if (response && response.text) {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get ingredient details:', error);
      return null;
    }
  }

  /**
   * Check if the service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return !!(apiKey && apiKey.length > 10);
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.initializeAI();
      if (!this.ai) {
        return false;
      }

      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: "Hello, this is a test.",
      });
      
      return !!(response && response.text);
    } catch (error) {
      console.error('Gemini API test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService; 