import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Ruler, 
  Scale, 
  Thermometer, 
  Gauge, 
  HardDrive, 
  Box, 
  Square
} from 'lucide-react';
import { UnitCategory, UnitDefinition } from '../../types';
import { sound } from '../../utils/audio';

const CATEGORIES: { id: UnitCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'length', label: 'Длина', icon: Ruler },
  { id: 'mass', label: 'Масса', icon: Scale },
  { id: 'temperature', label: 'Температура', icon: Thermometer },
  { id: 'speed', label: 'Скорость', icon: Gauge },
  { id: 'digital', label: 'Данные', icon: HardDrive },
  { id: 'area', label: 'Площадь', icon: Square },
  { id: 'volume', label: 'Объем', icon: Box },
];

const UNITS_MAP: Record<UnitCategory, UnitDefinition[]> = {
  length: [
    { id: 'm', name: 'Метры', symbol: 'м', toBase: (v) => v, fromBase: (v) => v },
    { id: 'km', name: 'Километры', symbol: 'км', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'cm', name: 'Сантиметры', symbol: 'см', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
    { id: 'mm', name: 'Миллиметры', symbol: 'мм', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
    { id: 'inch', name: 'Дюймы', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { id: 'foot', name: 'Футы', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { id: 'mile', name: 'Мили', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { id: 'nmi', name: 'Морские мили', symbol: 'nmi', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
  ],
  mass: [
    { id: 'kg', name: 'Килограммы', symbol: 'кг', toBase: (v) => v, fromBase: (v) => v },
    { id: 'g', name: 'Граммы', symbol: 'г', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
    { id: 'mg', name: 'Миллиграммы', symbol: 'мг', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
    { id: 'ton', name: 'Метрические тонны', symbol: 'т', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'lb', name: 'Фунты', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
    { id: 'oz', name: 'Унции', symbol: 'oz', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
    { id: 'carat', name: 'Караты', symbol: 'ct', toBase: (v) => v * 0.0002, fromBase: (v) => v / 0.0002 },
  ],
  temperature: [
    { id: 'c', name: 'Цельсий', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
    { id: 'f', name: 'Фаренгейт', symbol: '°F', toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
    { id: 'k', name: 'Кельвин', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  speed: [
    { id: 'kmh', name: 'Км/ч', symbol: 'км/ч', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    { id: 'ms', name: 'Метры в секунду', symbol: 'м/с', toBase: (v) => v, fromBase: (v) => v },
    { id: 'mph', name: 'Мили в час', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    { id: 'knot', name: 'Узлы', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    { id: 'mach', name: 'Мах (Звук)', symbol: 'M', toBase: (v) => v * 343, fromBase: (v) => v / 343 },
  ],
  digital: [
    { id: 'mb', name: 'Мегабайты (MB)', symbol: 'MB', toBase: (v) => v, fromBase: (v) => v },
    { id: 'byte', name: 'Байты', symbol: 'B', toBase: (v) => v / (1024 * 1024), fromBase: (v) => v * 1024 * 1024 },
    { id: 'kb', name: 'Килобайты (KB)', symbol: 'KB', toBase: (v) => v / 1024, fromBase: (v) => v * 1024 },
    { id: 'gb', name: 'Гигабайты (GB)', symbol: 'GB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    { id: 'tb', name: 'Терабайты (TB)', symbol: 'TB', toBase: (v) => v * 1024 * 1024, fromBase: (v) => v / (1024 * 1024) },
    { id: 'bit', name: 'Биты', symbol: 'bit', toBase: (v) => v / (8 * 1024 * 1024), fromBase: (v) => v * 8 * 1024 * 1024 },
  ],
  area: [
    { id: 'sqm', name: 'Кв. метры', symbol: 'м²', toBase: (v) => v, fromBase: (v) => v },
    { id: 'ha', name: 'Гектары', symbol: 'га', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    { id: 'sqkm', name: 'Кв. километры', symbol: 'км²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    { id: 'sqft', name: 'Кв. футы', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    { id: 'acre', name: 'Акры', symbol: 'ac', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
  ],
  volume: [
    { id: 'l', name: 'Литры', symbol: 'л', toBase: (v) => v, fromBase: (v) => v },
    { id: 'ml', name: 'Миллилитры', symbol: 'мл', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
    { id: 'cbm', name: 'Кубические метры', symbol: 'м³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'gal', name: 'Галлоны (США)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    { id: 'floz', name: 'Жидкие унции', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
  ],
};

export const UnitConverter: React.FC = () => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnitId, setFromUnitId] = useState<string>('m');
  const [toUnitId, setToUnitId] = useState<string>('km');
  const [inputValue, setInputValue] = useState<number>(1000);

  const units = UNITS_MAP[category] || [];
  const fromUnit = units.find((u) => u.id === fromUnitId) || units[0];
  const toUnit = units.find((u) => u.id === toUnitId) || units[1] || units[0];

  // Convert
  const baseValue = fromUnit.toBase(inputValue);
  const convertedValue = toUnit.fromBase(baseValue);

  const handleCategoryChange = (newCat: UnitCategory) => {
    sound.playClick();
    setCategory(newCat);
    const newUnits = UNITS_MAP[newCat];
    setFromUnitId(newUnits[0]?.id || '');
    setToUnitId(newUnits[1]?.id || newUnits[0]?.id || '');
  };

  const handleSwap = () => {
    sound.playOperator();
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition whitespace-nowrap font-semibold cursor-pointer ${
                category === cat.id
                  ? 'bg-sky-500 border-sky-400 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Conversion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
        {/* From Input Card */}
        <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
          <div className="text-xs text-slate-400 font-semibold">Исходная величина (Из):</div>
          <input
            type="number"
            value={inputValue || ''}
            onChange={(e) => setInputValue(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 font-mono text-2xl font-bold text-white focus:outline-none focus:border-sky-500 focus:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition"
          />
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-mono">Единица измерения:</label>
            <select
              value={fromUnitId}
              onChange={(e) => {
                sound.playClick();
                setFromUnitId(e.target.value);
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-4 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-white shadow-xl shadow-sky-500/10 hover:shadow-sky-500/25 transition cursor-pointer"
            title="Поменять местами"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        {/* To Output Card */}
        <div className="bg-[#020617] border border-slate-800 rounded-3xl p-6 space-y-3 shadow-2xl">
          <div className="text-xs text-slate-400 font-semibold">Результат (В):</div>
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl font-mono text-2xl font-bold text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.25)] overflow-x-auto whitespace-nowrap select-all">
            {isFinite(convertedValue)
              ? convertedValue.toLocaleString('en-US', { maximumFractionDigits: 6 })
              : 'Error'}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-mono">Единица измерения:</label>
            <select
              value={toUnitId}
              onChange={(e) => {
                sound.playClick();
                setToUnitId(e.target.value);
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick reference table of all units */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300">
          Сводная таблица перевода для 1 {fromUnit.symbol}:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {units.map((u) => {
            const val = u.fromBase(fromUnit.toBase(1));
            return (
              <div key={u.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[10px] block">{u.name}:</span>
                <span className="text-white font-bold">{val < 1e-4 ? val.toExponential(3) : val.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span> <span className="text-sky-400 text-[10px]">{u.symbol}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
