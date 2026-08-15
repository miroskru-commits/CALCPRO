import React, { useState, useEffect } from 'react';
import { CalculatorMode, HistoryItem } from './types';
import { sound } from './utils/audio';
import { useTranslation } from './i18n/LanguageContext';

import { Header } from './components/Header';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AiMathAssistant } from './components/AiAssistant/AiMathAssistant';

import { ScientificCalculator } from './components/Calculator/ScientificCalculator';
import { GraphingCalculator } from './components/Calculator/GraphingCalculator';
import { ProgrammerCalculator } from './components/Calculator/ProgrammerCalculator';
import { FinancialCalculator } from './components/Calculator/FinancialCalculator';
import { UnitConverter } from './components/Calculator/UnitConverter';
import { MatrixCalculator } from './components/Calculator/MatrixCalculator';
import { ImpossibleCalculator } from './components/Calculator/ImpossibleCalculator';
import { InteractiveBubbleBackground } from './components/InteractiveBubbleBackground';

export default function App() {
  const { t } = useTranslation();
  const [activeMode, setActiveMode] = useState<CalculatorMode>('scientific');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [insertedCalcValue, setInsertedCalcValue] = useState<string>('');

  // History state with LocalStorage persistence
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('calc_history_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: '1',
        expression: 'sin(45) * sqrt(2)',
        result: '1',
        timestamp: Date.now() - 1000 * 60 * 5,
        mode: 'scientific',
      },
      {
        id: '2',
        expression: '1000000 * (1 + 0.12)^5',
        result: '1,762,341.68',
        timestamp: Date.now() - 1000 * 60 * 15,
        mode: 'scientific',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('calc_history_v1', JSON.stringify(history));
    } catch {}
  }, [history]);

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // keep up to 50 items
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleToggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    sound.setEnabled(next);
    if (next) sound.playClick();
  };

  const handleInsertFromAi = (val: string) => {
    setActiveMode('scientific');
    setInsertedCalcValue(val);
    setIsAiOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200 relative overflow-x-hidden">
      {/* Super Gradient Background with Poppable Interactive Bubbles */}
      <InteractiveBubbleBackground />

      {/* Top Application Header */}
      <Header
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onOpenAiAssistant={() => setIsAiOpen(true)}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
        {/* Dynamic Calculator Engine View */}
        <div className="pt-2">
          {activeMode === 'scientific' && (
            <ScientificCalculator
              onAddHistory={addHistoryItem}
              onOpenHistory={() => setIsHistoryOpen(true)}
              historyCount={history.length}
              externalValue={insertedCalcValue}
            />
          )}

          {activeMode === 'graphing' && <GraphingCalculator />}

          {activeMode === 'programmer' && <ProgrammerCalculator />}

          {activeMode === 'financial' && <FinancialCalculator />}

          {activeMode === 'converter' && <UnitConverter />}

          {activeMode === 'matrix' && <MatrixCalculator />}

          {activeMode === 'impossible' && <ImpossibleCalculator />}
        </div>
      </main>

      {/* Footer info & status summary */}
      <footer className="border-t border-slate-800/80 bg-[#0b1329]/60 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              RAD / DEG
            </span>
            <span className="text-slate-700">•</span>
            <span>IEEE-754 ARITHMETIC</span>
            <span className="text-slate-700">•</span>
            <span>PRECISION: 16 DIGITS</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {t.appTitle} | ANALYTICAL ENGINE v5.0
          </div>
        </div>
      </footer>

      {/* AI Mathematical Assistant Drawer/Modal */}
      <AiMathAssistant
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onInsertValue={handleInsertFromAi}
      />

      {/* Paper History Tape Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={clearHistory}
        onSelectHistoryItem={(item) => {
          setIsHistoryOpen(false);
          setActiveMode('scientific');
          setInsertedCalcValue(item.result);
        }}
      />
    </div>
  );
}
