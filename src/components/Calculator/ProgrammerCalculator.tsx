import React, { useState, useCallback } from 'react';
import { 
  Binary, 
  Cpu, 
  RotateCw, 
  RotateCcw, 
  Hash, 
  Layers, 
  Code,
  Delete
} from 'lucide-react';
import { WordSize } from '../../types';
import { sound } from '../../utils/audio';

type BitwiseOp = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | null;

export const ProgrammerCalculator: React.FC = () => {
  const [value, setValue] = useState<bigint>(BigInt(42));
  const [wordSize, setWordSize] = useState<WordSize>('64');
  const [activeRadix, setActiveRadix] = useState<'HEX' | 'DEC' | 'OCT' | 'BIN'>('DEC');
  const [pendingOp, setPendingOp] = useState<BitwiseOp>(null);
  const [pendingOperand, setPendingOperand] = useState<bigint | null>(null);

  // Mask value according to current word size
  const getMask = useCallback((size: WordSize): bigint => {
    switch (size) {
      case '8': return BigInt('0xFF');
      case '16': return BigInt('0xFFFF');
      case '32': return BigInt('0xFFFFFFFF');
      case '64': return BigInt('0xFFFFFFFFFFFFFFFF');
    }
  }, []);

  const maskValue = useCallback((val: bigint): bigint => {
    const mask = getMask(wordSize);
    return val & mask;
  }, [wordSize, getMask]);

  const currentValue = maskValue(value);

  // Formatted Radix strings
  const hexStr = currentValue.toString(16).toUpperCase();
  const decStr = currentValue.toString(10);
  const octStr = currentValue.toString(8);
  const binStr = currentValue.toString(2).padStart(parseInt(wordSize), '0');

  // ASCII char representation if printable
  const asciiChar = currentValue >= 32n && currentValue <= 126n 
    ? String.fromCharCode(Number(currentValue))
    : '·';

  const handleInputDigit = (digit: string) => {
    sound.playClick();
    try {
      let base = 10;
      if (activeRadix === 'HEX') base = 16;
      if (activeRadix === 'OCT') base = 8;
      if (activeRadix === 'BIN') base = 2;

      let currentStr = '';
      if (activeRadix === 'HEX') currentStr = hexStr;
      if (activeRadix === 'DEC') currentStr = decStr;
      if (activeRadix === 'OCT') currentStr = octStr;
      if (activeRadix === 'BIN') currentStr = binStr.replace(/^0+/, '') || '0';

      const newStr = currentStr === '0' ? digit : currentStr + digit;
      const parsed = BigInt(
        activeRadix === 'HEX' ? '0x' + newStr :
        activeRadix === 'OCT' ? '0o' + newStr :
        activeRadix === 'BIN' ? '0b' + newStr : newStr
      );

      setValue(maskValue(parsed));
    } catch {
      sound.playError();
    }
  };

  const handleClear = () => {
    sound.playClear();
    setValue(BigInt(0));
    setPendingOp(null);
    setPendingOperand(null);
  };

  const handleDelete = () => {
    sound.playClick();
    const str = decStr;
    if (str.length <= 1) {
      setValue(BigInt(0));
    } else {
      setValue(BigInt(str.slice(0, -1)));
    }
  };

  const toggleBit = (bitIndex: number) => {
    sound.playClick();
    const bitMask = 1n << BigInt(bitIndex);
    const toggled = currentValue ^ bitMask;
    setValue(maskValue(toggled));
  };

  const handleBitwiseOp = (op: BitwiseOp) => {
    sound.playOperator();
    setPendingOp(op);
    setPendingOperand(currentValue);
    setValue(BigInt(0));
  };

  const handleExecuteOp = () => {
    if (!pendingOp || pendingOperand === null) return;
    sound.playEquals();

    const a = pendingOperand;
    const b = currentValue;
    let res: bigint = 0n;
    switch (pendingOp) {
      case 'AND': res = BigInt(a & b); break;
      case 'OR': res = BigInt(a | b); break;
      case 'XOR': res = BigInt(a ^ b); break;
      case 'NAND': res = BigInt(~(a & b)); break;
      case 'NOR': res = BigInt(~(a | b)); break;
      case 'XNOR': res = BigInt(~(a ^ b)); break;
    }

    setValue(maskValue(res));
    setPendingOp(null);
    setPendingOperand(null);
  };

  const handleNot = () => {
    sound.playOperator();
    setValue(maskValue(~currentValue));
  };

  const handleShift = (dir: 'left' | 'right') => {
    sound.playOperator();
    if (dir === 'left') {
      setValue(maskValue(currentValue << 1n));
    } else {
      setValue(maskValue(currentValue >> 1n));
    }
  };

  // Build 64-bit array
  const bitCount = parseInt(wordSize);
  const bitArray: boolean[] = [];
  for (let i = bitCount - 1; i >= 0; i--) {
    bitArray.push(((currentValue >> BigInt(i)) & 1n) === 1n);
  }

  const isHexAllowed = (char: string) => {
    if (activeRadix === 'HEX') return true;
    if (activeRadix === 'DEC') return !isNaN(Number(char));
    if (activeRadix === 'OCT') return ['0', '1', '2', '3', '4', '5', '6', '7'].includes(char);
    if (activeRadix === 'BIN') return ['0', '1'].includes(char);
    return false;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Radix Synchronization Display */}
      <div 
        id="programmer-radix-card"
        className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3"
      >
        {/* Word Size & ASCII Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-300">Разрядность шины:</span>
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-full border border-slate-800">
              {(['64', '32', '16', '8'] as WordSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    sound.playClick();
                    setWordSize(size);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition cursor-pointer ${
                    wordSize === size
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {size === '64' ? 'QWORD (64)' : size === '32' ? 'DWORD (32)' : size === '16' ? 'WORD (16)' : 'BYTE (8)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-500">ASCII:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-sky-300 font-bold">
              '{asciiChar}'
            </span>
          </div>
        </div>

        {/* 4 Synchronized Radix Rows */}
        <div className="space-y-2 font-mono text-xs">
          {[
            { id: 'HEX', label: 'HEX', val: hexStr, prefix: '0x' },
            { id: 'DEC', label: 'DEC', val: decStr, prefix: '' },
            { id: 'OCT', label: 'OCT', val: octStr, prefix: '0o' },
            { id: 'BIN', label: 'BIN', val: binStr.replace(/(.{4})/g, '$1 ').trim(), prefix: '0b' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                sound.playClick();
                setActiveRadix(item.id as typeof activeRadix);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition text-left cursor-pointer ${
                activeRadix === item.id
                  ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-10 font-bold text-sky-400">{item.label}</span>
                <span className="text-slate-600 text-[10px]">{item.prefix}</span>
              </div>
              <span className="font-semibold text-sm tracking-wide text-white truncate max-w-[80%]">
                {item.val}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Bit Toggle Matrix */}
      <div 
        id="bit-matrix-card"
        className="bg-[#020617] border border-slate-800 rounded-3xl p-5 space-y-2.5 shadow-xl"
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Binary className="w-4 h-4 text-sky-400" />
            Интерактивная битовая матрица (Кликните бит для инверсии 0 ↔ 1)
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            MSB [{bitCount - 1}] ... LSB [0]
          </span>
        </div>

        {/* Bits grid */}
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-1">
          {bitArray.map((isOne, idx) => {
            const bitIndex = bitCount - 1 - idx;
            return (
              <button
                key={bitIndex}
                onClick={() => toggleBit(bitIndex)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center font-mono transition cursor-pointer ${
                  isOne
                    ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25 border border-sky-400/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
                title={`Бит #${bitIndex} (2^${bitIndex})`}
              >
                <span className="text-xs">{isOne ? '1' : '0'}</span>
                <span className="text-[8px] text-slate-400/70 font-normal">{bitIndex}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Programmer Keypad */}
      <div className="grid grid-cols-6 gap-2">
        {/* Bitwise Controls */}
        <button onClick={() => handleBitwiseOp('AND')} className="prog-btn prog-btn-op">AND</button>
        <button onClick={() => handleBitwiseOp('OR')} className="prog-btn prog-btn-op">OR</button>
        <button onClick={() => handleBitwiseOp('XOR')} className="prog-btn prog-btn-op">XOR</button>
        <button onClick={handleNot} className="prog-btn prog-btn-op">NOT</button>
        <button onClick={() => handleShift('left')} className="prog-btn prog-btn-op" title="Shift Left">&lt;&lt;</button>
        <button onClick={() => handleShift('right')} className="prog-btn prog-btn-op" title="Shift Right">&gt;&gt;</button>

        {/* Row A-F & Hex */}
        {['A', 'B', 'C', 'D', 'E', 'F'].map((hexChar) => (
          <button
            key={hexChar}
            disabled={!isHexAllowed(hexChar)}
            onClick={() => handleInputDigit(hexChar)}
            className={`prog-btn ${
              isHexAllowed(hexChar) ? 'prog-btn-hex' : 'opacity-30 cursor-not-allowed bg-slate-900/50'
            }`}
          >
            {hexChar}
          </button>
        ))}

        {/* Numeric rows */}
        {['7', '8', '9'].map((num) => (
          <button
            key={num}
            disabled={!isHexAllowed(num)}
            onClick={() => handleInputDigit(num)}
            className={`prog-btn ${isHexAllowed(num) ? 'prog-btn-num' : 'opacity-30 cursor-not-allowed'}`}
          >
            {num}
          </button>
        ))}
        <button onClick={() => handleBitwiseOp('NAND')} className="prog-btn prog-btn-op">NAND</button>
        <button onClick={() => handleBitwiseOp('NOR')} className="prog-btn prog-btn-op">NOR</button>
        <button onClick={() => handleBitwiseOp('XNOR')} className="prog-btn prog-btn-op">XNOR</button>

        {['4', '5', '6'].map((num) => (
          <button
            key={num}
            disabled={!isHexAllowed(num)}
            onClick={() => handleInputDigit(num)}
            className={`prog-btn ${isHexAllowed(num) ? 'prog-btn-num' : 'opacity-30 cursor-not-allowed'}`}
          >
            {num}
          </button>
        ))}
        <button onClick={handleDelete} className="prog-btn prog-btn-num text-slate-400 hover:text-rose-400">
          <Delete className="w-4 h-4 mx-auto" />
        </button>
        <button onClick={handleClear} className="prog-btn bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20">AC</button>
        <button onClick={handleExecuteOp} className="prog-btn bg-sky-500 hover:bg-sky-400 text-white font-bold text-lg shadow-lg shadow-sky-500/30 border-none">=</button>

        {['1', '2', '3', '0'].map((num) => (
          <button
            key={num}
            disabled={!isHexAllowed(num)}
            onClick={() => handleInputDigit(num)}
            className={`prog-btn ${isHexAllowed(num) ? 'prog-btn-num' : 'opacity-30 cursor-not-allowed'}`}
          >
            {num}
          </button>
        ))}
      </div>

      <style>{`
        .prog-btn {
          min-height: 48px;
          border-radius: 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: 1px solid rgba(51, 65, 85, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prog-btn:active {
          transform: scale(0.96);
        }
        .prog-btn-num {
          background-color: rgba(30, 41, 59, 0.35);
          color: #ffffff;
          font-size: 16px;
        }
        .prog-btn-num:hover {
          background-color: rgba(30, 41, 59, 0.65);
          border-color: rgba(148, 163, 184, 0.3);
        }
        .prog-btn-hex {
          background-color: rgba(30, 41, 59, 0.5);
          color: #38bdf8;
          font-weight: 700;
        }
        .prog-btn-hex:hover {
          background-color: rgba(51, 65, 85, 0.6);
          color: #7dd3fc;
          border-color: rgba(56, 189, 248, 0.4);
        }
        .prog-btn-op {
          background-color: rgba(30, 41, 59, 0.5);
          color: #38bdf8;
          font-size: 12px;
          font-weight: 700;
        }
        .prog-btn-op:hover {
          background-color: rgba(51, 65, 85, 0.6);
          color: #7dd3fc;
        }
      `}</style>
    </div>
  );
};
