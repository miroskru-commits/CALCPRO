import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  CornerDownRight, 
  RotateCcw, 
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { sound } from '../../utils/audio';

interface AiMathAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertValue: (val: string) => void;
}

interface MathSolution {
  problem: string;
  steps: string[];
  finalAnswer: string;
  numericValue: string;
}

export const AiMathAssistant: React.FC<AiMathAssistantProps> = ({
  isOpen,
  onClose,
  onInsertValue,
}) => {
  const { t, language } = useTranslation();
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSolve = async (queryToSolve?: string) => {
    const q = (queryToSolve || prompt).trim();
    if (!q || loading) return;

    sound.playClick();
    setLoading(true);
    setError(null);
    setInserted(false);

    try {
      const res = await fetch('/api/gemini/math-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, language }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSolution(data.data);
        sound.playEquals();
      } else {
        setError(data.error || t.ai.errorMsg);
        sound.playError();
      }
    } catch (err: any) {
      setError(err.message || t.ai.errorMsg);
      sound.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    const text = `${solution.problem}\n\n${solution.steps.join('\n')}\n\n${solution.finalAnswer}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    sound.playClick();
  };

  const handleInsert = () => {
    if (!solution || !solution.numericValue) return;
    sound.playOperator();
    onInsertValue(solution.numericValue);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  };

  const handleExampleClick = (ex: string) => {
    setPrompt(ex);
    handleSolve(ex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b1329] border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                {t.ai.title}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono font-medium">
                  GEMINI 3.7
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t.ai.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm scrollbar-thin">
          {/* Query Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSolve();
            }}
            className="relative"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSolve();
                }
              }}
              placeholder={t.ai.inputPlaceholder}
              rows={2}
              className="w-full p-4 pr-14 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition resize-none text-sm font-medium"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white transition shadow-md shadow-sky-500/25 cursor-pointer disabled:cursor-not-allowed"
              title={t.ai.send}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Quick Examples Pills */}
          {!solution && !loading && (
            <div className="space-y-2 pt-1">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                {t.ai.quickExamplesTitle}
              </div>
              <div className="flex flex-col gap-1.5">
                {t.ai.examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(ex)}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-xs text-slate-300 hover:text-white transition flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{ex}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-slate-300 font-medium">{t.ai.thinking}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => handleSolve()}
                className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-white font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Повторить
              </button>
            </div>
          )}

          {/* Solution Card */}
          {solution && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Problem description badge */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider font-semibold mb-0.5">
                  {t.common.result}
                </span>
                <span className="font-semibold text-white">{solution.problem}</span>
              </div>

              {/* Steps list */}
              {solution.steps && solution.steps.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.ai.solutionTitle}
                  </div>
                  <div className="space-y-2">
                    {solution.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CornerDownRight className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Answer Big Callout */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/30 border border-sky-500/30 space-y-3">
                <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wide">
                  {t.common.result}:
                </div>
                <div className="text-lg font-bold text-white font-mono leading-relaxed">
                  {solution.finalAnswer}
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  {solution.numericValue && (
                    <button
                      onClick={handleInsert}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        inserted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-95'
                      }`}
                      title={t.ai.insertTooltip}
                    >
                      {inserted ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                      {inserted ? t.common.copied : `${t.common.insert} (${solution.numericValue})`}
                    </button>
                  )}

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t.common.copied : t.common.copy}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
