export const DUE_DATE_DAYS: Record<string, number> = {
  urgent: 7,
  high: 14,
  medium: 30,
  low: 90,
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  접수: ['검토중', '드랍'],
  검토중: ['처리중', '드랍'],
  처리중: ['완료', '드랍'],
  완료: ['처리중'],
  드랍: ['검토중', '처리중'],
};

export function calcDueDate(priority: string): string {
  const days = DUE_DATE_DAYS[priority] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  // UTC 'Z' format — avoids local-timezone offset strings that confuse pg-mem
  return d.toISOString();
}
