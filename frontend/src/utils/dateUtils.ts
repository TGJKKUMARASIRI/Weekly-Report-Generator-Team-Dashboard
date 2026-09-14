export interface WeekOption {
  label: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  weekIdentifier: string; // e.g. "2026-W37"
}

// Format local YYYY-MM-DD without UTC timezone shifts
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Standard ISO-8601 week calculation
const getISOWeek = (date: Date): { year: number; week: number } => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
};

export const getWeekOptions = (weeksBack = 52, weeksAhead = 5): WeekOption[] => {
  const options: WeekOption[] = [];
  const now = new Date();

  // Find current week's Monday without mutating `now`
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const baseMonday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);

  for (let i = -weeksBack; i <= weeksAhead; i++) {
    const monday = new Date(baseMonday);
    monday.setDate(baseMonday.getDate() + i * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const { year, week } = getISOWeek(monday);
    const identifier = `${year}-W${String(week).padStart(2, '0')}`;

    const startFormatted = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let label = `${startFormatted} - ${endFormatted}`;
    if (i === 0) {
      label += ' (Current Week)';
    } else if (i > 0) {
      label += ' (Upcoming)';
    }

    options.push({
      label,
      weekStart: formatDate(monday),
      weekEnd: formatDate(sunday),
      weekIdentifier: identifier,
    });
  }

  return options.reverse(); // Newest weeks first
};