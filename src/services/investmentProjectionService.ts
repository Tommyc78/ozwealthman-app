import { calculateBullionLotValue } from '@/services/calculations';
import { ContributionFrequency, DemoData } from '@/types/models';

type InvestmentSleeve = 'propertyEquity' | 'shares' | 'crypto' | 'bullion' | 'cash';

export type InvestmentProjectionAssumptions = {
  currentAge: number;
  targetAge: number;
  monthlyIncomeTarget: number;
  extraInvestmentAmount: number;
  investmentFrequency: ContributionFrequency;
  propertyGrowthRate: number;
  etfGrowthRate: number;
  cryptoGrowthRate: number;
  metalsGrowthRate: number;
  cashReturnRate: number;
  drawdownRate: number;
};

export type InvestmentProjectionPoint = Record<InvestmentSleeve, number> & {
  age: number;
  totalBalance: number;
  monthlyIncomeEstimate: number;
};

export type InvestmentProjectionScenario = {
  points: InvestmentProjectionPoint[];
  annualExtraInvestment: number;
  targetPoint: InvestmentProjectionPoint;
  age67Point: InvestmentProjectionPoint;
  projectedMonthlyIncome: number;
  monthlyIncomeGap: number;
  allocationAtTarget: Array<{ label: string; value: number; percent: number }>;
  strategySignals: string[];
};

const frequencyMultiplier: Record<ContributionFrequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annual: 1,
};

export function getPersonalInvestmentBase(data: DemoData) {
  const personalAccountIds = new Set(data.accounts.filter((account) => !account.is_smsf).map((account) => account.id));
  const propertyEquity = data.propertyHoldings
    .filter((property) => property.ownership_type === 'personal')
    .reduce((total, property) => total + property.current_value - property.loan_balance, 0);
  const shares = data.shareHoldings
    .filter((holding) => personalAccountIds.has(holding.account_id))
    .reduce((total, holding) => total + holding.current_value, 0);
  const crypto = data.cryptoHoldings
    .filter((holding) => personalAccountIds.has(holding.account_id))
    .reduce((total, holding) => total + holding.current_value, 0);
  const bullion = data.bullionLots
    .filter((lot) => personalAccountIds.has(lot.account_id))
    .map(calculateBullionLotValue)
    .reduce((total, lot) => total + lot.currentEstimatedValue, 0);
  const cash = data.accounts
    .filter((account) => personalAccountIds.has(account.id))
    .reduce((total, account) => total + (account.current_balance ?? 0), 0);

  return {
    propertyEquity,
    shares,
    crypto,
    bullion,
    cash,
    totalBalance: propertyEquity + shares + crypto + bullion + cash,
  };
}

export function getInvestmentProjectionScenario(data: DemoData, assumptions: InvestmentProjectionAssumptions): InvestmentProjectionScenario {
  const base = getPersonalInvestmentBase(data);
  const finalAge = Math.max(assumptions.targetAge, 67, assumptions.currentAge);
  const annualExtraInvestment = assumptions.extraInvestmentAmount * frequencyMultiplier[assumptions.investmentFrequency];
  const points: InvestmentProjectionPoint[] = [];

  let propertyEquity = base.propertyEquity;
  let shares = base.shares;
  let crypto = base.crypto;
  let bullion = base.bullion;
  let cash = base.cash;

  for (let age = assumptions.currentAge; age <= finalAge; age += 1) {
    if (age > assumptions.currentAge) {
      propertyEquity *= 1 + assumptions.propertyGrowthRate;
      shares = shares * (1 + assumptions.etfGrowthRate) + annualExtraInvestment;
      crypto *= 1 + assumptions.cryptoGrowthRate;
      bullion *= 1 + assumptions.metalsGrowthRate;
      cash *= 1 + assumptions.cashReturnRate;
    }

    const totalBalance = propertyEquity + shares + crypto + bullion + cash;
    points.push({
      age,
      propertyEquity,
      shares,
      crypto,
      bullion,
      cash,
      totalBalance,
      monthlyIncomeEstimate: (totalBalance * assumptions.drawdownRate) / 12,
    });
  }

  const targetPoint = points.find((point) => point.age === assumptions.targetAge) ?? points[points.length - 1];
  const age67Point = points.find((point) => point.age === 67) ?? points[points.length - 1];
  const projectedMonthlyIncome = targetPoint.monthlyIncomeEstimate;
  const monthlyIncomeGap = projectedMonthlyIncome - assumptions.monthlyIncomeTarget;
  const allocationAtTarget = [
    { label: 'Property equity', value: targetPoint.propertyEquity },
    { label: 'ETFs / shares / other', value: targetPoint.shares },
    { label: 'Crypto', value: targetPoint.crypto },
    { label: 'Metals', value: targetPoint.bullion },
    { label: 'Cash', value: targetPoint.cash },
  ].map((item) => ({
    ...item,
    percent: targetPoint.totalBalance > 0 ? (item.value / targetPoint.totalBalance) * 100 : 0,
  }));

  return {
    points,
    annualExtraInvestment,
    targetPoint,
    age67Point,
    projectedMonthlyIncome,
    monthlyIncomeGap,
    allocationAtTarget,
    strategySignals: getInvestmentSignals(allocationAtTarget, monthlyIncomeGap, annualExtraInvestment),
  };
}

function getInvestmentSignals(
  allocation: Array<{ label: string; value: number; percent: number }>,
  monthlyIncomeGap: number,
  annualExtraInvestment: number,
) {
  const propertyPercent = allocation.find((item) => item.label === 'Property equity')?.percent ?? 0;
  const liquidPercent = allocation
    .filter((item) => item.label !== 'Property equity')
    .reduce((total, item) => total + item.percent, 0);
  const cryptoPercent = allocation.find((item) => item.label === 'Crypto')?.percent ?? 0;
  const signals: string[] = [];

  if (monthlyIncomeGap >= 0) {
    signals.push('Projected personal portfolio income clears the nominated target under these assumptions.');
  } else {
    signals.push('Projected income is below target, so test a higher investing rate, longer timeframe, lower spending target or different allocation.');
  }

  if (propertyPercent > 55) {
    signals.push('Personal wealth is heavily property-led, so keep debt, maintenance, land tax, insurance and sale-cost scenarios visible.');
  } else {
    signals.push('The personal portfolio has a healthier balance between property and liquid assets for future flexibility.');
  }

  if (liquidPercent < 35) {
    signals.push('Liquid assets are relatively light; build ETFs, cash or other liquid holdings before relying on the portfolio for income.');
  }

  if (cryptoPercent > 10) {
    signals.push('Crypto is large enough to stress test a major drawdown before counting it as dependable income capital.');
  }

  if (annualExtraInvestment > 0) {
    signals.push('Regular extra investing is the main controllable lever in this scenario and compounds through the ETF/share sleeve.');
  }

  signals.push('Use this for personal investment scenario planning only; tax, debt and advice decisions still need professional confirmation.');
  return signals;
}
