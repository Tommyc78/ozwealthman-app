import { demoData } from '@/data/seed';
import { AreaIntelligenceReport, DemoData, PropertyAnalysisInput } from '@/types/models';

export type AreaIntelligenceResult = {
  report: AreaIntelligenceReport;
  verdict: string;
  aiSummary: string;
  confidenceLabel: string;
  scoreSignals: string[];
};

const fallbackReport = (suburb: string, state: string): AreaIntelligenceReport => ({
  id: `area-${suburb.toLowerCase()}-${state.toLowerCase()}-fallback`,
  suburb,
  state,
  property_type: 'mixed',
  status: 'provider_ready',
  generated_at: new Date().toISOString(),
  confidence_score: 0,
  overall_score: 0,
  yield_score: 0,
  growth_score: 0,
  demand_score: 0,
  supply_risk_score: 0,
  infrastructure_score: 0,
  rental_yield_percent: 0,
  vacancy_rate_percent: 0,
  median_weekly_rent: 0,
  annual_growth_1y: 0,
  annual_growth_3y: 0,
  annual_growth_5y: 0,
  annual_growth_10y: 0,
  population_growth_percent: 0,
  household_growth_percent: 0,
  days_on_market: 0,
  comparable_yield_range: { low: 0, high: 0 },
  summary: 'Provider not connected yet. This slot is ready to hold structured area intelligence once research sources are wired in.',
  strengths: [],
  risks: [],
  projects: [],
  citations: [],
});

export function getAreaIntelligenceReport(suburb: string, state: string, data: DemoData = demoData) {
  return (
    data.areaIntelligenceReports.find(
      (report) => report.suburb.toLowerCase() === suburb.toLowerCase() && report.state.toLowerCase() === state.toLowerCase(),
    ) ?? fallbackReport(suburb, state)
  );
}

export function buildAreaIntelligenceResult(input: Pick<PropertyAnalysisInput, 'suburb' | 'state' | 'property_type' | 'weekly_rent'>, data: DemoData = demoData): AreaIntelligenceResult {
  const report = getAreaIntelligenceReport(input.suburb, input.state, data);
  const confidenceLabel =
    report.confidence_score >= 80 ? 'High confidence' : report.confidence_score >= 60 ? 'Moderate confidence' : 'Provider pending';

  const yieldGap = input.weekly_rent > 0 ? ((input.weekly_rent - report.median_weekly_rent) / Math.max(report.median_weekly_rent, 1)) * 100 : 0;
  const verdict =
    report.overall_score >= 75
      ? 'Supportive area backdrop'
      : report.overall_score >= 60
        ? 'Workable, but needs sharper deal discipline'
        : 'Weak area support until stronger evidence arrives';

  const scoreSignals = [
    `Yield score ${report.yield_score}/100`,
    `Growth score ${report.growth_score}/100`,
    `Demand score ${report.demand_score}/100`,
    `Supply risk ${report.supply_risk_score}/100`,
    `Infrastructure score ${report.infrastructure_score}/100`,
  ];

  const rentComparison =
    report.median_weekly_rent > 0
      ? yieldGap >= 5
        ? 'Proposed rent sits above the current suburb median, which is positive if the condition and layout support it.'
        : yieldGap <= -5
          ? 'Proposed rent sits below the suburb median, which may hint at weaker stock quality or a conservative assumption.'
          : 'Proposed rent is broadly in line with the suburb median, which makes the underwriting feel grounded.'
      : 'Rental comparison will strengthen once a live suburb rent feed is connected.';

  const aiSummary = `${report.summary} ${rentComparison} ${
    report.vacancy_rate_percent > 0
      ? `Vacancy is modelled at ${report.vacancy_rate_percent.toFixed(1)}%, which ${report.vacancy_rate_percent <= 2.5 ? 'supports' : 'softens'} the tenant-demand case.`
      : 'Vacancy data is waiting on a live provider.'
  } ${
    report.projects.length > 0
      ? `Nearby project watch: ${report.projects
          .map((project) => project.title)
          .slice(0, 2)
          .join(' and ')}.`
      : 'Project pipeline is ready to be populated once the research provider is connected.'
  }`;

  return {
    report,
    verdict,
    aiSummary,
    confidenceLabel,
    scoreSignals,
  };
}
