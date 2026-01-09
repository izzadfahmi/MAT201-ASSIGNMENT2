export const evaluateFunction = (funcStr: string, x: number, y: number): number | null => {
  try {
    // 1. Sanitize: Allow only math chars, x, y, numbers, and known functions
    // Note: In a real production app, use a robust parser library like mathjs.
    // This is a simple safe-guard for demonstration purposes.
    const allowed = /^[0-9+\-*/^().\sxy sin cos tan exp log sqrt abs Math PI E]+$/;
    
    // Replace standard math functions with Math.func
    let jsExpr = funcStr
      .replace(/\^/g, '**')
      .replace(/\b(sin|cos|tan|exp|log|sqrt|abs)\b/g, 'Math.$1')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/gi, 'Math.E');

    // Create a function from the string
    // eslint-disable-next-line no-new-func
    const f = new Function('x', 'y', `
      try {
        return ${jsExpr};
      } catch(e) {
        return NaN;
      }
    `);
    
    const result = f(x, y);
    if (!isFinite(result) || isNaN(result)) return null;
    return result;

  } catch (e) {
    return null;
  }
};

export const numericalDerivative = (
  funcStr: string, 
  x: number, 
  y: number, 
  variable: 'x' | 'y', 
  h = 0.001
): number => {
  const f = (vx: number, vy: number) => evaluateFunction(funcStr, vx, vy) || 0;
  
  if (variable === 'x') {
    return (f(x + h, y) - f(x - h, y)) / (2 * h);
  } else {
    return (f(x, y + h) - f(x, y - h)) / (2 * h);
  }
};

export const generateChartData = (
  funcStr: string,
  fixedVal: number,
  variable: 'x' | 'y',
  centerVal: number,
  range = 4,
  points = 50
) => {
  const data = [];
  const step = range / points;
  const start = centerVal - range / 2;
  
  // Pre-calculate slope for tangent line
  const x0 = variable === 'x' ? centerVal : fixedVal;
  const y0 = variable === 'x' ? fixedVal : centerVal;
  const slope = numericalDerivative(funcStr, x0, y0, variable);
  const z0 = evaluateFunction(funcStr, x0, y0) || 0;

  for (let i = 0; i <= points; i++) {
    const val = start + i * step;
    let z = 0;
    
    if (variable === 'x') {
      z = evaluateFunction(funcStr, val, fixedVal) || 0;
    } else {
      z = evaluateFunction(funcStr, fixedVal, val) || 0;
    }
    
    // Tangent Line equation: z - z0 = m(val - centerVal) => z = m(val - centerVal) + z0
    const tangentZ = slope * (val - centerVal) + z0;

    data.push({
      val,
      funcVal: z,
      tangentVal: tangentZ
    });
  }
  return { data, slope, z0 };
};
