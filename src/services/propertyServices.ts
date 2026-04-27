import { demoData } from '@/data/seed';
import { DemoData, PropertyAnalysisInput, PropertyBill, PropertyHolding } from '@/types/models';

const WEEKS_PER_YEAR = 52;

export type PropertyProjectionPoint = {
  year: number;
  downsideValue: number;
  baseValue: number;
  upsideValue: number;
};

export type PropertyBusinessProjectionPoint = {
  year: number;
  propertyValue: number;
  equity: number;
  annualRent: number;
  annualBills: number;
  annualInterest: number;
  annualOperatingCosts: number;
  annualNetCashflow: number;
  cumulativeBills: number;
  cumulativeCashContributed: number;
  cumulativeNetCashflow: number;
  totalBusinessReturn: number;
};

export type PropertyBusinessProjection = {
  points: PropertyBusinessProjectionPoint[];
  breakEvenYear?: number;
  yearTen: PropertyBusinessProjectionPoint;
  totalBillsTenYear: number;
  cashContributedTenYear: number;
  totalReturnTenYear: number;
  verdict: string;
  signals: string[];
};

export function getPropertyBills(propertyId?: string, data: DemoData = demoData) {
  return data.propertyBills
    .filter((bill) => (propertyId ? bill.property_id === propertyId : true))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function getPropertyBillSummary(propertyId?: string, data: DemoData = demoData) {
  const bills = getPropertyBills(propertyId, data);
  const annualized = bills.reduce((total, bill) => total + annualizeBill(bill), 0);
  const upcoming = bills.filter((bill) => bill.status === 'upcoming');
  const overdue = bills.filter((bill) => bill.status === 'overdue');

  return {
    bills,
    annualized,
    monthlyAverage: annualized / 12,
    upcomingTotal: upcoming.reduce((total, bill) => total + bill.amount, 0),
    overdueTotal: overdue.reduce((total, bill) => total + bill.amount, 0),
    nextBill: upcoming[0],
  };
}

function annualizeBill(bill: PropertyBill) {
  const multiplier = bill.recurrence === 'monthly' ? 12 : bill.recurrence === 'quarterly' ? 4 : 1;
  return bill.amount * multiplier;
}

export function createPropertyProjection(property: PropertyHolding, data: DemoData = demoData): PropertyProjectionPoint[] {
  const assumptions = data.propertyProjections.find((projection) => projection.property_id === property.id);
  const years = assumptions?.projection_years ?? 10;
  const downside = assumptions?.downside_growth_rate ?? 0.02;
  const base = assumptions?.base_growth_rate ?? 0.045;
  const upside = assumptions?.upside_growth_rate ?? 0.07;

  return Array.from({ length: years + 1 }, (_, year) => ({
    year,
    downsideValue: Math.round(property.current_value * (1 + downside) ** year),
    baseValue: Math.round(property.current_value * (1 + base) ** year),
    upsideValue: Math.round(property.current_value * (1 + upside) ** year),
  }));
}

export function getPropertyDetail(propertyId: string, data: DemoData = demoData) {
  const property = data.propertyHoldings.find((holding) => holding.id === propertyId);
  if (!property) {
    return undefined;
  }
  const bills = getPropertyBillSummary(propertyId, data);
  const projection = createPropertyProjection(property, data);
  const researchProfile = data.propertyProjections.find((item) => item.property_id === propertyId);
  const annualRent = property.weekly_rent * WEEKS_PER_YEAR;
  const netOperatingIncome = annualRent - property.annual_expenses - bills.annualized;

  return {
    property,
    bills,
    projection,
    businessProjection: createPropertyBusinessProjection(propertyId, data),
    researchProfile,
    equity: property.current_value - property.loan_balance,
    debtRatio: property.current_value > 0 ? (property.loan_balance / property.current_value) * 100 : 0,
    annualRent,
    netOperatingIncome,
    grossYield: property.current_value > 0 ? (annualRent / property.current_value) * 100 : 0,
  };
}

export function createPropertyBusinessProjection(propertyId: string, data: DemoData = demoData): PropertyBusinessProjection {
  const property = data.propertyHoldings.find((holding) => holding.id === propertyId);
  if (!property) {
    const emptyPoint = {
      year: 0,
      propertyValue: 0,
      equity: 0,
      annualRent: 0,
      annualBills: 0,
      annualInterest: 0,
      annualOperatingCosts: 0,
      annualNetCashflow: 0,
      cumulativeBills: 0,
      cumulativeCashContributed: 0,
      cumulativeNetCashflow: 0,
      totalBusinessReturn: 0,
    };
    return {
      points: [emptyPoint],
      yearTen: emptyPoint,
      totalBillsTenYear: 0,
      cashContributedTenYear: 0,
      totalReturnTenYear: 0,
      verdict: 'No property data available.',
      signals: [],
    };
  }

  const billSummary = getPropertyBillSummary(propertyId, data);
  const projection = data.propertyProjections.find((item) => item.property_id === propertyId);
  const growthRate = projection?.base_growth_rate ?? 0.045;
  const rentGrowthRate = 0.03;
  const costInflationRate = 0.035;
  const interestRate = 0.062;
  const openingEquity = property.current_value - property.loan_balance;
  const points: PropertyBusinessProjectionPoint[] = [];
  let cumulativeBills = 0;
  let cumulativeCashContributed = 0;
  let cumulativeNetCashflow = 0;

  for (let year = 0; year <= 10; year += 1) {
    const propertyValue = Math.round(property.current_value * (1 + growthRate) ** year);
    const annualRent = property.weekly_rent * WEEKS_PER_YEAR * (1 + rentGrowthRate) ** year;
    const annualBills = (property.annual_expenses + billSummary.annualized) * (1 + costInflationRate) ** year;
    const annualInterest = property.loan_balance * interestRate;
    const annualOperatingCosts = annualBills + annualInterest;
    const annualNetCashflow = annualRent - annualOperatingCosts;

    if (year > 0) {
      cumulativeBills += annualBills;
      cumulativeNetCashflow += annualNetCashflow;
      cumulativeCashContributed += Math.max(-annualNetCashflow, 0);
    }

    const equity = propertyValue - property.loan_balance;
    points.push({
      year,
      propertyValue,
      equity,
      annualRent,
      annualBills,
      annualInterest,
      annualOperatingCosts,
      annualNetCashflow,
      cumulativeBills,
      cumulativeCashContributed,
      cumulativeNetCashflow,
      totalBusinessReturn: equity - openingEquity + cumulativeNetCashflow,
    });
  }

  const breakEvenYear = points.find((point) => point.year > 0 && point.totalBusinessReturn >= point.cumulativeCashContributed)?.year;
  const yearTen = points[10] ?? points[points.length - 1];
  const signals = getPropertyBusinessSignals(yearTen, breakEvenYear, property.current_value);

  return {
    points,
    breakEvenYear,
    yearTen,
    totalBillsTenYear: yearTen.cumulativeBills,
    cashContributedTenYear: yearTen.cumulativeCashContributed,
    totalReturnTenYear: yearTen.totalBusinessReturn,
    verdict:
      breakEvenYear && breakEvenYear <= 5
        ? 'Strong business case under the current assumptions.'
        : breakEvenYear
          ? 'Longer payback property; monitor cashflow and bill drag closely.'
          : 'Not breaking even within ten years under the current assumptions.',
    signals,
  };
}

function getPropertyBusinessSignals(yearTen: PropertyBusinessProjectionPoint, breakEvenYear: number | undefined, currentValue: number) {
  const billDrag = currentValue > 0 ? yearTen.cumulativeBills / currentValue : 0;
  const signals: string[] = [];

  if (breakEvenYear) {
    signals.push(`Projected break-even occurs in year ${breakEvenYear} when equity growth and net cashflow overtake cash fed into the property.`);
  } else {
    signals.push('The property does not reach business break-even within the ten-year model under current rent, bill and growth assumptions.');
  }

  if (yearTen.cumulativeCashContributed > 0) {
    signals.push(`The owner funds ${Math.round(yearTen.cumulativeCashContributed).toLocaleString('en-AU')} AUD of negative cashflow across the model.`);
  } else {
    signals.push('The property is not projected to require extra cash support across the ten-year model.');
  }

  if (billDrag > 0.2) {
    signals.push('Bills and operating costs are large enough to deserve active management, annual review and evidence storage.');
  } else {
    signals.push('Bill drag is controlled relative to the asset value, but it should still be tracked like a business expense ledger.');
  }

  signals.push('Use this as a property operating model; tax, depreciation, loan structure and sale decisions still need professional confirmation.');
  return signals;
}

export function analyseProperty(input: PropertyAnalysisInput) {
  const lowWeeklyRent = input.low_weekly_rent ?? input.weekly_rent;
  const highWeeklyRent = input.high_weekly_rent ?? input.weekly_rent;
  const annualRent = input.weekly_rent * WEEKS_PER_YEAR * (1 - input.vacancy_rate);
  const lowAnnualRent = lowWeeklyRent * WEEKS_PER_YEAR * (1 - input.vacancy_rate);
  const highAnnualRent = highWeeklyRent * WEEKS_PER_YEAR * (1 - input.vacancy_rate);
  const annualInterest = input.loan_amount * input.interest_rate;
  const managementFees = input.annual_management_fees || annualRent * input.management_fee_rate;
  const operatingExpenses =
    input.annual_rates +
    input.annual_water_rates +
    input.annual_insurance +
    input.annual_landlord_insurance +
    input.annual_body_corporate +
    input.annual_repairs +
    managementFees;
  const netCashflowBeforeTax = annualRent - annualInterest - operatingExpenses;
  const lowCashflowBeforeTax = lowAnnualRent - annualInterest - operatingExpenses;
  const highCashflowBeforeTax = highAnnualRent - annualInterest - operatingExpenses;
  const cashRequired = input.deposit + input.stamp_duty + input.legal_and_buying_costs + input.buffer;
  const grossYield = input.purchase_price > 0 ? (annualRent / input.purchase_price) * 100 : 0;
  const lowGrossYield = input.purchase_price > 0 ? (lowAnnualRent / input.purchase_price) * 100 : 0;
  const highGrossYield = input.purchase_price > 0 ? (highAnnualRent / input.purchase_price) * 100 : 0;
  const cashOnCashReturn = cashRequired > 0 ? (netCashflowBeforeTax / cashRequired) * 100 : 0;
  const projectedYearTenValue = Math.round(input.purchase_price * (1 + input.projected_growth_rate) ** 10);
  const totalEquityCreated = projectedYearTenValue - input.purchase_price + input.deposit;
  const yearTenLoanBalance = input.loan_amount;
  const yearTenEquityIfHeld = projectedYearTenValue - yearTenLoanBalance;
  const sellingCosts = projectedYearTenValue * 0.025;
  const netSaleProceedsYearTen = projectedYearTenValue - yearTenLoanBalance - sellingCosts;
  const tenYearCashflowBeforeTax = netCashflowBeforeTax * 10;
  const totalHoldReturnBeforeTax = yearTenEquityIfHeld + tenYearCashflowBeforeTax - cashRequired;
  const totalSellReturnBeforeTax = netSaleProceedsYearTen + tenYearCashflowBeforeTax - cashRequired;
  const riskAssessment = scorePropertyDeal({
    grossYield,
    netCashflowBeforeTax,
    operatingExpenses,
    annualRent,
    annualInterest,
    cashRequired,
    purchasePrice: input.purchase_price,
    vacancyRate: input.vacancy_rate,
    bodyCorporate: input.annual_body_corporate,
    projectedGrowthRate: input.projected_growth_rate,
  });
  const verdict =
    riskAssessment.buyScore >= 4
      ? 'Strong cashflow candidate'
      : riskAssessment.buyScore >= 3
        ? 'Watchlist candidate'
        : 'Needs stronger rent or lower debt cost';

  return {
    input,
    annualRent,
    lowAnnualRent,
    highAnnualRent,
    annualInterest,
    operatingExpenses,
    managementFees,
    netCashflowBeforeTax,
    lowCashflowBeforeTax,
    highCashflowBeforeTax,
    monthlyCashflowBeforeTax: netCashflowBeforeTax / 12,
    lowMonthlyCashflowBeforeTax: lowCashflowBeforeTax / 12,
    highMonthlyCashflowBeforeTax: highCashflowBeforeTax / 12,
    cashRequired,
    grossYield,
    lowGrossYield,
    highGrossYield,
    cashOnCashReturn,
    projectedYearTenValue,
    totalEquityCreated,
    yearTenLoanBalance,
    yearTenEquityIfHeld,
    sellingCosts,
    netSaleProceedsYearTen,
    tenYearCashflowBeforeTax,
    totalHoldReturnBeforeTax,
    totalSellReturnBeforeTax,
    buyScore: riskAssessment.buyScore,
    riskScore: riskAssessment.riskScore,
    recommendation: riskAssessment.recommendation,
    strengths: riskAssessment.strengths,
    risks: riskAssessment.risks,
    verdict,
  };
}

function scorePropertyDeal(input: {
  grossYield: number;
  netCashflowBeforeTax: number;
  operatingExpenses: number;
  annualRent: number;
  annualInterest: number;
  cashRequired: number;
  purchasePrice: number;
  vacancyRate: number;
  bodyCorporate: number;
  projectedGrowthRate: number;
}) {
  const strengths: string[] = [];
  const risks: string[] = [];
  let qualityPoints = 0;
  let riskPoints = 0;

  if (input.grossYield >= 6) {
    qualityPoints += 1.2;
    strengths.push('Gross yield is strong for a residential investment.');
  } else if (input.grossYield >= 5) {
    qualityPoints += 0.8;
    strengths.push('Gross yield is in a workable range.');
  } else {
    riskPoints += 1.2;
    risks.push('Gross yield is thin, so the deal relies more heavily on capital growth.');
  }

  if (input.netCashflowBeforeTax >= 0) {
    qualityPoints += 1.1;
    strengths.push('Before-tax cashflow is positive after estimated expenses.');
  } else if (input.netCashflowBeforeTax > -5000) {
    qualityPoints += 0.4;
    riskPoints += 0.8;
    risks.push('Cashflow is slightly negative before tax.');
  } else {
    riskPoints += 1.6;
    risks.push('Cashflow drag is material before tax.');
  }

  const expenseRatio = input.annualRent > 0 ? input.operatingExpenses / input.annualRent : 1;
  if (expenseRatio <= 0.3) {
    qualityPoints += 0.8;
    strengths.push('Operating expense ratio is controlled.');
  } else if (expenseRatio <= 0.45) {
    qualityPoints += 0.3;
    riskPoints += 0.5;
    risks.push('Operating costs take a noticeable share of rent.');
  } else {
    riskPoints += 1.2;
    risks.push('Operating costs are high relative to rent.');
  }

  const interestCoverage = input.annualInterest > 0 ? input.annualRent / input.annualInterest : 0;
  if (interestCoverage >= 1.25) {
    qualityPoints += 0.8;
    strengths.push('Rent covers interest with a useful buffer.');
  } else if (interestCoverage >= 1) {
    qualityPoints += 0.3;
    riskPoints += 0.7;
    risks.push('Rent only narrowly covers interest.');
  } else {
    riskPoints += 1.4;
    risks.push('Rent does not cover estimated interest.');
  }

  const cashRequiredRatio = input.purchasePrice > 0 ? input.cashRequired / input.purchasePrice : 1;
  if (cashRequiredRatio <= 0.25) {
    qualityPoints += 0.5;
    strengths.push('Cash required is efficient relative to purchase price.');
  } else {
    riskPoints += 0.5;
    risks.push('Cash required is high once stamp duty, legals and buffer are included.');
  }

  if (input.vacancyRate <= 0.03) {
    qualityPoints += 0.3;
  } else {
    riskPoints += 0.5;
    risks.push('Vacancy assumption is elevated and should be checked against local data.');
  }

  if (input.bodyCorporate > 0) {
    riskPoints += input.bodyCorporate > 4000 ? 0.8 : 0.4;
    risks.push('Body corporate fees add recurring cost and governance risk.');
  }

  if (input.projectedGrowthRate >= 0.05) {
    qualityPoints += 0.5;
    strengths.push('Growth assumption supports the long-term hold case.');
  } else if (input.projectedGrowthRate < 0.03) {
    riskPoints += 0.5;
    risks.push('Growth assumption is conservative, so the deal must stand up on cashflow.');
  }

  const buyScore = Math.min(5, Math.max(1, Math.round(1 + qualityPoints - riskPoints * 0.25)));
  const riskScore = Math.min(10, Math.max(1, Math.round(3 + riskPoints * 1.6 - qualityPoints * 0.35)));
  const recommendation =
    buyScore >= 4 && riskScore <= 5
      ? 'Good buy candidate: numbers are strong enough to justify deeper due diligence.'
      : buyScore >= 3 && riskScore <= 7
        ? 'Proceed carefully: workable deal, but validate rent, body corporate, rates and local demand.'
        : 'Do not rush: the risk/return profile needs improvement before this looks compelling.';

  return {
    buyScore,
    riskScore,
    recommendation,
    strengths: strengths.slice(0, 4),
    risks: risks.slice(0, 5),
  };
}

export function getDefaultPropertyAnalysis(data: DemoData = demoData) {
  return analyseProperty(data.propertyAnalysisInputs[0]);
}

export function createPropertyResearchBrief(suburb: string, state: string) {
  return {
    suburb,
    state,
    status: 'not_connected' as const,
    summary:
      'Research provider not connected yet. The intended report will combine historical suburb growth, vacancy trends, population movement, infrastructure pipeline, employment nodes and comparable rents.',
    rentalYieldComparison:
      'Provider-ready: compare proposed rent and gross yield against suburb median unit/house rent, vacancy rate and comparable listings.',
    growthHistory:
      'Provider-ready: ingest 1, 3, 5 and 10 year median price movements for the suburb and asset type.',
    projectPipeline:
      'Provider-ready: surface nearby transport, hospital, university, retail, employment and council development projects with cited sources.',
    populationMovement:
      'Provider-ready: use ABS and state data to show migration, household formation and rental demand pressure.',
    requiredSources: [
      'ABS population and migration data',
      'State infrastructure pipeline',
      'Council planning and development applications',
      'Suburb sales history and rental vacancy data',
      'Comparable rental listings',
    ],
  };
}
