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

// Common food database for quick lookups
const COMMON_FOODS = [
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, servingSize: '1 medium (182g)' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, servingSize: '1 medium (118g)' },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9, sodium: 0, servingSize: '1 medium (154g)' },
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, servingSize: '100g' },
  { name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0, sodium: 5, servingSize: '100g cooked' },
  { name: 'White Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0, sodium: 5, servingSize: '100g cooked' },
  { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59, servingSize: '100g' },
  { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, sodium: 124, servingSize: '2 large eggs' },
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2, sodium: 36, servingSize: '100g' },
  { name: 'Oatmeal', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7, sugar: 0, sodium: 49, servingSize: '100g cooked' },
  { name: 'Broccoli', calories: 25, protein: 3, carbs: 5, fat: 0.4, fiber: 2.3, sugar: 1, sodium: 41, servingSize: '100g' },
  { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4, sodium: 54, servingSize: '100g' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 1, sodium: 7, servingSize: '100g' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sugar: 4, sodium: 1, servingSize: '100g' },
  { name: 'Greek Salad', calories: 150, protein: 8, carbs: 12, fat: 10, fiber: 4, sugar: 8, sodium: 580, servingSize: '1 serving' },
  { name: 'Caesar Salad', calories: 184, protein: 10, carbs: 9, fat: 13, fiber: 3, sugar: 5, sodium: 470, servingSize: '1 serving' },
  { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, fiber: 2.8, sugar: 0, sodium: 7, servingSize: '100g cooked' },
  { name: 'Turkey Sandwich', calories: 350, protein: 30, carbs: 35, fat: 12, fiber: 4, sugar: 6, sodium: 950, servingSize: '1 sandwich' },
  { name: 'Protein Shake', calories: 150, protein: 25, carbs: 5, fat: 3, fiber: 1, sugar: 4, sodium: 200, servingSize: '1 scoop' },
  { name: 'Green Smoothie', calories: 180, protein: 4, carbs: 40, fat: 2, fiber: 8, sugar: 30, sodium: 50, servingSize: '1 cup' }
];

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
      // First, search common foods for quick matches
      const commonMatches = this.searchCommonFoods(query);
      
      // Then search OpenFoodFacts
      const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl`, {
        params: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: limit - commonMatches.length,
          sort_by: 'popularity',
        },
      });

      const openFoodResults = response.data.products 
        ? response.data.products
            .map((product: any) => this.parseProduct(product))
            .filter((result: FoodSearchResult | null) => result !== null)
            .filter((result: any) => this.isValidFoodResult(result))
        : [];

      // Combine and sort results
      const allResults = [...commonMatches, ...openFoodResults];
      
      // Sort by relevance (exact matches first, then by confidence)
      return allResults
        .sort((a, b) => {
          // Exact name matches first
          const aExact = a.name.toLowerCase().includes(query.toLowerCase());
          const bExact = b.name.toLowerCase().includes(query.toLowerCase());
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Then by confidence
          return b.confidence - a.confidence;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching for products:', error);
      // Return common foods if API fails
      return this.searchCommonFoods(query);
    }
  }

  private searchCommonFoods(query: string): FoodSearchResult[] {
    const queryLower = query.toLowerCase();
    return COMMON_FOODS
      .filter(food => 
        food.name.toLowerCase().includes(queryLower) ||
        queryLower.includes(food.name.toLowerCase())
      )
      .map(food => ({
        ...food,
        confidence: food.name.toLowerCase() === queryLower ? 1.0 : 0.9
      }))
      .slice(0, 3); // Limit common foods to top 3 matches
  }

  private isValidFoodResult(result: FoodSearchResult): boolean {
    // Filter out invalid or low-quality results
    if (!result.name || result.name.trim().length < 2) return false;
    if (result.calories < 0 || result.calories > 2000) return false; // Reasonable calorie range
    if (result.name.toLowerCase().includes('test')) return false;
    if (result.name.length > 100) return false; // Too long names are usually junk
    
    return true;
  }

  private cleanProductName(name: string, brand?: string): string {
    if (!name) return 'Unknown Product';
    
    // Remove common unnecessary words and characters
    let cleaned = name
      .replace(/\b(bio|organic|natural|fresh|100%)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Capitalize first letter of each word
    cleaned = cleaned.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Add brand if it's not already in the name and if it's short
    if (brand && !cleaned.toLowerCase().includes(brand.toLowerCase()) && brand.length < 20) {
      const cleanBrand = brand.split(',')[0].trim();
      cleaned = `${cleanBrand} ${cleaned}`;
    }
    
    return cleaned;
  }

  private parseProduct(product: any): FoodSearchResult | null {
    const nutriments = product.nutriments || {};
    
    // Convert per 100g values to reasonable serving size
    const servingSize = this.parseServingSize(product.serving_size || product.quantity);
    const multiplier = servingSize.grams / 100;

    const name = this.cleanProductName(product.product_name, product.brands?.split(',')[0]?.trim());
    
    // Extract nutrition values (per 100g) and convert to serving size
    const calories = (nutriments.energy_100g || nutriments['energy-kcal_100g'] || 0) * multiplier;
    const protein = (nutriments.proteins_100g || 0) * multiplier;
    const carbs = (nutriments.carbohydrates_100g || 0) * multiplier;
    const fat = (nutriments.fat_100g || 0) * multiplier;
    const fiber = (nutriments.fiber_100g || 0) * multiplier;
    const sugar = (nutriments.sugars_100g || 0) * multiplier;
    const sodium = (nutriments.sodium_100g || (nutriments.salt_100g ? nutriments.salt_100g / 2.5 : 0) || 0) * multiplier;

    // Calculate confidence based on available data and data quality
    let confidence = 0.3;
    if (name && name !== 'Unknown Product' && name.length > 3) confidence += 0.2;
    if (product.brands) confidence += 0.1;
    if (calories > 0 && calories < 1000) confidence += 0.2; // Reasonable calorie range
    if (protein >= 0 && carbs >= 0 && fat >= 0) confidence += 0.1;
    if (fiber >= 0) confidence += 0.05;
    if (product.nutrition_grade_fr) confidence += 0.05;

    return {
      name,
      brand: product.brands?.split(',')[0]?.trim(),
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
    
    return this.searchByName(query, 8);
  }
}

export const nutritionDatabase = new NutritionDatabaseService(); 