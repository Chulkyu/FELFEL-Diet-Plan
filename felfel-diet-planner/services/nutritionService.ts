import { UserProfile, NutritionData } from '../types';

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Define macro splits for different goals
const goalMacros = {
    lose: { p: 0.40, c: 0.35, f: 0.25 },
    maintain: { p: 0.30, c: 0.40, f: 0.30 },
    gain: { p: 0.35, c: 0.45, f: 0.20 },
};

export const calculateDailyGoals = (profile: UserProfile): NutritionData => {
  const { height, weight, age, gender, activityLevel, goal } = profile;

  if (!height || !weight || !age) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  let bmr: number;
  if (gender === 'male') {
    // Harris-Benedict Equation for men
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    // Harris-Benedict Equation for women (and 'other' as a fallback)
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  const tdee = bmr * activityMultipliers[activityLevel];
  
  let targetCalories = tdee;
  switch(goal) {
      case 'lose':
          targetCalories -= 500;
          break;
      case 'gain':
          targetCalories += 400;
          break;
      case 'maintain':
      default:
          // No change for maintain
          break;
  }

  const macros = goalMacros[goal];
  const calories = Math.round(targetCalories);
  const protein = Math.round((targetCalories * macros.p) / 4);
  const carbs = Math.round((targetCalories * macros.c) / 4);
  const fat = Math.round((targetCalories * macros.f) / 9);

  return { calories, protein, carbs, fat };
};