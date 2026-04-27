import { demoData } from '@/data/seed';
import { getFallbackQuoteFromStoredPrice } from '@/services/pricing';
import { BullionLot, ContributionFrequency, DemoData, MetalType } from '@/types/models';

const WEEKS_PER_MONTH = 52 / 12;

export type AllocationItem = {
  label: string;
  value: number;
  percent: number;
  colorKey: 'chartOne' | 'chartTwo' | 'chartThree' | 'chartFour' | 'chartFive';
};

export type DashboardSummary = ReturnType<typeof getDashboardSummary>;

export function getCashTotal(data: DemoData = demoData) {
  return data.accounts.reduce((total, account) => total + (account.current_balance ?? 0), 0);
}

export function getPropertyEquity(data: DemoData = demoData) {
  return data.propertyHoldings.reduce((total, property) => total + property.current_value - property.loan_balance, 0);
}

export function getPropertyValue(data: DemoData = demoData) {
  return data.propertyHoldings.reduce((total, property) => total + property.current_value, 0);
}

export function getTotalLoanBalance(data: DemoData = demoData) {
  return data.propertyHoldings.reduce((total, property) => total + property.loan_balance, 0);
}

export function getSuperTotal(data: DemoData = demoData) {
  return data.superHoldings.reduce((total, holding) => total + holding.current_balance, 0);
}

export function getShareTotal(data: DemoData = demoData) {
  return data.shareHoldings.reduce((total, holding) => total + holding.current_value, 0);
}

export function getCryptoTotal(data: DemoData = demoData) {
  return data.cryptoHoldings.reduce((total, holding) => total + holding.current_value, 0);
}

export function getBullionTotal(data: DemoData = demoData) {
  return data.bullionLots.reduce((total, lot) => total + calculateBullionLotValue(lot).currentEstimatedValue, 0);
}

export function calculateBullionLotValue(lot: BullionLot) {
  const currentEstimatedValue = lot.quantity * lot.current_spot_price;
  const unrealizedGainLoss = currentEstimatedValue - lot.total_cost;
  const gainLossPercent = lot.total_cost > 0 ? (unrealizedGainLoss / lot.total_cost) * 100 : 0;

  return {
    ...lot,
    currentEstimatedValue,
    unrealizedGainLoss,
    gainLossPercent,
    averageBuyPrice: lot.buy_price_per_unit,
  };
}

export function getMonthlySurplus(data: DemoData = demoData) {
  const monthlyIncome = data.profile.annual_income / 12;
  return monthlyIncome - data.profile.estimated_monthly_expenses;
}

export function getPassiveIncomeMonthly(data: DemoData = demoData) {
  const rent = data.propertyHoldings.reduce((total, property) => total + property.weekly_rent * WEEKS_PER_MONTH, 0);
  const estimatedDistributions = getShareTotal(data) * 0.035 / 12;
  return rent + estimatedDistributions;
}

export function getSMSFSummary(data: DemoData = demoData) {
  const smsfAccountIds = new Set(data.accounts.filter((account) => account.is_smsf).map((account) => account.id));
  const smsfProperties = data.propertyHoldings.filter((property) => property.ownership_type === 'smsf');
  const propertyValue = smsfProperties.reduce((total, property) => total + property.current_value, 0);
  const loanBalance = smsfProperties.reduce((total, property) => total + property.loan_balance, 0);
  const cash = data.accounts
    .filter((account) => account.is_smsf)
    .reduce((total, account) => total + (account.current_balance ?? 0), 0);
  const bullion = data.bullionLots
    .filter((lot) => smsfAccountIds.has(lot.account_id))
    .reduce((total, lot) => total + calculateBullionLotValue(lot).currentEstimatedValue, 0);
  const shares = data.shareHoldings
    .filter((holding) => smsfAccountIds.has(holding.account_id))
    .reduce((total, holding) => total + holding.current_value, 0);
  const crypto = data.cryptoHoldings
    .filter((holding) => smsfAccountIds.has(holding.account_id))
    .reduce((total, holding) => total + holding.current_value, 0);
  const monthlyRent = smsfProperties.reduce((total, property) => total + property.weekly_rent * WEEKS_PER_MONTH, 0);
  const annualExpenses = smsfProperties.reduce((total, property) => total + property.annual_expenses, 0);
  const monthlyExpenses = annualExpenses / 12 + 4550;
  const monthlyCashflow = monthlyRent - monthlyExpenses;
  const totalBalance = propertyValue - loanBalance + cash + bullion + shares + crypto;

  return {
    totalBalance,
    propertyValue,
    loanBalance,
    propertyEquity: propertyValue - loanBalance,
    cash,
    bullion,
    shares,
    crypto,
    monthlyRent,
    monthlyExpenses,
    monthlyCashflow,
    liquidityMonths: monthlyExpenses > 0 ? cash / monthlyExpenses : 0,
    warnings: [
      monthlyCashflow < 1000 ? 'SMSF cashflow is tight after loan commitments.' : 'SMSF rental cashflow is covering current loan pressure.',
      cash / Math.max(monthlyExpenses, 1) < 6 ? 'Cash buffer is below six months of SMSF expenses.' : 'SMSF cash buffer is above six months of expenses.',
    ],
  };
}

