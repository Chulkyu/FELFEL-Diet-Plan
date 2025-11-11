
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { NutrientKey } from '../types.ts';

interface NutritionChartProps {
  nutrient: NutrientKey;
  current: number;
  goal: number;
  icon: React.ReactNode;
}

const NutritionChart: React.FC<NutritionChartProps> = ({ nutrient, current, goal, icon }) => {
  const percentage = goal > 0 ? (current / goal) * 100 : 0;
  
  const data = useMemo(() => [
    { name: nutrient, current: current, goal: goal }
  ], [nutrient, current, goal]);

  const barColor = useMemo(() => {
    if (percentage > 110) return "#ef4444"; // red-500
    if (percentage > 90) return "#facc15"; // yellow-400
    return "#4ade80"; // green-400
  }, [percentage]);

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 mr-3 text-cyan-400">{icon}</div>
        <div>
          <h3 className="text-lg font-bold capitalize text-white">{nutrient}</h3>
          <p className="text-sm text-slate-400">
            <span className="font-semibold" style={{color: barColor}}>{current.toFixed(0)}</span> / {goal.toFixed(0)} g
          </p>
        </div>
      </div>
      <div className="flex-grow w-full h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis type="number" hide={true} domain={[0, dataMax => Math.max(dataMax, goal)]} />
            <YAxis type="category" dataKey="name" hide={true} />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Bar dataKey="goal" fill="#334155" background={{ fill: '#1e293b', radius: 4 }} radius={4}>
            </Bar>
            {/* Fix: Removed the `layout` prop from the Bar component as it is not a valid prop and caused a type error. */}
            <Bar dataKey="current" radius={4}>
               <Cell fill={barColor} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NutritionChart;