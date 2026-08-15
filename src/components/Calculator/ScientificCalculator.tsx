import React, { useState, useEffect, useCallback } from 'react';
import { 
  Delete, 
  RotateCcw, 
  Equal, 
  Percent, 
  Plus, 
  Minus, 
  X, 
  Divide, 
  Superscript, 
  Pi, 
  Binary, 
  Activity,
  History as HistoryIcon
} from 'lucide-react';
import { AngleUnit, HistoryItem } from '../../types';
import { evaluateExpression, formatResultNumber } from '../../utils/mathEngine';
import { sound } from '../../utils/audio';

interface ScientificCalculatorProps {
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  onOpenHistory: () => void;
  historyCount: number;
  externalValue?: string;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  onAddHistory,
  onOpenHistory,
  historyCount,
  externalValue,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [livePreview, setLivePreview] = useState<string>('0');
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('deg');
  const [memory, setMemory] = useState<number>(0);
  const [is2nd, setIs2nd] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Sync external value from AI assistant if provided
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== '') {
      setExpression(externalValue);
      setHasCalculated(false);
    }
  }, [externalValue]);

  // Compute live preview on expression change
  useEffect(() => {
    if (!expression || expression.trim() === '') {
      setLivePreview('0');
      return;
    }
    const { result, error } = evaluateExpression(expression, angleUnit);
    if (error === null && !isNaN(result) && isFinite(result)) {
      setLivePreview(formatResultNumber(result));
    } else {
      setLivePreview('');
    }
  }, [expression, angleUnit]);

  const appendToken = useCallback((token: string, isOperator: boolean = false) => {
    if (isOperator) {
      sound.playOperator();
    } else {
      sound.playClick();
    }

    setExpression((prev) => {
      if (hasCalculated) {
        setHasCalculated(false);
        // If typing an operator right after calculate, chain the previous result
        if (['+', '−', '×', '÷', '^', '%'].includes(token)) {
          return (livePreview || '0') + token;
        }
        return token;
      }
      return prev + token;
    });
  }, [hasCalculated, livePreview]);

  const handleClear = useCallback(() => {
    sound.playClear();
    setExpression('');
    setLivePreview('0');
    setHasCalculated(false);
  }, []);

  const handleDelete = useCallback(() => {
    sound.playClick();
    setExpression((prev) => {
      if (hasCalculated) {
        setHasCalculated(false);
        return '';
      }
      // Check if deleting a multi-char token like 'sin(' or 'cos('
      const multiTokens = ['asin(', 'acos(', 'atan(', 'sinh(', 'cosh(', 'tanh(', 'log2(', 'sqrt(', 'cbrt(', 'sin(', 'cos(', 'tan(', 'ln(', 'log(', 'exp('];
      for (const tok of multiTokens) {
        if (prev.endsWith(tok)) {
          return prev.slice(0, -tok.length);
        }
      }
      return prev.slice(0, -1);
    });
  }, [hasCalculated]);

  const handleCalculate = useCallback(() => {
    if (!expression || expression.trim() === '') return;

    const { result, error } = evaluateExpression(expression, angleUnit);
    if (error || isNaN(result)) {
      sound.playError();
      setLivePreview(error || 'Error');
      return;
    }

    sound.playEquals();
    const formatted = formatResultNumber(result);
    onAddHistory({
      expression,
      result: formatted,
      mode: 'scientific',
    });

    setExpression(formatted);
    setLivePreview('');
    setHasCalculated(true);
  }, [expression, angleUnit, onAddHistory]);

  // Keyboard binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        appendToken(e.key);
      } else if (e.key === '.') {
        appendToken('.');
      } else if (e.key === '+') {
        appendToken('+', true);
      } else if (e.key === '-') {
        appendToken('−', true);
      } else if (e.key === '*' || e.key === 'x') {
        appendToken('×', true);
      } else if (e.key === '/') {
        e.preventDefault();
        appendToken('÷', true);
      } else if (e.key === '(' || e.key === ')') {
        appendToken(e.key);
      } else if (e.key === '^') {
        appendToken('^', true);
      } else if (e.key === '%') {
        appendToken('%', true);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appendToken, handleCalculate, handleDelete, handleClear]);

  // Memory functions
  const handleMemoryAdd = () => {
    sound.playOperator();
    const { result } = evaluateExpression(expression || livePreview || '0', angleUnit);
    if (!isNaN(result)) setMemory((prev) => prev + result);
  };
  const handleMemorySub = () => {
    sound.playOperator();
    const { result } = evaluateExpression(expression || livePreview || '0', angleUnit);
    if (!isNaN(result)) setMemory((prev) => prev - result);
  };
  const handleMemoryRecall = () => {
    sound.playClick();
    appendToken(memory.toString());
  };
  const handleMemoryClear = () => {
    sound.playClear();
    setMemory(0);
  };

  // Open parenthesis counter
  const openParens = (expression.match(/\(/g) || []).length;
  const closedParens = (expression.match(/\)/g) || []).length;
  const unclosed = Math.max(0, openParens - closedParens);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Display Screen */}
      <div 
        id="calc-screen"
        className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[160px]"
      >
        {/* Status bar inside screen */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
          <div className="flex items-center gap-2">
            <button
              id="deg-rad-toggle-btn"
              onClick={() => {
                sound.playClick();
                setAngleUnit(angleUnit === 'deg' ? 'rad' : 'deg');
              }}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-sky-400 font-bold transition cursor-pointer border border-slate-700/50"
            >
              {angleUnit.toUpperCase()}
            </button>
            {memory !== 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold text-[10px]">
                M: {formatResultNumber(memory, 4)}
              </span>
            )}
            {unclosed > 0 && (
              <span className="text-[11px] text-sky-400 font-medium">
                Скобки: {unclosed} незакрыто
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="history-drawer-toggle-btn"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition text-[11px] cursor-pointer border border-slate-700/50"
            >
              <HistoryIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Лента ({historyCount})</span>
            </button>
          </div>
        </div>

        {/* Expression Input String */}
        <div 
          id="calc-expression-display"
          className="text-right font-mono text-lg sm:text-xl text-slate-400 font-medium tracking-tight overflow-x-auto whitespace-nowrap py-1 select-all"
        >
          {expression || <span className="text-slate-600">0</span>}
        </div>

        {/* Live Evaluation Preview */}
        <div 
          id="calc-live-preview-display"
          className="text-right font-mono text-4xl sm:text-5xl font-bold tracking-tighter text-white overflow-x-auto whitespace-nowrap drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]"
        >
          {livePreview ? (
            <span className={hasCalculated ? 'text-sky-300' : 'text-white'}>
              {livePreview}
            </span>
          ) : (
            <span className="text-slate-700">—</span>
          )}
        </div>
      </div>

      {/* Memory & Function Bar */}
      <div className="grid grid-cols-6 gap-2 text-xs font-mono">
        <button
          id="btn-mem-clear"
          onClick={handleMemoryClear}
          className="py-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800 font-semibold cursor-pointer"
        >
          MC
        </button>
        <button
          id="btn-mem-recall"
          onClick={handleMemoryRecall}
          className="py-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800 font-semibold cursor-pointer"
        >
          MR
        </button>
        <button
          id="btn-mem-plus"
          onClick={handleMemoryAdd}
          className="py-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800 font-semibold cursor-pointer"
        >
          M+
        </button>
        <button
          id="btn-mem-minus"
          onClick={handleMemorySub}
          className="py-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800 font-semibold cursor-pointer"
        >
          M−
        </button>
        <button
          id="btn-2nd-toggle"
          onClick={() => {
            sound.playClick();
            setIs2nd(!is2nd);
          }}
          className={`py-2.5 rounded-xl transition border font-semibold cursor-pointer ${
            is2nd 
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]' 
              : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 border-slate-800'
          }`}
        >
          2nd
        </button>
        <button
          id="btn-clear-ac"
          onClick={handleClear}
          className="py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold transition cursor-pointer"
        >
          AC
        </button>
      </div>

      {/* Main Scientific Keypad Grid */}
      <div className="grid grid-cols-5 gap-2.5">
        {/* Row 1: Advanced Scientific */}
        <button
          onClick={() => appendToken(is2nd ? 'asin(' : 'sin(')}
          className="calc-btn calc-btn-func"
        >
          {is2nd ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          onClick={() => appendToken(is2nd ? 'acos(' : 'cos(')}
          className="calc-btn calc-btn-func"
        >
          {is2nd ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          onClick={() => appendToken(is2nd ? 'atan(' : 'tan(')}
          className="calc-btn calc-btn-func"
        >
          {is2nd ? 'tan⁻¹' : 'tan'}
        </button>
        <button
          onClick={() => appendToken('(')}
          className="calc-btn calc-btn-op"
        >
          (
        </button>
        <button
          onClick={() => appendToken(')')}
          className="calc-btn calc-btn-op"
        >
          )
        </button>

        {/* Row 2: Powers & Logs */}
        <button
          onClick={() => appendToken(is2nd ? 'sinh(' : 'ln(')}
          className="calc-btn calc-btn-func"
        >
          {is2nd ? 'sinh' : 'ln'}
        </button>
        <button
          onClick={() => appendToken(is2nd ? 'cosh(' : 'log(')}
          className="calc-btn calc-btn-func"
        >
          {is2nd ? 'cosh' : 'log₁₀'}
        </button>
        <button
          onClick={() => appendToken(is2nd ? 'cbrt(' : 'sqrt(')}
          className="calc-btn calc-btn-func"
        >
          {is2nd ? '∛x' : '√x'}
        </button>
        <button
          onClick={() => appendToken('^', true)}
          className="calc-btn calc-btn-func"
        >
          xʸ
        </button>
        <button
          onClick={() => appendToken('÷', true)}
          className="calc-btn calc-btn-action"
        >
          ÷
        </button>

        {/* Row 3: 7, 8, 9 & Ops */}
        <button
          onClick={() => appendToken('!')}
          className="calc-btn calc-btn-func"
        >
          n!
        </button>
        <button
          onClick={() => appendToken('7')}
          className="calc-btn calc-btn-num"
        >
          7
        </button>
        <button
          onClick={() => appendToken('8')}
          className="calc-btn calc-btn-num"
        >
          8
        </button>
        <button
          onClick={() => appendToken('9')}
          className="calc-btn calc-btn-num"
        >
          9
        </button>
        <button
          onClick={() => appendToken('×', true)}
          className="calc-btn calc-btn-action"
        >
          ×
        </button>

        {/* Row 4: 4, 5, 6 & Ops */}
        <button
          onClick={() => appendToken('π')}
          className="calc-btn calc-btn-func"
        >
          π
        </button>
        <button
          onClick={() => appendToken('4')}
          className="calc-btn calc-btn-num"
        >
          4
        </button>
        <button
          onClick={() => appendToken('5')}
          className="calc-btn calc-btn-num"
        >
          5
        </button>
        <button
          onClick={() => appendToken('6')}
          className="calc-btn calc-btn-num"
        >
          6
        </button>
        <button
          onClick={() => appendToken('−', true)}
          className="calc-btn calc-btn-action"
        >
          −
        </button>

        {/* Row 5: 1, 2, 3 & Ops */}
        <button
          onClick={() => appendToken('e')}
          className="calc-btn calc-btn-func"
        >
          e
        </button>
        <button
          onClick={() => appendToken('1')}
          className="calc-btn calc-btn-num"
        >
          1
        </button>
        <button
          onClick={() => appendToken('2')}
          className="calc-btn calc-btn-num"
        >
          2
        </button>
        <button
          onClick={() => appendToken('3')}
          className="calc-btn calc-btn-num"
        >
          3
        </button>
        <button
          onClick={() => appendToken('+', true)}
          className="calc-btn calc-btn-action"
        >
          +
        </button>

        {/* Row 6: 0, ., Backspace, % & Equals */}
        <button
          onClick={() => appendToken('%', true)}
          className="calc-btn calc-btn-func"
        >
          %
        </button>
        <button
          onClick={() => appendToken('0')}
          className="calc-btn calc-btn-num"
        >
          0
        </button>
        <button
          onClick={() => appendToken('.')}
          className="calc-btn calc-btn-num font-bold"
        >
          .
        </button>
        <button
          onClick={handleDelete}
          className="calc-btn calc-btn-func text-slate-400 hover:text-rose-400"
          title="Backspace"
        >
          <Delete className="w-5 h-5 mx-auto" />
        </button>
        <button
          id="btn-calculate-equals"
          onClick={handleCalculate}
          className="calc-btn bg-sky-500 hover:bg-sky-400 text-white font-bold text-2xl shadow-lg shadow-sky-500/30 hover:scale-[1.02] active:scale-95 transition-all border-none"
        >
          =
        </button>
      </div>

      <style>{`
        .calc-btn {
          min-height: 56px;
          border-radius: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(51, 65, 85, 0.5);
          user-select: none;
        }
        .calc-btn:active {
          transform: scale(0.95);
        }
        .calc-btn-num {
          background-color: rgba(30, 41, 59, 0.35);
          color: #ffffff;
          font-size: 20px;
          font-weight: 600;
        }
        .calc-btn-num:hover {
          background-color: rgba(30, 41, 59, 0.65);
          border-color: rgba(148, 163, 184, 0.3);
        }
        .calc-btn-func {
          background-color: rgba(30, 41, 59, 0.5);
          color: #38bdf8;
          font-size: 14px;
          font-weight: 700;
        }
        .calc-btn-func:hover {
          background-color: rgba(51, 65, 85, 0.6);
          color: #7dd3fc;
          border-color: rgba(56, 189, 248, 0.4);
        }
        .calc-btn-op {
          background-color: rgba(30, 41, 59, 0.5);
          color: #38bdf8;
          font-size: 16px;
          font-weight: 700;
        }
        .calc-btn-op:hover {
          background-color: rgba(51, 65, 85, 0.6);
          color: #7dd3fc;
        }
        .calc-btn-action {
          background-color: rgba(30, 41, 59, 0.5);
          color: #38bdf8;
          font-size: 20px;
          font-weight: 700;
        }
        .calc-btn-action:hover {
          background-color: rgba(51, 65, 85, 0.7);
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};