export function getNetWorth(data: DemoData = demoData) {
  return getCashTotal(data) + getPropertyEquity(data) + getSuperTotal(data) + getShareTotal(data) + getCryptoTotal(data) + getBullionTotal(data);
}

export function getAssetAllocation(data: DemoData = demoData): AllocationItem[] {
  const values = [
    { label: 'Property equity', value: getPropertyEquity(data), colorKey: 'chartOne' as const },
    { label: 'Super', value: getSuperTotal(data), colorKey: 'chartTwo' as const },
    { label: 'ETFs', value: getShareTotal(data), colorKey: 'chartThree' as const },
    { label: 'Crypto', value: getCryptoTotal(data), colorKey: 'chartFour' as const },
    { label: 'Bullion', value: getBullionTotal(data), colorKey: 'chartFive' as const },
  ];
  const total = values.reduce((sum, item) => sum + item.value, 0);
  return values.map((item) => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0,
  }));
}

export function getDashboardSummary(data: DemoData = demoData) {
  const smsf = getSMSFSummary(data);
  const allocation = getAssetAllocation(data);
  const monthlySurplus = getMonthlySurplus(data);
  const passiveIncomeMonthly = getPassiveIncomeMonthly(data);
  const netWorth = getNetWorth(data);

  return {
    netWorth,
    monthlySurplus,
    superTotal: getSuperTotal(data),
    smsfTotal: smsf.totalBalance,
    passiveIncomeMonthly,
    allocation,
    warnings: [
      monthlySurplus < 2500 ? 'Monthly surplus is below the target investing runway.' : 'Monthly surplus supports continued investing.',
      passiveIncomeMonthly * 12 < data.profile.passive_income_target ? 'Passive income is still below the long-term target.' : 'Passive income target is currently met.',
      ...smsf.warnings,
    ],
    recentActivity: data.transactions.slice(0, 5),
    aiSummary: `Your wealth base is concentrated in SMSF property, super, ETFs, crypto and bullion. Current monthly surplus is ${Math.round(
      monthlySurplus,
    ).toLocaleString('en-AU')} AUD before manual investing decisions.`,
  };
}

export function getBudgetSummary(data: DemoData = demoData) {
  const income = data.budgetCategories.filter((category) => category.category_type === 'income');
  const fixed = data.budgetCategories.filter((category) => category.category_type === 'fixed');
  const discretionary = data.budgetCategories.filter((category) => category.category_type === 'discretionary');
  const saving = data.budgetCategories.filter((category) => category.category_type === 'saving');
  const totalIncome = income.reduce((total, category) => total + category.monthly_target, 0);
  const fixedTotal = fixed.reduce((total, category) => total + category.monthly_target, 0);
  const discretionaryTotal = discretionary.reduce((total, category) => total + category.monthly_target, 0);
  const savingTotal = saving.reduce((total, category) => total + category.monthly_target, 0);

  return {
    totalIncome,
    fixedTotal,
    discretionaryTotal,
    savingTotal,
    spendingTotal: fixedTotal + discretionaryTotal,
    surplusAfterTargets: totalIncome - fixedTotal - discretionaryTotal - savingTotal,
    categories: data.budgetCategories,
    trend: [8200, 8750, 9100, 9400, 9050, 9580],
  };
}

export function getSuperProjection(
  data: DemoData = demoData,
  extraContributionAmount = 0,
  frequency: ContributionFrequency = 'weekly',
) {
  const currentBalance = getSuperTotal(data);
  const currentAge = data.user.age;
  const annualSalaryContributions = data.profile.annual_income * data.superHoldings[0].contribution_rate;
  const frequencyMultiplier: Record<ContributionFrequency, number> = {
    weekly: 52,
    fortnightly: 26,
    monthly: 12,
    annual: 1,
  };
  const extraAnnual = extraContributionAmount * frequencyMultiplier[frequency];

  function projectToAge(targetAge: number) {
    const years = Math.max(targetAge - currentAge, 0);
    let balance = currentBalance;
    for (let year = 0; year < years; year += 1) {
      balance = balance * 1.065 + annualSalaryContributions + extraAnnual;
    }
    return Math.round(balance);
  }

  const age60 = projectToAge(60);
  const age67 = projectToAge(67);

  return {
    currentBalance,
    annualSalaryContributions,
    extraAnnual,
    age60,
    age67,
    retirementGapAt67: Math.max(data.profile.retirement_target - age67, 0),
  };
}

export function getBullionLots(data: DemoData = demoData, metalType?: MetalType) {
  return data.bullionLots
    .filter((lot) => (metalType ? lot.metal_type === metalType : true))
    .map(calculateBullionLotValue)
    .sort((a, b) => b.unrealizedGainLoss - a.unrealizedGainLoss);
}

export function getBullionLotById(id: string, data: DemoData = demoData) {
  const lot = data.bullionLots.find((item) => item.id === id);
  return lot ? calculateBullionLotValue(lot) : undefined;
}

export function getMetalSpotPrice(metalType: MetalType) {
  const latestLot = demoData.bullionLots.find((lot) => lot.metal_type === metalType);
  return getFallbackQuoteFromStoredPrice({
    assetClass: 'metal',
    symbol: metalType === 'gold' ? 'XAU' : 'XAG',
    name: `${metalType} spot`,
    storedPrice: latestLot?.current_spot_price ?? 0,
    unit: metalType === 'gold' ? 'oz' : 'kg',
  });
}
