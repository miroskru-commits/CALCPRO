export type CalculatorMode = 
  | 'scientific'
  | 'graphing'
  | 'programmer'
  | 'financial'
  | 'converter'
  | 'matrix'
  | 'impossible';

export type AngleUnit = 'deg' | 'rad';

export type WordSize = '8' | '16' | '32' | '64';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  mode: CalculatorMode;
  note?: string;
}

export interface GraphFunction {
  id: string;
  color: string;
  expression: string;
  visible: boolean;
  isValid: boolean;
}

export type UnitCategory = 
  | 'length'
  | 'mass'
  | 'temperature'
  | 'speed'
  | 'digital'
  | 'area'
  | 'volume';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}
