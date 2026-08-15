import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles,
  Layers
} from 'lucide-react';
import { GraphFunction } from '../../types';
import { evaluateExpression } from '../../utils/mathEngine';
import { sound } from '../../utils/audio';

const FUNCTION_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

const PRESETS = [
  { name: 'Синусоида', expr: 'sin(x)' },
  { name: 'Затухающие колебания', expr: 'exp(-0.2*x)*sin(3*x)' },
  { name: 'Кубическая парабола', expr: '0.1*x^3 - x' },
  { name: 'Гауссиана (Нормальное)', expr: 'exp(-0.5*x^2)' },
  { name: 'Логистическая сигмоида', expr: '1/(1 + exp(-x))' },
];

export const GraphingCalculator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [functions, setFunctions] = useState<GraphFunction[]>([
    { id: '1', color: FUNCTION_COLORS[0], expression: 'sin(x)', visible: true, isValid: true },
    { id: '2', color: FUNCTION_COLORS[1], expression: '0.2*x^2 - 2', visible: true, isValid: true },
  ]);

  const [viewState, setViewState] = useState({
    centerX: 0,
    centerY: 0,
    scale: 40, // pixels per math unit
  });

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Redraw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const { centerX, centerY, scale } = viewState;

    // Clear canvas
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Origin in screen pixels
    const originX = width / 2 - centerX * scale;
    const originY = height / 2 + centerY * scale;

    // Grid step calculation
    let step = 1;
    if (scale < 15) step = 5;
    if (scale < 6) step = 10;
    if (scale > 100) step = 0.5;
    if (scale > 250) step = 0.2;

    // Draw Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#18181b';
    ctx.fillStyle = '#71717a';
    ctx.font = '10px JetBrains Mono';

    // Vertical grid lines
    const startX = Math.floor((-originX) / scale / step) * step;
    const endX = Math.ceil((width - originX) / scale / step) * step;
    for (let x = startX; x <= endX; x += step) {
      const px = originX + x * scale;
      ctx.beginPath();
      ctx.strokeStyle = Math.abs(x) < 1e-6 ? '#3f3f46' : '#18181b';
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      if (Math.abs(x) >= 1e-6) {
        ctx.fillText(x.toFixed(step < 1 ? 1 : 0), px + 4, originY - 4);
      }
    }

    // Horizontal grid lines
    const startY = Math.floor((originY - height) / scale / step) * step;
    const endY = Math.ceil(originY / scale / step) * step;
    for (let y = startY; y <= endY; y += step) {
      const py = originY - y * scale;
      ctx.beginPath();
      ctx.strokeStyle = Math.abs(y) < 1e-6 ? '#3f3f46' : '#18181b';
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      if (Math.abs(y) >= 1e-6) {
        ctx.fillText(y.toFixed(step < 1 ? 1 : 0), originX + 4, py - 4);
      }
    }

    // Primary Axes X and Y
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#52525b';

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Draw Functions
    functions.forEach((fn) => {
      if (!fn.visible || !fn.expression.trim()) return;

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = fn.color;

      let isPlotting = false;
      const stepPixel = 2; // sample every 2 screen pixels

      for (let px = 0; px <= width; px += stepPixel) {
        const mathX = (px - originX) / scale;
        const { result, error } = evaluateExpression(fn.expression, 'rad', mathX);

        if (error !== null || isNaN(result) || !isFinite(result)) {
          isPlotting = false;
          continue;
        }

        const py = originY - result * scale;

        // Skip massive vertical asymptotes jumps
        if (py < -height * 2 || py > height * 3) {
          isPlotting = false;
          continue;
        }

        if (!isPlotting) {
          ctx.moveTo(px, py);
          isPlotting = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });

    // Draw Cursor Trace Crosshair
    if (cursorPos) {
      ctx.strokeStyle = 'rgba(165, 180, 252, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(cursorPos.x, 0);
      ctx.lineTo(cursorPos.x, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, cursorPos.y);
      ctx.lineTo(width, cursorPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const mathX = (cursorPos.x - originX) / scale;
      const mathY = (originY - cursorPos.y) / scale;

      // Draw coordinate badge
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1;
      const label = `(x: ${mathX.toFixed(2)}, y: ${mathY.toFixed(2)})`;
      ctx.fillRect(cursorPos.x + 8, cursorPos.y - 26, ctx.measureText(label).width + 16, 20);
      ctx.strokeRect(cursorPos.x + 8, cursorPos.y - 26, ctx.measureText(label).width + 16, 20);

      ctx.fillStyle = '#e0e7ff';
      ctx.fillText(label, cursorPos.x + 16, cursorPos.y - 12);
    }
  }, [functions, viewState, cursorPos]);

  // Resize canvas to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = 420;
      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse interaction handlers for Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setCursorPos({ x: px, y: py });

    if (isDragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };

      setViewState((prev) => ({
        ...prev,
        centerX: prev.centerX - dx / prev.scale,
        centerY: prev.centerY + dy / prev.scale,
      }));
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(5, Math.min(600, prev.scale * factor)),
    }));
  };

  const handleZoom = (direction: 'in' | 'out') => {
    sound.playClick();
    const factor = direction === 'in' ? 1.25 : 0.8;
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(5, Math.min(600, prev.scale * factor)),
    }));
  };

  const handleReset = () => {
    sound.playClear();
    setViewState({ centerX: 0, centerY: 0, scale: 40 });
  };

  const addFunction = () => {
    if (functions.length >= 4) return;
    sound.playClick();
    const newColor = FUNCTION_COLORS[functions.length % FUNCTION_COLORS.length];
    setFunctions([
      ...functions,
      {
        id: Date.now().toString(),
        color: newColor,
        expression: 'cos(x)',
        visible: true,
        isValid: true,
      },
    ]);
  };

  const removeFunction = (id: string) => {
    sound.playClick();
    setFunctions(functions.filter((f) => f.id !== id));
  };

  const toggleVisibility = (id: string) => {
    sound.playClick();
    setFunctions(
      functions.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f))
    );
  };

  const updateExpression = (id: string, expr: string) => {
    setFunctions(
      functions.map((f) => (f.id === id ? { ...f, expression: expr } : f))
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Canvas Viewport */}
      <div 
        id="graphing-canvas-card"
        className="relative bg-[#020617] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            isDragging.current = false;
            setCursorPos(null);
          }}
          onWheel={handleWheel}
          className="w-full cursor-crosshair block"
        />

        {/* Viewport Floating Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Приблизить (+)"
          >
            <ZoomIn className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Отдалить (-)"
          >
            <ZoomOut className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Сбросить масштаб и центр"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Info Legend */}
        <div className="absolute bottom-3 left-4 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 pointer-events-none backdrop-blur-xs">
          Масштаб: {viewState.scale.toFixed(0)} px/ед | Колесико мыши / перетаскивание
        </div>
      </div>

      {/* Preset Library */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Шаблоны:
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              sound.playClick();
              if (functions[0]) {
                updateExpression(functions[0].id, p.expr);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 whitespace-nowrap transition cursor-pointer"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Function Inputs List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Список Функций f(x)
          </h3>
          {functions.length < 4 && (
            <button
              onClick={addFunction}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить функцию
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {functions.map((fn, index) => (
            <div
              key={fn.id}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/70 border border-slate-800 focus-within:border-sky-500/50 focus-within:shadow-[0_0_15px_rgba(14,165,233,0.15)] transition shadow-sm"
            >
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: fn.color }}
              />
              <span className="font-mono text-xs font-bold text-slate-400">
                f{index + 1}(x) =
              </span>
              <input
                type="text"
                value={fn.expression}
                onChange={(e) => updateExpression(fn.id, e.target.value)}
                placeholder="например, 2*x^2 - 3"
                className="flex-1 bg-transparent font-mono text-xs text-white focus:outline-none placeholder:text-slate-600"
              />
              <button
                onClick={() => toggleVisibility(fn.id)}
                className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                title={fn.visible ? 'Скрыть график' : 'Показать график'}
              >
                {fn.visible ? <Eye className="w-4 h-4 text-sky-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
              </button>
              {functions.length > 1 && (
                <button
                  onClick={() => removeFunction(fn.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                  title="Удалить функцию"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
