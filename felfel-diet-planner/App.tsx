import React, { useState, useCallback, useMemo } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { UserProfile, NutritionData, ScannedFoodItem, MealSuggestion, NutrientKey } from './types.ts';
import { calculateDailyGoals } from './services/nutritionService.ts';
import { analyzeFoodLabel, recommendMeals } from './services/geminiService.ts';
import { FireIcon, ProteinIcon, CarbIcon, FatIcon, CameraIcon, LightbulbIcon } from './components/icons.tsx';
import NutritionChart from './components/NutritionChart.tsx';

const defaultProfile: UserProfile = { height: 175, weight: 70, age: 30, gender: 'male', activityLevel: 'moderate', goal: 'maintain' };
const initialIntake: NutritionData = { calories: 0, protein: 0, carbs: 0, fat: 0 };

// Main App Component
export default function App() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [dailyGoals, setDailyGoals] = useState<NutritionData>(calculateDailyGoals(defaultProfile));
  const [dailyIntake, setDailyIntake] = useState<NutritionData>(initialIntake);
  const [showProfileSetup, setShowProfileSetup] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scannedItem, setScannedItem] = useState<ScannedFoodItem | null>(null);
  const [recommendations, setRecommendations] = useState<MealSuggestion[]>([]);

  const [animationParent] = useAutoAnimate();

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: name === 'gender' || name === 'activityLevel' || name === 'goal' ? value : Number(value) }));
  };

  const handleProfileSave = () => {
    const newGoals = calculateDailyGoals(profile);
    setDailyGoals(newGoals);
    setShowProfileSetup(false);
    setError(null);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        handleScan(reader.result as string, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = useCallback(async (imageDataUrl: string, mimeType: string) => {
    setIsLoading(true);
    setError(null);
    setScannedItem(null);
    try {
      const base64Data = imageDataUrl.split(',')[1];
      const result = await analyzeFoodLabel(base64Data, mimeType);
      setScannedItem(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddToLog = (item: ScannedFoodItem) => {
    const multiplier = item.servingsPerContainer || 1;
    setDailyIntake(prev => ({
      calories: prev.calories + (item.calories || 0) * multiplier,
      protein: prev.protein + (item.protein || 0) * multiplier,
      carbs: prev.carbs + (item.carbs || 0) * multiplier,
      fat: prev.fat + (item.fat || 0) * multiplier,
    }));
    setScannedItem(null);
    setImagePreview(null);
  };
  
  const handleGetRecommendations = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      setRecommendations([]);
      const remainingNeeds: NutritionData = {
          calories: Math.max(0, dailyGoals.calories - dailyIntake.calories),
          protein: Math.max(0, dailyGoals.protein - dailyIntake.protein),
          carbs: Math.max(0, dailyGoals.carbs - dailyIntake.carbs),
          fat: Math.max(0, dailyGoals.fat - dailyIntake.fat),
      };
      try {
          const result = await recommendMeals(remainingNeeds);
          setRecommendations(result);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setIsLoading(false);
      }
  }, [dailyGoals, dailyIntake]);

  const nutrientConfig: { key: NutrientKey; icon: React.ReactNode; unit: string }[] = [
    { key: 'protein', icon: <ProteinIcon />, unit: 'g' },
    { key: 'carbs', icon: <CarbIcon />, unit: 'g' },
    { key: 'fat', icon: <FatIcon />, unit: 'g' },
  ];

  const caloriePercentage = dailyGoals.calories > 0 ? (dailyIntake.calories / dailyGoals.calories) * 100 : 0;
  const calorieColor = caloriePercentage > 110 ? "text-red-400" : caloriePercentage > 90 ? "text-yellow-400" : "text-green-400";


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            FELFEL Diet Planner
          </h1>
          <button onClick={() => setShowProfileSetup(s => !s)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            {showProfileSetup ? 'Close Profile' : 'Edit Profile'}
          </button>
        </header>

        <main ref={animationParent}>
          {showProfileSetup ? (
            <ProfileSetup 
              profile={profile}
              onProfileChange={handleProfileChange}
              onSave={handleProfileSave}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                 {/* Dashboard */}
                 <section className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 text-slate-200">Daily Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center justify-center bg-slate-800 p-6 rounded-xl">
                            <div className="relative">
                               <svg className="w-32 h-32 transform -rotate-90">
                                   <circle cx="64" cy="64" r="54" strokeWidth="10" className="stroke-slate-700" fill="transparent"/>
                                   <circle
                                       cx="64" cy="64" r="54" strokeWidth="10"
                                       className={`stroke-current ${calorieColor} transition-all duration-500`}
                                       fill="transparent"
                                       strokeDasharray={2 * Math.PI * 54}
                                       strokeDashoffset={(2 * Math.PI * 54) * (1 - Math.min(caloriePercentage, 100) / 100)}
                                       strokeLinecap="round"
                                   />
                               </svg>
                               <div className="absolute inset-0 flex flex-col items-center justify-center">
                                   <FireIcon className={`w-8 h-8 mb-1 ${calorieColor}`} />
                                   <span className="text-2xl font-bold text-white">{dailyIntake.calories.toFixed(0)}</span>
                                   <span className="text-sm text-slate-400">/ {dailyGoals.calories.toFixed(0)} kcal</span>
                               </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {nutrientConfig.map(({ key, icon }) => (
                                <NutritionChart key={key} nutrient={key} current={dailyIntake[key] as number} goal={dailyGoals[key] as number} icon={icon} />
                            ))}
                            <div className="sm:col-span-2 bg-slate-800 p-4 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => handleGetRecommendations()}>
                               <LightbulbIcon className="w-6 h-6 mr-3 text-yellow-400"/>
                               <span className="font-semibold">Get Meal Ideas</span>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Meal Recommendations */}
                 { (isLoading || recommendations.length > 0) &&
                  <section className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700" ref={animationParent}>
                      <h2 className="text-2xl font-bold mb-4 text-slate-200">Meal Recommendations</h2>
                      {isLoading && !recommendations.length && <Spinner message="Generating recommendations..."/>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.map(meal => (
                          <div key={meal.name} className="bg-slate-800 p-4 rounded-lg">
                            <h3 className="font-bold text-lg text-cyan-400">{meal.name}</h3>
                            <p className="text-sm text-slate-300 mb-2">{meal.description}</p>
                            <div className="flex justify-around text-xs text-slate-400 border-t border-slate-700 pt-2 mt-2">
                                <span>🔥 {meal.nutrition.calories} kcal</span>
                                <span>💪 {meal.nutrition.protein}g P</span>
                                <span>🍞 {meal.nutrition.carbs}g C</span>
                                <span>🥑 {meal.nutrition.fat}g F</span>
                            </div>
                          </div>
                        ))}
                      </div>
                  </section>
                 }

              </div>

              {/* Right Sidebar */}
              <div className="space-y-6" ref={animationParent}>
                <section className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 text-slate-200">Log Food</h2>
                     <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 font-semibold rounded-lg h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-600">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Label preview" className="w-full h-full object-contain rounded-lg"/>
                        ) : (
                            <>
                                <CameraIcon className="w-12 h-12 text-slate-500 mb-2" />
                                <span>Scan Food Label</span>
                                <span className="text-xs text-slate-500">Tap to upload image</span>
                            </>
                        )}
                    </label>
                    <input id="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </section>

                 {isLoading && !scannedItem && <Spinner message="Analyzing label..." />}
                 {error && <ErrorMessage message={error} />}

                 {scannedItem && (
                    <section className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-cyan-500/30">
                        <div className="mb-3">
                            <h3 className="text-xl font-bold text-cyan-400">{scannedItem.name}</h3>
                             <p className="text-xs text-slate-400">
                                Serving Size: {scannedItem.servingSize || 'N/A'} | Servings: {scannedItem.servingsPerContainer || 1}
                            </p>
                        </div>
                        
                        <p className="text-sm font-semibold text-slate-300 mb-2">Nutrition for entire package:</p>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <p><strong>Calories:</strong> {(scannedItem.calories * (scannedItem.servingsPerContainer || 1)).toFixed(0)}</p>
                            <p><strong>Protein:</strong> {(scannedItem.protein * (scannedItem.servingsPerContainer || 1)).toFixed(0)}g</p>
                            <p><strong>Carbs:</strong> {(scannedItem.carbs * (scannedItem.servingsPerContainer || 1)).toFixed(0)}g</p>
                            <p><strong>Fat:</strong> {(scannedItem.fat * (scannedItem.servingsPerContainer || 1)).toFixed(0)}g</p>
                        </div>
                        {scannedItem.vitamins && scannedItem.vitamins.length > 0 && (
                            <div className="border-t border-slate-700 pt-3 mt-3">
                                <h4 className="font-semibold text-slate-300 mb-2">Vitamins & Minerals</h4>
                                <ul className="text-xs text-slate-400 space-y-1">
                                    {scannedItem.vitamins.map(v => (
                                        <li key={v.name} className="flex justify-between">
                                            <span>{v.name}</span>
                                            <span>{v.amount}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button onClick={() => handleAddToLog(scannedItem)} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4">
                            Add Full Package to Daily Log
                        </button>
                    </section>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Sub-components
const ProfileSetup: React.FC<{profile: UserProfile, onProfileChange: (e: any) => void, onSave: () => void}> = ({profile, onProfileChange, onSave}) => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-200">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Height (cm)" name="height" type="number" value={profile.height} onChange={onProfileChange} />
                <Input label="Weight (kg)" name="weight" type="number" value={profile.weight} onChange={onProfileChange} />
                <Input label="Age" name="age" type="number" value={profile.age} onChange={onProfileChange} />
                <Select label="Gender" name="gender" value={profile.gender} onChange={onProfileChange} options={[
                    {value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}, {value: 'other', label: 'Other'}
                ]} />
                <div className="md:col-span-2">
                    <Select label="Health Goal" name="goal" value={profile.goal} onChange={onProfileChange} options={[
                        {value: 'lose', label: 'Weight Loss'},
                        {value: 'maintain', label: 'Maintain Weight'},
                        {value: 'gain', label: 'Muscle Gain'},
                    ]} />
                </div>
                <div className="md:col-span-2">
                    <Select label="Activity Level" name="activityLevel" value={profile.activityLevel} onChange={onProfileChange} options={[
                        {value: 'sedentary', label: 'Sedentary (little or no exercise)'},
                        {value: 'light', label: 'Lightly active (light exercise/sports 1-3 days/week)'},
                        {value: 'moderate', label: 'Moderately active (moderate exercise/sports 3-5 days/week)'},
                        {value: 'active', label: 'Very active (hard exercise/sports 6-7 days a week)'},
                        {value: 'very_active', label: 'Extra active (very hard exercise/physical job)'},
                    ]} />
                </div>
            </div>
            <button onClick={onSave} className="mt-6 w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                Calculate & Save Goals
            </button>
        </div>
    );
};

const Input: React.FC<{label: string, name: string, type: string, value: number, onChange: (e: any) => void}> = ({label, name, type, value, onChange}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
    </div>
);

const Select: React.FC<{label: string, name: string, value: string, onChange: (e: any) => void, options: {value: string, label: string}[]}> = ({label, name, value, onChange, options}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const Spinner: React.FC<{message: string}> = ({message}) => (
  <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-800 rounded-lg">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mb-3"></div>
    <p className="text-slate-300">{message}</p>
  </div>
);

const ErrorMessage: React.FC<{message: string}> = ({message}) => (
    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
    </div>
);