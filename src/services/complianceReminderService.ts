import { demoData } from '@/data/seed';

export type ComplianceAlert = {
  id: string;
  title: string;
  dueDate: string;
  daysUntilDue: number;
  severity: 'info' | 'warning' | 'urgent';
  reminderMessage: string;
};

function daysBetween(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

export function getSMSFComplianceAlerts(todayIso = '2026-04-19'): ComplianceAlert[] {
  return demoData.smsfComplianceChecklist
    .filter((item) => !item.completed)
    .map((item) => {
      const daysUntilDue = daysBetween(todayIso, item.due_date);
      const severity: ComplianceAlert['severity'] = daysUntilDue <= 30 ? 'urgent' : daysUntilDue <= 90 ? 'warning' : 'info';
      return {
        id: item.id,
        title: item.title,
        dueDate: item.due_date,
        daysUntilDue,
        severity,
        reminderMessage:
          severity === 'urgent'
            ? 'SMSF tax and audit preparation needs attention now.'
            : severity === 'warning'
              ? 'Start gathering SMSF tax and audit evidence.'
              : 'Upcoming SMSF compliance task is being tracked.',
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
