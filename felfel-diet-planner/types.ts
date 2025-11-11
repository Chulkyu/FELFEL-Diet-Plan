export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  sugar?: number;
  fiber?: number;
}

export interface ScannedFoodItem extends NutritionData {
  name: string;
  vitamins?: { name: string; amount: string; }[];
  servingSize?: string;
  servingsPerContainer?: number;
}

export interface MealSuggestion {
  name: string;
  description: string;
  nutrition: NutritionData;
}

export type NutrientKey = keyof NutritionData;