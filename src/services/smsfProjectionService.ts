import { getSMSFSummary } from '@/services/calculations';
import { ContributionFrequency, DemoData } from '@/types/models';

type GrowthSleeve = 'propertyEquity' | 'shares' | 'crypto' | 'bullion' | 'cash';

export type SMSFProjectionAssumptions = {
  currentAge: number;
  preservationAge: number;
  extraContributionAmount: number;
  contributionFrequency: ContributionFrequency;
  propertyGrowthRate: number;
  etfGrowthRate: number;
  cryptoGrowthRate: number;
  metalsGrowthRate: number;
  cashReturnRate: number;
  drawdownRate: number;
  monthlyRetirementBudget: number;
};

export type SMSFProjectionPoint = Record<GrowthSleeve, number> & {
  age: number;
  totalBalance: number;
  monthlyDrawdownEstimate: number;
};

export type SMSFProjectionScenario = {
  points: SMSFProjectionPoint[];
  annualExtraContribution: number;
  preservationPoint: SMSFProjectionPoint;
  age67Point: SMSFProjectionPoint;
  projectedMonthlyBudget: number;
  monthlyBudgetGap: number;
  allocationAtPreservation: Array<{ label: string; value: number; percent: number }>;
  strategySignals: string[];
};

const frequencyMultiplier: Record<ContributionFrequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annual: 1,
};

export function getSMSFProjectionScenario(data: DemoData, assumptions: SMSFProjectionAssumptions): SMSFProjectionScenario {
  const summary = getSMSFSummary(data);
  const finalAge = Math.max(67, assumptions.preservationAge, assumptions.currentAge);
  const annualExtraContribution = assumptions.extraContributionAmount * frequencyMultiplier[assumptions.contributionFrequency];
  const points: SMSFProjectionPoint[] = [];

  let propertyEquity = summary.propertyEquity;
  let shares = summary.shares;
  let crypto = summary.crypto;
  let bullion = summary.bullion;
  let cash = summary.cash;

  for (let age = assumptions.currentAge; age <= finalAge; age += 1) {
    if (age > assumptions.currentAge) {
      propertyEquity *= 1 + assumptions.propertyGrowthRate;
      shares *= 1 + assumptions.etfGrowthRate;
      crypto *= 1 + assumptions.cryptoGrowthRate;
      bullion *= 1 + assumptions.metalsGrowthRate;
      cash = cash * (1 + assumptions.cashReturnRate) + annualExtraContribution;
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
      monthlyDrawdownEstimate: (totalBalance * assumptions.drawdownRate) / 12,
    });
  }

  const preservationPoint = points.find((point) => point.age === assumptions.preservationAge) ?? points[points.length - 1];
  const age67Point = points.find((point) => point.age === 67) ?? points[points.length - 1];
  const projectedMonthlyBudget = preservationPoint.monthlyDrawdownEstimate;
  const monthlyBudgetGap = projectedMonthlyBudget - assumptions.monthlyRetirementBudget;
  const allocationAtPreservation = [
    { label: 'Property equity', value: preservationPoint.propertyEquity },
    { label: 'ETFs', value: preservationPoint.shares },
    { label: 'Crypto', value: preservationPoint.crypto },
    { label: 'Metals', value: preservationPoint.bullion },
    { label: 'Cash', value: preservationPoint.cash },
  ].map((item) => ({
    ...item,
    percent: preservationPoint.totalBalance > 0 ? (item.value / preservationPoint.totalBalance) * 100 : 0,
  }));

  return {
    points,
    annualExtraContribution,
    preservationPoint,
    age67Point,
    projectedMonthlyBudget,
    monthlyBudgetGap,
    allocationAtPreservation,
    strategySignals: getStrategySignals(summary.liquidityMonths, allocationAtPreservation, monthlyBudgetGap, annualExtraContribution),
  };
}

function getStrategySignals(
  liquidityMonths: number,
  allocation: Array<{ label: string; value: number; percent: number }>,
  monthlyBudgetGap: number,
  annualExtraContribution: number,
) {
  const propertyPercent = allocation.find((item) => item.label === 'Property equity')?.percent ?? 0;
  const cryptoPercent = allocation.find((item) => item.label === 'Crypto')?.percent ?? 0;
  const cashPercent = allocation.find((item) => item.label === 'Cash')?.percent ?? 0;
  const signals: string[] = [];

  if (monthlyBudgetGap >= 0) {
    signals.push('Projected pension-phase budget clears the nominated monthly spending target under the current assumptions.');
  } else {
    signals.push('Projected pension-phase budget is below target, so test extra contributions, delayed access, lower expenses, or asset changes.');
  }

  if (liquidityMonths < 12 || cashPercent < 5) {
    signals.push('Build a larger SMSF cash reserve before preservation age so property bills, audit costs and pension payments are not forced by market timing.');
  } else {
    signals.push('Liquidity looks workable for transition planning, with cash available for expenses and first drawdown needs.');
  }

  if (propertyPercent > 60) {
    signals.push('Property remains the dominant sleeve, so review debt, rent cover, insurance, bare trust records and sale timing well before access age.');
  } else {
    signals.push('Property exposure is material but not overwhelming the scenario, leaving more room for liquid assets to fund withdrawals.');
  }

  if (cryptoPercent > 10) {
    signals.push('Crypto exposure is high enough to treat as a volatile sleeve; stress test drawdowns before relying on it for retirement income.');
  }

  if (annualExtraContribution > 0) {
    signals.push('Extra contributions are materially improving the runway, subject to contribution caps, tax treatment and personal eligibility rules.');
  }

  signals.push('Use this as scenario planning only, then confirm pension phase, tax and investment strategy with licensed SMSF and tax professionals.');
  return signals;
}
