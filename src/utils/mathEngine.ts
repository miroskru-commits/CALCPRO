import { AngleUnit } from '../types';

export function factorial(n: number): number {
  if (n < 0) return NaN;
  if (!Number.isInteger(n)) {
    // Stirling approximation / Gamma approximation for float factorial
    return gamma(n + 1);
  }
  if (n > 170) return Infinity; // JS double overflow limit
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

// Lanczos approximation for Gamma function
function gamma(z: number): number {
  const g = 7;
  const C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }

  z -= 1;
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }

  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function formatResultNumber(num: number, maxDecimals: number = 10): string {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

  // Fix floating point errors like 0.0000000000000001 or 0.29999999999999999
  const rounded = Number(Math.round(Number(num + 'e' + maxDecimals)) + 'e-' + maxDecimals);

  // If very close to integer, snap it
  if (Math.abs(rounded - Math.round(rounded)) < 1e-12) {
    return Math.round(rounded).toString();
  }

  // Large or very small numbers in scientific format
  if (Math.abs(rounded) >= 1e14 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-7)) {
    return rounded.toExponential(6).replace('e+', 'e');
  }

  // Format with smart trailing zeros stripping
  return rounded.toLocaleString('en-US', {
    maximumFractionDigits: maxDecimals,
    useGrouping: false,
  });
}

export function evaluateExpression(expr: string, angleUnit: AngleUnit = 'deg', xValue?: number): { result: number; error: string | null } {
  try {
    if (!expr || expr.trim() === '') {
      return { result: 0, error: null };
    }

    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, `${Math.PI}`)
      .replace(/\bphi\b/gi, `${(1 + Math.sqrt(5)) / 2}`)
      .replace(/\be\b/g, `${Math.E}`);

    if (xValue !== undefined) {
      sanitized = sanitized.replace(/\bx\b/gi, `(${xValue})`);
    }

    // Auto-balance unclosed parenthesis
    let openCount = 0;
    for (const char of sanitized) {
      if (char === '(') openCount++;
      if (char === ')') openCount--;
    }
    while (openCount > 0) {
      sanitized += ')';
      openCount--;
    }

    // Replace implicit multiplications: 5(2) -> 5*(2), (2)(3) -> (2)*(3)
    sanitized = sanitized.replace(/(\d)\s*\(/g, '$1*(');
    sanitized = sanitized.replace(/\)\s*(\d)/g, ')*$1');
    sanitized = sanitized.replace(/\)\s*\(/g, ')*(');

    // Trigonometric functions
    const degToRad = (val: number) => (val * Math.PI) / 180;
    const radToDeg = (val: number) => (val * 180) / Math.PI;

    // Custom safe function map
    const context: Record<string, Function> = {
      sin: (v: number) => {
        const rad = angleUnit === 'deg' ? degToRad(v) : v;
        const res = Math.sin(rad);
        return Math.abs(res) < 1e-15 ? 0 : res;
      },
      cos: (v: number) => {
        const rad = angleUnit === 'deg' ? degToRad(v) : v;
        const res = Math.cos(rad);
        return Math.abs(res) < 1e-15 ? 0 : res;
      },
      tan: (v: number) => {
        const rad = angleUnit === 'deg' ? degToRad(v) : v;
        if (angleUnit === 'deg' && Math.abs(v % 180) === 90) return Infinity;
        return Math.tan(rad);
      },
      asin: (v: number) => {
        const res = Math.asin(v);
        return angleUnit === 'deg' ? radToDeg(res) : res;
      },
      acos: (v: number) => {
        const res = Math.acos(v);
        return angleUnit === 'deg' ? radToDeg(res) : res;
      },
      atan: (v: number) => {
        const res = Math.atan(v);
        return angleUnit === 'deg' ? radToDeg(res) : res;
      },
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      sqrt: Math.sqrt,
      cbrt: Math.cbrt,
      abs: Math.abs,
      ln: Math.log,
      log: (v: number) => Math.log10(v),
      log2: (v: number) => Math.log2(v),
      exp: Math.exp,
      fact: factorial,
    };

    // Replace functions in string with context references
    let executable = sanitized;

    // Handle factorial syntax: 5! -> fact(5)
    executable = executable.replace(/(\d+(\.\d+)?|\([^\(\)]+\))!/g, 'fact($1)');

    // Handle percentage: 50% -> (50/100)
    executable = executable.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    // Replace powers: x^y -> Math.pow(x, y)
    // Simple bracket/number power parser
    executable = executable.replace(/(\^)/g, '**');

    // Replace function names safely
    const funcNames = ['sinh', 'cosh', 'tanh', 'asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'sqrt', 'cbrt', 'abs', 'ln', 'log2', 'log', 'exp', 'fact'];
    for (const fn of funcNames) {
      const reg = new RegExp(`\\b${fn}\\(`, 'g');
      executable = executable.replace(reg, `context.${fn}(`);
    }

    // Evaluate using Function constructor in closed sandbox
    const evalFn = new Function('context', `
      with (context) {
        return (${executable});
      }
    `);

    const raw = evalFn(context);

    if (typeof raw !== 'number') {
      return { result: NaN, error: 'Invalid expression' };
    }

    return { result: raw, error: null };
  } catch (err) {
    return { result: NaN, error: (err as Error).message || 'Calculation error' };
  }
}
