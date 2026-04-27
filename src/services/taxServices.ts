import { demoData } from '@/data/seed';
import { getSMSFSummary } from './calculations';

export function estimatePAYGTax(annualIncome = demoData.profile.annual_income, deductions = 12500) {
  const taxableIncome = Math.max(annualIncome - deductions, 0);
  const incomeTax =
    taxableIncome <= 18200
      ? 0
      : taxableIncome <= 45000
        ? (taxableIncome - 18200) * 0.16
        : taxableIncome <= 135000
          ? 4288 + (taxableIncome - 45000) * 0.3
          : taxableIncome <= 190000
            ? 31288 + (taxableIncome - 135000) * 0.37
            : 51638 + (taxableIncome - 190000) * 0.45;
  const medicare = taxableIncome * 0.02;

  return {
    annualIncome,
    deductions,
    taxableIncome,
    incomeTax,
    medicare,
    estimatedTotalTax: incomeTax + medicare,
    disclaimer: 'Estimate only. Australian tax rules change and personal advice should come from a registered tax agent.',
  };
}

export function estimateSMSFTax() {
  const smsf = getSMSFSummary();
  const concessionalContributions = demoData.transactions
    .filter((transaction) => transaction.transaction_type === 'contribution')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const taxableRentalIncome = Math.max(smsf.monthlyRent * 12 - smsf.monthlyExpenses * 12, 0);
  const taxableIncome = taxableRentalIncome + concessionalContributions;
  const estimatedTax = taxableIncome * 0.15;

  return {
    taxableRentalIncome,
    concessionalContributions,
    taxableIncome,
    estimatedTax,
    disclaimer: 'SMSF tax estimate is simplified and must be reviewed by the fund accountant/auditor.',
  };
}

export function getTaxTrackerSummary() {
  const payg = estimatePAYGTax();
  const smsf = estimateSMSFTax();
  const incompleteChecklist = demoData.smsfComplianceChecklist.filter((item) => !item.completed);
  const highPriority = incompleteChecklist.filter((item) => item.priority === 'high');

  return {
    payg,
    smsf,
    trackerItems: demoData.taxTrackerItems,
    smsfChecklist: demoData.smsfComplianceChecklist,
    incompleteChecklist,
    highPriority,
    nextDue: [...demoData.taxTrackerItems, ...incompleteChecklist].sort((a, b) => a.due_date.localeCompare(b.due_date))[0],
  };
}
