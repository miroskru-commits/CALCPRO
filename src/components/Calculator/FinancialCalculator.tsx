import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  PieChart, 
  Users, 
  Calculator,
  Calendar,
  Wallet
} from 'lucide-react';
import { sound } from '../../utils/audio';

export const FinancialCalculator: React.FC = () => {
  const [finTab, setFinTab] = useState<'loan' | 'compound' | 'tip'>('loan');

  // Loan State
  const [loanAmount, setLoanAmount] = useState<number>(3000000); // 3 млн руб or $300,000
  const [interestRate, setInterestRate] = useState<number>(12.5); // %
  const [loanTermYears, setLoanTermYears] = useState<number>(15); // years

  // Compound State
  const [initialDeposit, setInitialDeposit] = useState<number>(100000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(15000);
  const [investmentReturn, setInvestmentReturn] = useState<number>(14); // %
  const [investmentYears, setInvestmentYears] = useState<number>(10);

  // Tip State
  const [billAmount, setBillAmount] = useState<number>(3500);
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [splitCount, setSplitCount] = useState<number>(3);

  // Loan Calculations
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;
  const emi = monthlyRate > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : loanAmount / totalMonths;

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;
  const principalPercent = totalPayment > 0 ? (loanAmount / totalPayment) * 100 : 100;
  const interestPercent = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  // Compound Calculations
  const r = investmentReturn / 100 / 12;
  const n = investmentYears * 12;
  const futurePrincipal = initialDeposit * Math.pow(1 + r, n);
  const futureContributions = r > 0
    ? monthlyContribution * ((Math.pow(1 + r, n) - 1) / r)
    : monthlyContribution * n;
  const totalFutureValue = futurePrincipal + futureContributions;
  const totalInvested = initialDeposit + monthlyContribution * n;
  const totalGains = Math.max(0, totalFutureValue - totalInvested);

  // Tip Calculations
  const totalTip = (billAmount * tipPercent) / 100;
  const grandTotal = billAmount + totalTip;
  const perPerson = splitCount > 0 ? grandTotal / splitCount : grandTotal;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Sub tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
        <button
          onClick={() => {
            sound.playClick();
            setFinTab('loan');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold transition cursor-pointer ${
            finTab === 'loan'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Ипотека & Кредит (Аннуитет)
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setFinTab('compound');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold transition cursor-pointer ${
            finTab === 'compound'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Сложный Процент & Инвестиции
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setFinTab('tip');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold transition cursor-pointer ${
            finTab === 'tip'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Чаевые & Разделение Счета
        </button>
      </div>

      {/* LOAN MODULE */}
      {finTab === 'loan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-sky-400" />
              Параметры Кредита
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Сумма кредита:</span>
                <span className="text-white font-bold">{loanAmount.toLocaleString('ru-RU')} ₽</span>
              </div>
              <input
                type="range"
                min="50000"
                max="30000000"
                step="50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Процентная ставка:</span>
                <span className="text-white font-bold">{interestRate}% годовых</span>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Срок кредита:</span>
                <span className="text-white font-bold">{loanTermYears} лет ({totalMonths} мес)</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Outputs & Visual Breakdown */}
          <div className="bg-[#020617] border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-2xl">
            <div className="space-y-3">
              <div className="text-xs text-slate-400">Ежемесячный платеж (EMI):</div>
              <div className="font-mono text-3xl font-extrabold text-sky-400 tracking-tight drop-shadow-[0_0_15px_rgba(14,165,233,0.2)]">
                {Math.round(emi).toLocaleString('ru-RU')} ₽ <span className="text-sm font-normal text-slate-400">/ мес</span>
              </div>

              {/* Progress Bar Proportion */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span className="text-emerald-400">Тело долга: {principalPercent.toFixed(1)}%</span>
                  <span className="text-rose-400">Переплата (проценты): {interestPercent.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div style={{ width: `${principalPercent}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${interestPercent}%` }} className="bg-rose-500 h-full" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Всего к возврату:</div>
                <div className="text-white font-bold mt-0.5">{Math.round(totalPayment).toLocaleString('ru-RU')} ₽</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Сумма переплаты:</div>
                <div className="text-rose-400 font-bold mt-0.5">{Math.round(totalInterest).toLocaleString('ru-RU')} ₽</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPOUND INTEREST */}
      {finTab === 'compound' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Параметры Инвестиций
            </h3>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Начальный капитал:</span>
                <span className="text-white font-bold">{initialDeposit.toLocaleString('ru-RU')} ₽</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000000"
                step="25000"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Ежемесячное пополнение:</span>
                <span className="text-white font-bold">{monthlyContribution.toLocaleString('ru-RU')} ₽</span>
              </div>
              <input
                type="range"
                min="0"
                max="200000"
                step="1000"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Ожидаемая доходность:</span>
                <span className="text-white font-bold">{investmentReturn}% годовых</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="0.5"
                value={investmentReturn}
                onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Горизонт инвестирования:</span>
                <span className="text-white font-bold">{investmentYears} лет</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={investmentYears}
                onChange={(e) => setInvestmentYears(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-[#020617] border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-2xl">
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Итоговый капитал через {investmentYears} лет:</div>
              <div className="font-mono text-3xl font-extrabold text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                {Math.round(totalFutureValue).toLocaleString('ru-RU')} ₽
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300">
                🚀 Сложный процент заработает вам: <strong>{Math.round(totalGains).toLocaleString('ru-RU')} ₽</strong> чистого дохода!
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-4 border-t border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Вложено средств:</div>
                <div className="text-white font-bold mt-0.5">{Math.round(totalInvested).toLocaleString('ru-RU')} ₽</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Доход от %:</div>
                <div className="text-emerald-400 font-bold mt-0.5">{Math.round(totalGains).toLocaleString('ru-RU')} ₽</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIP SPLITTER */}
      {finTab === 'tip' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Счет в ресторане
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono">Сумма счета (₽):</label>
              <input
                type="number"
                value={billAmount || ''}
                onChange={(e) => setBillAmount(Math.max(0, Number(e.target.value)))}
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-white text-base focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Чаевые:</span>
                <span className="text-sky-400 font-bold">{tipPercent}%</span>
              </div>
              <div className="flex gap-2">
                {[0, 5, 10, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setTipPercent(pct)}
                    className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                      tipPercent === pct
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Количество персон:</span>
                <span className="text-white font-bold">{splitCount} чел.</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={splitCount}
                onChange={(e) => setSplitCount(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-[#020617] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-2xl">
            <div className="space-y-2">
              <div className="text-xs text-slate-400">К оплате с каждого человека:</div>
              <div className="font-mono text-4xl font-black text-sky-400 tracking-tight drop-shadow-[0_0_15px_rgba(14,165,233,0.2)]">
                {perPerson.toFixed(2)} ₽
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-4 border-t border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Чаевые всего:</div>
                <div className="text-sky-400 font-bold mt-0.5">{totalTip.toFixed(2)} ₽</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Итоговый счет:</div>
                <div className="text-white font-bold mt-0.5">{grandTotal.toFixed(2)} ₽</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
