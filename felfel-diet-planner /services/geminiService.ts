import { GoogleGenAI, Type } from "@google/genai";
import { ScannedFoodItem, MealSuggestion, NutritionData } from '../types.ts';

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
}

export const analyzeFoodLabel = async (apiKey: string, imageBase64: string, mimeType: string): Promise<ScannedFoodItem> => {
  const ai = new GoogleGenAI({ apiKey });
  const imagePart = fileToGenerativePart(imageBase64, mimeType);
  const prompt = "Analyze the attached image of a food nutrition label. Extract the food item name and nutritional information. Crucially, identify the serving size (e.g., '100g') and the number of servings per container. Provide the nutritional values (calories, protein, carbs, fat) *per serving*. Also list major vitamins with their amounts. Return a single, minified JSON object with keys: 'name', 'calories', 'protein', 'carbs', 'fat', 'vitamins', 'servingSize', and 'servingsPerContainer'. If servings per container is not specified, calculate it from total weight and serving size if possible, otherwise default to 1. If a value is not found, use 0 or an empty array.";

  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    vitamins: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                amount: { type: Type.STRING },
                            },
                        },
                    },
                    servingSize: { type: Type.STRING, description: "The serving size, e.g., '100g' or '1 cup'" },
                    servingsPerContainer: { type: Type.NUMBER, description: "The number of servings in the whole package. Default to 1 if not specified." }
                },
                required: ["name", "calories", "protein", "carbs", "fat", "servingSize", "servingsPerContainer"],
            }
        }
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse as ScannedFoodItem;
  } catch (error: any) {
    console.error("Error analyzing food label:", error);
    if (error.message.includes('API key not valid')) {
        throw new Error("Invalid API Key. Please check your key and try again.");
    }
    throw new Error("Failed to analyze food label. The image might be unclear or not a valid nutrition label.");
  }
};

export const recommendMeals = async (apiKey: string, remainingNeeds: NutritionData): Promise<MealSuggestion[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
        Based on the following remaining nutritional needs for today, please recommend 2 simple meal options.
        For each meal, provide a name, a brief description, and an estimated breakdown of its nutrition.
        Remaining needs: ${JSON.stringify(remainingNeeds)}.
        Return a JSON array of objects.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            nutrition: {
                                type: Type.OBJECT,
                                properties: {
                                    calories: { type: Type.NUMBER },
                                    protein: { type: Type.NUMBER },
                                    carbs: { type: Type.NUMBER },
                                    fat: { type: Type.NUMBER },
                                },
                            },
                        },
                    },
                },
            },
        });
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse as MealSuggestion[];
    } catch (error) {
        console.error("Error recommending meals:", error);
        throw new Error("Failed to get meal recommendations.");
    }
};