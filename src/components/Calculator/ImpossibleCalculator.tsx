import React, { useState } from 'react';
import { 
  Smile, 
  Sparkles, 
  Settings2, 
  RotateCcw, 
  CheckCircle2, 
  Bot, 
  Zap, 
  Play,
  EyeOff,
  Sliders
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { sound } from '../../utils/audio';

export const ImpossibleCalculator: React.FC = () => {
  const { t } = useTranslation();

  // Prank Rule Configuration State
  const [customRule, setCustomRule] = useState<string>(
    'Если я ввожу 2+2, то выводи 5. Если умножают на 0, выводи "Infinity". При вычислении 100-1 выводи 999.'
  );
  const [activeRule, setActiveRule] = useState<string>(
    'Если я ввожу 2+2, то выводи 5. Если умножают на 0, выводи "Infinity". При вычислении 100-1 выводи 999.'
  );
  const [isRuleApplied, setIsRuleApplied] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(true);

  // Calculator Simulation Display State
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Handle Preset Selection
  const handleApplyPreset = (ruleText: string) => {
    sound.playClick();
    setCustomRule(ruleText);
    setActiveRule(ruleText);
    setIsRuleApplied(true);
  };

  const handleSaveRule = () => {
    sound.playEquals();
    setActiveRule(customRule);
    setIsRuleApplied(true);
  };

  const handleClearRule = () => {
    sound.playClear();
    setCustomRule('');
    setActiveRule('');
    setIsRuleApplied(false);
  };

  // Calculator Key Actions
  const handleInputDigit = (digit: string) => {
    sound.playClick();
    if (display === '0' || display === 'Error') {
      setDisplay(digit);
      setExpression(digit);
    } else {
      setDisplay((prev) => prev + digit);
      setExpression((prev) => prev + digit);
    }
  };

  const handleInputOperator = (op: string) => {
    sound.playOperator();
    const opMap: Record<string, string> = { '+': '+', '-': '-', '×': '*', '÷': '/' };
    const mathOp = opMap[op] || op;
    setDisplay((prev) => prev + ' ' + op + ' ');
    setExpression((prev) => prev + ' ' + mathOp + ' ');
  };

  const handleClear = () => {
    sound.playClear();
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    sound.playClick();
    if (display.length <= 1) {
      setDisplay('0');
      setExpression('');
    } else {
      setDisplay((prev) => prev.slice(0, -1));
      setExpression((prev) => prev.slice(0, -1));
    }
  };

  // Evaluate Expression using Instant Local Rule Engine + Fast AI Prank Backend
  const handleEvaluate = async () => {
    if (!expression || expression.trim() === '') return;
    sound.playClick();
    
    const cleanExpr = expression.replace(/\s+/g, '');
    const ruleLower = (isRuleApplied ? activeRule : '').toLowerCase();

    // 1. Instant local evaluations for common rules to remove any perceived latency
    if (isRuleApplied && ruleLower) {
      if ((ruleLower.includes('2+2') || ruleLower.includes('2 + 2')) && (cleanExpr === '2+2' || cleanExpr === '2+2.0')) {
        if (ruleLower.includes('5')) {
          setDisplay('5');
          sound.playEquals();
          return;
        }
      }
      if (ruleLower.includes('42') && (ruleLower.includes('любой') || ruleLower.includes('всегда') || ruleLower.includes('every'))) {
        setDisplay('42');
        sound.playEquals();
        return;
      }
      if (ruleLower.includes('100-1') && cleanExpr === '100-1') {
        setDisplay('999');
        sound.playEquals();
        return;
      }
      if (ruleLower.includes('/0') || (ruleLower.includes('на 0') && (cleanExpr.endsWith('/0') || cleanExpr.includes('/0+')))) {
        if (ruleLower.includes('infinity') || ruleLower.includes('бесконечность')) {
          setDisplay('Infinity');
          sound.playEquals();
          return;
        }
      }
    }

    setEvaluating(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const res = await fetch('/api/gemini/impossible-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          expression: expression.trim(),
          customRule: isRuleApplied ? activeRule : '',
        }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data) {
        const spoofedResult = data.data.result ?? '5';
        setDisplay(String(spoofedResult));
        sound.playEquals();
      } else {
        fallbackEvaluate();
      }
    } catch {
      fallbackEvaluate();
    } finally {
      setEvaluating(false);
    }
  };

  const fallbackEvaluate = () => {
    const cleanExpr = expression.replace(/\s+/g, '');
    if (cleanExpr === '2+2' && isRuleApplied) {
      setDisplay('5');
    } else {
      try {
        const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
        // eslint-disable-next-line no-new-func
        const res = Function(`'use strict'; return (${sanitized})`)();
        setDisplay(String(res));
      } catch {
        setDisplay('42');
      }
    }
    sound.playEquals();
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-4 rounded-3xl border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">{t.impossible.title}</h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold tracking-wider">
                {t.impossible.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400">{t.impossible.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRuleApplied && activeRule && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.impossible.ruleActive}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: AI Prank Controller & The Realistic Calculator */}
      <div className={`grid grid-cols-1 ${showConfig ? 'lg:grid-cols-12' : 'max-w-md mx-auto'} gap-6 transition-all duration-300`}>
        {/* Left Column: Secret AI Rule Setup for the User (Hidable) */}
        {showConfig && (
          <div className="lg:col-span-5 space-y-4 animate-fadeIn">
            <div className="bg-[#0b1329]/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">{t.impossible.aiConfigTitle}</h3>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowConfig(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                  title="Скрыть окно условия"
                >
                  <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                  <span>Скрыть</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {t.impossible.aiConfigDesc}
              </p>

              {/* Custom Rule Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  Инструкция для ИИ-вычислений:
                </label>
                <textarea
                  value={customRule}
                  onChange={(e) => setCustomRule(e.target.value)}
                  placeholder={t.impossible.aiPromptPlaceholder}
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs font-medium resize-none shadow-inner"
                />
              </div>

              {/* Save & Reset Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveRule}
                  disabled={!customRule.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {t.impossible.applyRule}
                </button>
                <button
                  onClick={handleClearRule}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  title={t.impossible.cleanRule}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Prank Templates */}
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  {t.impossible.customRulesList}
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => handleApplyPreset('Если пользователь вводит 2+2 или 2 + 2, выводи ровно 5. Для остальных примеров считай правильно.')}
                    className="text-left px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{t.impossible.template1}</span>
                    <Play className="w-3 h-3 text-purple-400 shrink-0 ml-2" />
                  </button>
                  <button
                    onClick={() => handleApplyPreset('Любое выражение всегда должно давать результат 42.')}
                    className="text-left px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{t.impossible.template2}</span>
                    <Play className="w-3 h-3 text-purple-400 shrink-0 ml-2" />
                  </button>
                  <button
                    onClick={() => handleApplyPreset('Любая сумма или сложение чисел всегда должна выдавать правильный ответ плюс ровно 100 сверху.')}
                    className="text-left px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{t.impossible.template3}</span>
                    <Play className="w-3 h-3 text-purple-400 shrink-0 ml-2" />
                  </button>
                  <button
                    onClick={() => handleApplyPreset('При любой операции деления возвращай текст "Ошибка в матрице".')}
                    className="text-left px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{t.impossible.template4}</span>
                    <Play className="w-3 h-3 text-purple-400 shrink-0 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column / Center: The Decoy Realistic Calculator Screen */}
        <div className={`${showConfig ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
          <div className="bg-[#0b1329]/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col space-y-4 max-w-lg mx-auto">
            {/* Decoy Bar Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="font-bold text-slate-200 text-sm tracking-wide">
                Самый точный калькулятор
              </span>
              <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                PRO ULTRA ACCURACY
              </span>
            </div>

            {/* Calculator LCD Display */}
            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-5 flex flex-col items-end justify-between min-h-[105px] shadow-inner relative overflow-hidden">
              {/* Active Equation Line */}
              <div className="text-xs font-mono text-slate-400 tracking-wider truncate w-full text-right h-5">
                {expression || ' '}
              </div>

              {/* Main Digital Number Result */}
              <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight break-all text-right w-full">
                {evaluating ? (
                  <span className="text-purple-400 animate-pulse">...</span>
                ) : (
                  display
                )}
              </div>
            </div>

            {/* Calculator Keypad Matrix */}
            <div className="grid grid-cols-4 gap-2.5 pt-1">
              {/* Row 1 */}
              <button
                onClick={handleClear}
                className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-sm transition cursor-pointer"
              >
                C
              </button>
              <button
                onClick={handleBackspace}
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-sm transition cursor-pointer"
              >
                ⌫
              </button>
              <button
                onClick={() => handleInputOperator('%')}
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800 font-bold text-sm transition cursor-pointer"
              >
                %
              </button>
              <button
                onClick={() => handleInputOperator('÷')}
                className="p-3.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-base transition cursor-pointer"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                onClick={() => handleInputDigit('7')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                7
              </button>
              <button
                onClick={() => handleInputDigit('8')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                8
              </button>
              <button
                onClick={() => handleInputDigit('9')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                9
              </button>
              <button
                onClick={() => handleInputOperator('×')}
                className="p-3.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-base transition cursor-pointer"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                onClick={() => handleInputDigit('4')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                4
              </button>
              <button
                onClick={() => handleInputDigit('5')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                5
              </button>
              <button
                onClick={() => handleInputDigit('6')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                6
              </button>
              <button
                onClick={() => handleInputOperator('-')}
                className="p-3.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-base transition cursor-pointer"
              >
                -
              </button>

              {/* Row 4 */}
              <button
                onClick={() => handleInputDigit('1')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                1
              </button>
              <button
                onClick={() => handleInputDigit('2')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                2
              </button>
              <button
                onClick={() => handleInputDigit('3')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                3
              </button>
              <button
                onClick={() => handleInputOperator('+')}
                className="p-3.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-base transition cursor-pointer"
              >
                +
              </button>

              {/* Row 5 */}
              <button
                onClick={() => handleInputDigit('0')}
                className="col-span-2 p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer text-left pl-6"
              >
                0
              </button>
              <button
                onClick={() => handleInputDigit('.')}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800/80 font-bold text-base transition cursor-pointer"
              >
                .
              </button>
              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-lg transition shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                =
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left Button to Re-open AI Condition Config when hidden */}
      {!showConfig && (
        <button
          onClick={() => {
            sound.playClick();
            setShowConfig(true);
          }}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-purple-950/80 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold shadow-2xl backdrop-blur-xl transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Условие для ИИ-помощника</span>
        </button>
      )}
    </div>
  );
};
