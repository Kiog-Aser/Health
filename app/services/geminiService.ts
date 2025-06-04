'use client';

import { GoogleGenAI } from '@google/genai';
import { FoodEntry } from '../types';

// Gemini API configuration using environment variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

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
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
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
   * Analyze food image using Gemini Vision API
   */
  async analyzeFoodImage(imageFile: File): Promise<FoodAnalysisResult | null> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment.');
      }

      const base64Data = await this.fileToBase64(imageFile);
      
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

      // Generate content with text and image using the new API
      const response = await this.ai.models.generateContent({
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
      console.log('Gemini response:', responseText);

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

      return {
        name: result.name,
        calories: Math.round(result.calories),
        protein: Math.round((result.protein || 0) * 10) / 10,
        carbs: Math.round((result.carbs || 0) * 10) / 10,
        fat: Math.round((result.fat || 0) * 10) / 10,
        fiber: Math.round((result.fiber || 0) * 10) / 10,
        sugar: Math.round((result.sugar || 0) * 10) / 10,
        sodium: Math.round(result.sodium || 0),
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        analysis: result.analysis || 'Food analysis completed'
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
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' && GEMINI_API_KEY.length > 10;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
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