export interface WeekOption {
  label: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  weekIdentifier: string; // e.g. "2026-W37"
}

export const getWeekOptions = (weeksBack = 4, weeksAhead = 1): WeekOption[] => {
  const options: WeekOption[] = [];
  const now = new Date();
  
  // Find current week's Monday
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(now.setDate(diffToMonday));

  for (let i = -weeksBack; i <= weeksAhead; i++) {
    const monday = new Date(currentMonday);
    monday.setDate(currentMonday.getDate() + (i * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = monday.toISOString().split('T')[0];
    const endStr = sunday.toISOString().split('T')[0];

    // Simple ISO week calculation for identifier
    const jan1 = new Date(monday.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((monday.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7);
    const identifier = `${monday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

    let label = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    if (i === 0) label += ' (Current Week)';

    options.push({ label, weekStart: startStr, weekEnd: endStr, weekIdentifier: identifier });
  }

  return options.reverse(); // Newest weeks first
};