import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { ChartPoint } from '../types';

interface DerivativeVisualizerProps {
  data: ChartPoint[];
  variable: 'x' | 'y';
  fixedValue: number;
  currentVal: number;
  slope: number;
  funcVal: number;
}

const DerivativeVisualizer: React.FC<DerivativeVisualizerProps> = ({
  data,
  variable,
  fixedValue,
  currentVal,
  slope,
  funcVal
}) => {
  const otherVar = variable === 'x' ? 'y' : 'x';
  
  // Calculate domain for Y-axis to keep chart stable
  const yMin = Math.min(...data.map(d => d.funcVal));
  const yMax = Math.max(...data.map(d => d.funcVal));
  const padding = (yMax - yMin) * 0.2 || 1;

  const title = variable === 'x' 
    ? `Trace at y = ${fixedValue} (Change in x)` 
    : `Trace at x = ${fixedValue} (Change in y)`;

  const subtitle = variable === 'x'
    ? `∂f/∂x ≈ ${slope.toFixed(3)}`
    : `∂f/∂y ≈ ${slope.toFixed(3)}`;

  return (
    <div className="w-full h-[350px] bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 flex flex-col">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400">
            Holding <span className="font-mono bg-slate-700 text-slate-200 px-1 rounded">{otherVar}</span> constant.
          </p>
        </div>
        <div className="text-right">
           <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Slope</span>
           <div className={`text-xl font-mono font-bold ${slope > 0 ? 'text-green-400' : slope < 0 ? 'text-red-400' : 'text-slate-400'}`}>
             {subtitle}
           </div>
        </div>
      </div>

      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="val" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              tickFormatter={(val) => val.toFixed(1)}
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis 
              domain={[yMin - padding, yMax + padding]} 
              hide={false}
              stroke="#94a3b8"
              fontSize={12}
              width={40}
            />
            <Tooltip 
              formatter={(value: number) => value.toFixed(3)}
              labelFormatter={(label: number) => `${variable} = ${label.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
            />
            
            {/* The Function Curve */}
            <Line 
              type="monotone" 
              dataKey="funcVal" 
              stroke="#60a5fa" 
              strokeWidth={3} 
              dot={false} 
              name="f(x,y)"
              animationDuration={300}
            />

            {/* The Tangent Line */}
            <Line 
              type="linear" 
              dataKey="tangentVal" 
              stroke="#f87171" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false} 
              name="Tangent"
              animationDuration={300}
            />

            {/* Current Point Marker */}
            <ReferenceLine x={currentVal} stroke="#475569" strokeDasharray="3 3" />
            <ReferenceDot x={currentVal} y={funcVal} r={6} fill="#60a5fa" stroke="#1e293b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DerivativeVisualizer;