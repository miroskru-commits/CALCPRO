import React, { useState } from 'react';
import { 
  Calculator, 
  LineChart, 
  Binary, 
  Landmark, 
  ArrowRightLeft, 
  Grid, 
  Bot, 
  Volume2, 
  VolumeX, 
  Globe,
  ChevronDown,
  Smile
} from 'lucide-react';
import { CalculatorMode } from '../types';
import { sound } from '../utils/audio';
import { useTranslation } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';
import { AmbientPlayer } from './AmbientPlayer';

interface HeaderProps {
  activeMode: CalculatorMode;
  onModeChange: (mode: CalculatorMode) => void;
  onOpenAiAssistant: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onModeChange,
  onOpenAiAssistant,
  isAudioEnabled,
  onToggleAudio,
}) => {
  const { t, language, setLanguage, languages } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);

  const modes: { id: CalculatorMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'scientific', label: t.modes.scientific, icon: Calculator },
    { id: 'graphing', label: t.modes.graphing, icon: LineChart },
    { id: 'programmer', label: t.modes.programmer, icon: Binary },
    { id: 'financial', label: t.modes.financial, icon: Landmark },
    { id: 'converter', label: t.modes.converter, icon: ArrowRightLeft },
    { id: 'matrix', label: t.modes.matrix, icon: Grid },
    { id: 'impossible', label: t.modes.impossible, icon: Smile },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="border-b border-slate-800 bg-[#0b1329]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(14,165,233,0.45)]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                {t.appTitle}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono font-medium">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick mobile AI button */}
          <button
            onClick={onOpenAiAssistant}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition shadow-lg shadow-sky-500/25 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{t.common.aiAssistant}</span>
          </button>
        </div>

        {/* Mode Selector Pill Container */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-full border border-slate-800 overflow-x-auto max-w-full pb-0 scrollbar-none">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                id={`nav-mode-${m.id}`}
                onClick={() => {
                  sound.playClick();
                  onModeChange(m.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Top Right Action Tools */}
        <div className="hidden md:flex items-center gap-2">
          {/* Ambient procedural audio widget */}
          <AmbientPlayer />

          {/* Key click sound toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isAudioEnabled
                ? 'bg-slate-900/90 border-slate-700 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isAudioEnabled ? t.common.soundOn : t.common.soundOff}
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentLang.flag}</span>
              <span className="uppercase font-mono">{currentLang.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-[#0b1329] border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl z-50 animate-fadeIn backdrop-blur-xl">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as Language);
                      setIsLangOpen(false);
                      sound.playClick();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      language === lang.code
                        ? 'bg-sky-500/20 text-sky-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {language === lang.code && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Math Assistant Modal Trigger */}
          <button
            id="open-ai-assistant-btn"
            onClick={() => {
              sound.playClick();
              onOpenAiAssistant();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition shadow-lg shadow-sky-500/30 cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <Bot className="w-4 h-4 text-sky-100" />
            {t.common.aiAssistant}
          </button>
        </div>
      </div>
    </header>
  );
};
