import axios from 'axios';
import { FoodEntry } from '../types';

interface NutritionFacts {
  energy_100g?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  salt_100g?: number;
  sodium_100g?: number;
}

interface OpenFoodFactsProduct {
  product: {
    product_name?: string;
    brands?: string;
    quantity?: string;
    serving_size?: string;
    nutriments?: NutritionFacts;
    image_url?: string;
    nutrition_grade_fr?: string;
    categories?: string;
  };
  status: number;
  status_verbose: string;
}

interface FoodSearchResult {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize?: string;
  imageUrl?: string;
  grade?: string;
  categories?: string;
  confidence: number;
}

class NutritionDatabaseService {
  private baseUrl = 'https://world.openfoodfacts.org/api/v0/product';
  
  async searchByBarcode(barcode: string): Promise<FoodSearchResult | null> {
    try {
      const response = await axios.get<OpenFoodFactsProduct>(`${this.baseUrl}/${barcode}.json`);
      
      if (response.data.status === 0) {
        return null; // Product not found
      }

      const product = response.data.product;
      
      if (!product.product_name || !product.nutriments) {
        return null;
      }

      return this.parseProduct(product);
    } catch (error) {
      console.error('Error fetching product from barcode:', error);
      return null;
    }
  }

  async searchByName(query: string, limit = 10): Promise<FoodSearchResult[]> {
    try {
      const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl`, {
        params: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: limit,
        },
      });

      if (!response.data.products) {
        return [];
      }

      return response.data.products
        .map((product: any) => this.parseProduct(product))
        .filter((result: FoodSearchResult | null) => result !== null);
    } catch (error) {
      console.error('Error searching for products:', error);
      return [];
    }
  }

  private parseProduct(product: any): FoodSearchResult | null {
    const nutriments = product.nutriments || {};
    
    // Convert per 100g values to reasonable serving size
    const servingSize = this.parseServingSize(product.serving_size || product.quantity);
    const multiplier = servingSize.grams / 100;

    const name = product.product_name || 'Unknown Product';
    const brand = product.brands?.split(',')[0]?.trim();
    
    // Extract nutrition values (per 100g) and convert to serving size
    const calories = (nutriments.energy_100g || nutriments['energy-kcal_100g'] || 0) * multiplier;
    const protein = (nutriments.proteins_100g || 0) * multiplier;
    const carbs = (nutriments.carbohydrates_100g || 0) * multiplier;
    const fat = (nutriments.fat_100g || 0) * multiplier;
    const fiber = (nutriments.fiber_100g || 0) * multiplier;
    const sugar = (nutriments.sugars_100g || 0) * multiplier;
    const sodium = (nutriments.sodium_100g || nutriments.salt_100g / 2.5 || 0) * multiplier;

    // Calculate confidence based on available data
    let confidence = 0.5;
    if (name && name !== 'Unknown Product') confidence += 0.2;
    if (brand) confidence += 0.1;
    if (calories > 0) confidence += 0.1;
    if (protein >= 0 && carbs >= 0 && fat >= 0) confidence += 0.1;

    return {
      name: brand ? `${brand} ${name}` : name,
      brand,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      sugar: Math.round(sugar * 10) / 10,
      sodium: Math.round(sodium),
      servingSize: `${servingSize.grams}g`,
      imageUrl: product.image_url,
      grade: product.nutrition_grade_fr?.toUpperCase(),
      categories: product.categories,
      confidence: Math.min(confidence, 1),
    };
  }

  private parseServingSize(servingSizeString?: string): { grams: number; description: string } {
    if (!servingSizeString) {
      return { grams: 100, description: '100g' };
    }

    // Try to extract grams from various formats
    const cleanString = servingSizeString.toLowerCase().trim();
    
    // Look for patterns like "250g", "2.5 kg", "500 ml", etc.
    const gramMatch = cleanString.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?/);
    if (gramMatch) {
      return { 
        grams: parseFloat(gramMatch[1]), 
        description: `${gramMatch[1]}g` 
      };
    }

    const kgMatch = cleanString.match(/(\d+(?:\.\d+)?)\s*kg/);
    if (kgMatch) {
      return { 
        grams: parseFloat(kgMatch[1]) * 1000, 
        description: `${kgMatch[1]}kg` 
      };
    }

    // For liquids, assume 1ml = 1g (approximation)
    const mlMatch = cleanString.match(/(\d+(?:\.\d+)?)\s*ml/);
    if (mlMatch) {
      return { 
        grams: parseFloat(mlMatch[1]), 
        description: `${mlMatch[1]}ml` 
      };
    }

    const lMatch = cleanString.match(/(\d+(?:\.\d+)?)\s*l(?:iter)?s?/);
    if (lMatch) {
      return { 
        grams: parseFloat(lMatch[1]) * 1000, 
        description: `${lMatch[1]}L` 
      };
    }

    // Extract any number and assume it's grams
    const numberMatch = cleanString.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      return { 
        grams: parseFloat(numberMatch[1]), 
        description: `${numberMatch[1]}g` 
      };
    }

    // Default to 100g serving
    return { grams: 100, description: '100g' };
  }

  // Convert search result to FoodEntry for database storage
  createFoodEntry(searchResult: FoodSearchResult, mealType: FoodEntry['mealType'] = 'snack'): FoodEntry {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: searchResult.name,
      calories: searchResult.calories,
      protein: searchResult.protein,
      carbs: searchResult.carbs,
      fat: searchResult.fat,
      fiber: searchResult.fiber,
      sugar: searchResult.sugar,
      sodium: searchResult.sodium,
      timestamp: Date.now(),
      mealType,
      confidence: searchResult.confidence,
      imageUri: searchResult.imageUrl,
      aiAnalysis: searchResult.grade ? `Nutri-Score: ${searchResult.grade}` : undefined,
    };
  }

  // Get multiple food suggestions for a search term
  async getFoodSuggestions(query: string): Promise<FoodSearchResult[]> {
    if (query.length < 2) return [];
    
    // Check if it's a barcode (all numbers, 8-13 digits)
    if (/^\d{8,13}$/.test(query)) {
      const result = await this.searchByBarcode(query);
      return result ? [result] : [];
    }
    
    return this.searchByName(query, 5);
  }
}

export const nutritionDatabase = new NutritionDatabaseService(); 