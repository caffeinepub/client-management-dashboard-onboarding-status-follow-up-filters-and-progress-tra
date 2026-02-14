export function computeTotalPlanDays(months: number, additionalDays: number): number {
  const daysInMonth = 30;
  return months * daysInMonth + additionalDays;
}

export function computePlanEndDate(startDate: Date, months: number, additionalDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  endDate.setDate(endDate.getDate() + additionalDays);
  return endDate;
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
