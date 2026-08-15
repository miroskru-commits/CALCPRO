import React, { useState } from 'react';
import { Grid, Sparkles, RefreshCw, Equal } from 'lucide-react';
import { sound } from '../../utils/audio';

type MatrixSize = 2 | 3;

export const MatrixCalculator: React.FC = () => {
  const [size, setSize] = useState<MatrixSize>(2);
  const [matrixA, setMatrixA] = useState<number[][]>([
    [1, 2],
    [3, 4],
  ]);
  const [matrixB, setMatrixB] = useState<number[][]>([
    [5, 6],
    [7, 8],
  ]);
  const [resultMatrix, setResultMatrix] = useState<number[][] | null>(null);
  const [scalarResult, setScalarResult] = useState<string | null>(null);
  const [operationLabel, setOperationLabel] = useState<string>('');

  const handleSizeChange = (newSize: MatrixSize) => {
    sound.playClick();
    setSize(newSize);
    if (newSize === 2) {
      setMatrixA([[1, 2], [3, 4]]);
      setMatrixB([[5, 6], [7, 8]]);
    } else {
      setMatrixA([[1, 2, 3], [0, 1, 4], [5, 6, 0]]);
      setMatrixB([[2, 0, -1], [1, 3, 2], [0, -2, 1]]);
    }
    setResultMatrix(null);
    setScalarResult(null);
  };

  const updateCell = (target: 'A' | 'B', row: number, col: number, val: number) => {
    if (target === 'A') {
      const next = matrixA.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? val : c)));
      setMatrixA(next);
    } else {
      const next = matrixB.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? val : c)));
      setMatrixB(next);
    }
  };

  // Determinant calculation
  const calcDeterminant = (mat: number[][]): number => {
    if (mat.length === 2) {
      return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
    }
    if (mat.length === 3) {
      return (
        mat[0][0] * (mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1]) -
        mat[0][1] * (mat[1][0] * mat[2][2] - mat[1][2] * mat[2][0]) +
        mat[0][2] * (mat[1][0] * mat[2][1] - mat[1][1] * mat[2][0])
      );
    }
    return 0;
  };

  const handleDetA = () => {
    sound.playEquals();
    const det = calcDeterminant(matrixA);
    setScalarResult(`det(A) = ${det}`);
    setResultMatrix(null);
    setOperationLabel('Определитель матрицы A:');
  };

  const handleAdd = () => {
    sound.playEquals();
    const res = matrixA.map((r, ri) => r.map((c, ci) => c + matrixB[ri][ci]));
    setResultMatrix(res);
    setScalarResult(null);
    setOperationLabel('Сложение матриц (A + B):');
  };

  const handleSub = () => {
    sound.playEquals();
    const res = matrixA.map((r, ri) => r.map((c, ci) => c - matrixB[ri][ci]));
    setResultMatrix(res);
    setScalarResult(null);
    setOperationLabel('Вычитание матриц (A - B):');
  };

  const handleMultiply = () => {
    sound.playEquals();
    const n = size;
    const res: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          res[i][j] += matrixA[i][k] * matrixB[k][j];
        }
      }
    }

    setResultMatrix(res);
    setScalarResult(null);
    setOperationLabel('Умножение матриц (A × B):');
  };

  const handleTransposeA = () => {
    sound.playEquals();
    const n = size;
    const res = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => matrixA[j][i]));
    setResultMatrix(res);
    setScalarResult(null);
    setOperationLabel('Транспонированная матрица Aᵀ:');
  };

  const handleInvertA = () => {
    sound.playEquals();
    const det = calcDeterminant(matrixA);
    if (Math.abs(det) < 1e-12) {
      sound.playError();
      setScalarResult('Матрица вырождена (det = 0). Обратной матрицы не существует.');
      setResultMatrix(null);
      setOperationLabel('Инверсия A⁻¹:');
      return;
    }

    if (size === 2) {
      const inv = [
        [matrixA[1][1] / det, -matrixA[0][1] / det],
        [-matrixA[1][0] / det, matrixA[0][0] / det],
      ];
      setResultMatrix(inv);
      setScalarResult(null);
      setOperationLabel(`Обратная матрица A⁻¹ (det = ${det}):`);
    } else {
      // 3x3 adjugate
      const m = matrixA;
      const c00 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
      const c01 = -(m[1][0] * m[2][2] - m[1][2] * m[2][0]);
      const c02 = m[1][0] * m[2][1] - m[1][1] * m[2][0];

      const c10 = -(m[0][1] * m[2][2] - m[0][2] * m[2][1]);
      const c11 = m[0][0] * m[2][2] - m[0][2] * m[2][0];
      const c12 = -(m[0][0] * m[2][1] - m[0][1] * m[2][0]);

      const c20 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
      const c21 = -(m[0][0] * m[1][2] - m[0][2] * m[1][0]);
      const c22 = m[0][0] * m[1][1] - m[0][1] * m[1][0];

      // Transposed cofactor / det
      const inv = [
        [c00 / det, c10 / det, c20 / det],
        [c01 / det, c11 / det, c21 / det],
        [c02 / det, c12 / det, c22 / det],
      ];
      setResultMatrix(inv);
      setScalarResult(null);
      setOperationLabel(`Обратная матрица A⁻¹ (det = ${det}):`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Dimension Selector */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 text-xs shadow-lg">
        <span className="font-semibold text-slate-300 flex items-center gap-2">
          <Grid className="w-4 h-4 text-sky-400" />
          Размерность матриц:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handleSizeChange(2)}
            className={`px-3.5 py-1.5 rounded-full font-mono font-bold transition cursor-pointer ${
              size === 2
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            2 × 2
          </button>
          <button
            onClick={() => handleSizeChange(3)}
            className={`px-3.5 py-1.5 rounded-full font-mono font-bold transition cursor-pointer ${
              size === 3
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            3 × 3
          </button>
        </div>
      </div>

      {/* Matrices A and B Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matrix A */}
        <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-sky-400 font-mono">Матрица A</h3>
            <span className="text-[11px] text-slate-500 font-mono">{size}x{size}</span>
          </div>

          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {matrixA.map((row, ri) =>
              row.map((val, ci) => (
                <input
                  key={`a-${ri}-${ci}`}
                  type="number"
                  value={val}
                  onChange={(e) => updateCell('A', ri, ci, Number(e.target.value))}
                  className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl font-mono text-center font-bold text-white text-base focus:outline-none focus:border-sky-500 focus:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition"
                />
              ))
            )}
          </div>
        </div>

        {/* Matrix B */}
        <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400 font-mono">Матрица B</h3>
            <span className="text-[11px] text-slate-500 font-mono">{size}x{size}</span>
          </div>

          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {matrixB.map((row, ri) =>
              row.map((val, ci) => (
                <input
                  key={`b-${ri}-${ci}`}
                  type="number"
                  value={val}
                  onChange={(e) => updateCell('B', ri, ci, Number(e.target.value))}
                  className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl font-mono text-center font-bold text-white text-base focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operation Actions */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs font-mono">
        <button
          onClick={handleAdd}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold transition border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          A + B
        </button>
        <button
          onClick={handleSub}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold transition border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          A − B
        </button>
        <button
          onClick={handleMultiply}
          className="p-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition shadow-lg shadow-sky-500/25 border-none cursor-pointer"
        >
          A × B
        </button>
        <button
          onClick={handleDetA}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-sky-400 font-bold transition border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          det(A)
        </button>
        <button
          onClick={handleInvertA}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-sky-400 font-bold transition border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          A⁻¹ (Inverse)
        </button>
        <button
          onClick={handleTransposeA}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-sky-400 font-bold transition border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          Aᵀ (Transpose)
        </button>
      </div>

      {/* Result Display */}
      {(resultMatrix || scalarResult) && (
        <div className="bg-[#020617] border border-slate-800 rounded-3xl p-6 space-y-3 shadow-2xl animate-fadeIn">
          <h4 className="text-xs font-semibold text-slate-400 font-mono">
            {operationLabel}
          </h4>

          {scalarResult && (
            <div className="font-mono text-2xl font-bold text-sky-300 drop-shadow-[0_0_15px_rgba(14,165,233,0.25)]">
              {scalarResult}
            </div>
          )}

          {resultMatrix && (
            <div
              className="grid gap-2.5 max-w-md mx-auto"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {resultMatrix.map((row, ri) =>
                row.map((val, ci) => (
                  <div
                    key={`res-${ri}-${ci}`}
                    className="p-3.5 bg-slate-900 border border-sky-500/30 rounded-2xl font-mono text-center font-bold text-sky-300 text-lg shadow-[0_0_15px_rgba(14,165,233,0.1)]"
                  >
                    {Number.isInteger(val) ? val : val.toFixed(3)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
