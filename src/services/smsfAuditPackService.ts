export type SMSFAuditPackSection = {
  id: string;
  title: string;
  description: string;
  critical: boolean;
  examples: string[];
};

export type SMSFAuditPackUpload = {
  sectionId: string;
  files: Array<{ name: string; sizeKb?: number; uploadedAt: string }>;
};

export type SMSFAuditPackReadiness = {
  readinessPercent: number;
  auditorReadyPercent: number;
  accountantReadyPercent: number;
  criticalMissing: SMSFAuditPackSection[];
  recommendedNextSteps: string[];
  packOutputs: string[];
};

export const SMSF_AUDIT_PACK_SECTIONS: SMSFAuditPackSection[] = [
  {
    id: 'banking',
    title: 'Bank statements',
    description: 'All SMSF bank accounts, CMA accounts, offset accounts and transaction evidence for the full year.',
    critical: true,
    examples: ['SMSF cash account statements', 'Offset account statements', 'Interest summaries'],
  },
  {
    id: 'contributions',
    title: 'Contributions',
    description: 'Employer, personal, concessional and non-concessional contribution evidence and cap support.',
    critical: true,
    examples: ['Contribution receipts', 'Salary sacrifice records', 'Notices of intent'],
  },
  {
    id: 'properties',
    title: 'Property records',
    description: 'Rental statements, lease agreements, PM summaries and property-level evidence for each SMSF property.',
    critical: true,
    examples: ['Rental statements', 'Lease agreements', 'Property manager summary'],
  },
  {
    id: 'crypto',
    title: 'Crypto',
    description: 'Exchange exports, wallet screenshots, transaction logs and EOFY valuation support.',
    critical: true,
    examples: ['Swyftx CSV', 'Wallet screenshots', 'Transaction exports'],
  },
  {
    id: 'etfs',
    title: 'ETFs and shares',
    description: 'Broker statements, dividend statements, holdings reports and CGT schedules.',
    critical: true,
    examples: ['Broker holdings report', 'Dividend statements', 'Trade confirmations'],
  },
  {
    id: 'insurance',
    title: 'Insurance',
    description: 'Policy schedules, premium evidence and cover summaries for fund-owned insurance.',
    critical: false,
    examples: ['TPD policy', 'Income protection schedule', 'Premium statement'],
  },
  {
    id: 'loan',
    title: 'Loan statements',
    description: 'LRBA statements, loan agreement, repayment schedules and bare trust documents.',
    critical: true,
    examples: ['Annual loan statement', 'Loan agreement', 'Bare trust deed'],
  },
  {
    id: 'rates_water',
    title: 'Rates and water',
    description: 'Council rates, water notices and payment evidence for SMSF property.',
    critical: false,
    examples: ['Council rates notice', 'Water bill', 'Payment receipt'],
  },
  {
    id: 'body_corporate',
    title: 'Body corporate',
    description: 'Levy notices, AGM docs and special levy evidence where applicable.',
    critical: false,
    examples: ['Levy notice', 'Strata statement', 'Special levy notice'],
  },
  {
    id: 'minutes',
    title: 'Minutes and resolutions',
    description: 'Trustee resolutions, investment strategy reviews, representations and annual sign-off minutes.',
    critical: true,
    examples: ['Investment strategy review', 'Trustee minute', 'Representation letter'],
  },
  {
    id: 'valuations',
    title: 'Valuations',
    description: 'EOFY market value evidence for property, crypto, bullion and unlisted assets.',
    critical: true,
    examples: ['CoreLogic printout', 'Bullion spot valuation', '30 June crypto valuation'],
  },
  {
    id: 'tax_audit',
    title: 'Tax and audit',
    description: 'Prior-year pack, auditor queries, accountant workpapers and final review notes.',
    critical: false,
    examples: ['Prior-year annual pack', 'Auditor request list', 'Accountant checklist'],
  },
];

export function buildSMSFAuditPackReadiness(uploads: SMSFAuditPackUpload[]): SMSFAuditPackReadiness {
  const uploadMap = new Map(uploads.map((upload) => [upload.sectionId, upload.files.length]));
  const completed = SMSF_AUDIT_PACK_SECTIONS.filter((section) => (uploadMap.get(section.id) ?? 0) > 0);
  const criticalSections = SMSF_AUDIT_PACK_SECTIONS.filter((section) => section.critical);
  const criticalCompleted = criticalSections.filter((section) => (uploadMap.get(section.id) ?? 0) > 0);
  const criticalMissing = criticalSections.filter((section) => (uploadMap.get(section.id) ?? 0) === 0);

  const readinessPercent = Math.round((completed.length / SMSF_AUDIT_PACK_SECTIONS.length) * 100);
  const auditorReadyPercent = Math.round((criticalCompleted.length / criticalSections.length) * 100);
  const accountantReadyPercent = Math.round(
    ((completed.filter((section) => section.id !== 'tax_audit').length + criticalCompleted.length) /
      (SMSF_AUDIT_PACK_SECTIONS.length - 1 + criticalSections.length)) *
      100,
  );

  const recommendedNextSteps: string[] = [];
  if (criticalMissing.some((section) => section.id === 'crypto')) {
    recommendedNextSteps.push('Upload wallet screenshots, exchange exports and EOFY crypto valuation evidence before the auditor asks for them.');
  }
  if (criticalMissing.some((section) => section.id === 'loan')) {
    recommendedNextSteps.push('Add LRBA statements, bare trust evidence and repayment schedules so the property loan trail is complete.');
  }
  if (criticalMissing.some((section) => section.id === 'minutes')) {
    recommendedNextSteps.push('Prepare trustee minutes, annual investment strategy review and representations before calling the pack audit-ready.');
  }
  if (criticalMissing.length === 0) {
    recommendedNextSteps.push('Critical evidence is present. Next step is to generate the accountant pack, then answer any auditor follow-up requests.');
  }

  const packOutputs = [
    'Accountant working-paper pack: statements, transactions, contribution support, holdings and valuations.',
    'Auditor evidence pack: ownership proof, trustee minutes, LRBA docs, valuations and compliance evidence.',
    'Ready-to-sign annual pack: final financials, member statements, tax return approval and lodgment declaration after accountant and auditor complete their work.',
  ];

  return {
    readinessPercent,
    auditorReadyPercent,
    accountantReadyPercent,
    criticalMissing,
    recommendedNextSteps,
    packOutputs,
  };
}
