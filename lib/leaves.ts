// Employee-side helpers for leave/balance. Pure functions (no IO).

export type LeaveType = 'ANNUAL' | 'SICK' | 'ALPHA';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequestRow {
  id: number;
  user_id: string;
  type: LeaveType;
  starts_on: string;
  ends_on: string;
  days_count: number;
  reason: string | null;
  status: LeaveStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
}

export interface HolidayRow {
  id: number;
  name: string;
  starts_on: string;
  ends_on: string;
  kind: 'NATIONAL' | 'COMPANY';
  recurring: boolean;
  notes: string | null;
}

export interface Balance {
  annual_total: number;
  annual_taken: number;
  annual_pending: number;
  annual_remaining: number;
  sick_total: number;
  sick_taken: number;
  sick_pending: number;
  sick_remaining: number;
  year: number;
}

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]; // ISO Mon-Fri

function enumerateDays(startsOn: string, endsOn: string): string[] {
  const out: string[] = [];
  const start = new Date(`${startsOn}T00:00:00Z`);
  const end = new Date(`${endsOn}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function isoDow(dateKey: string): number {
  const js = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return js === 0 ? 7 : js;
}

function isHolidayDate(dateKey: string, holidays: HolidayRow[]): boolean {
  return holidays.some((h) => dateKey >= h.starts_on && dateKey <= h.ends_on);
}

/** Count working days (Mon-Fri) excluding holidays in the inclusive range. */
export function countWorkdays(
  startsOn: string,
  endsOn: string,
  holidays: HolidayRow[],
  workingDows: number[] = DEFAULT_WORKING_DAYS,
): number {
  if (endsOn < startsOn) return 0;
  return enumerateDays(startsOn, endsOn).filter(
    (d) => workingDows.includes(isoDow(d)) && !isHolidayDate(d, holidays),
  ).length;
}

export function computeBalance(params: {
  defaults: { default_annual_days: number; default_sick_days: number };
  override: { annual_days: number | null; sick_days: number | null } | null;
  requests: LeaveRequestRow[];
  year?: number;
}): Balance {
  const year = params.year ?? new Date().getUTCFullYear();
  const annualTotal = params.override?.annual_days ?? params.defaults.default_annual_days;
  const sickTotal = params.override?.sick_days ?? params.defaults.default_sick_days;

  const sum = (type: 'ANNUAL' | 'SICK', statuses: LeaveStatus[]) =>
    params.requests
      .filter(
        (r) =>
          r.type === type &&
          statuses.includes(r.status) &&
          new Date(`${r.starts_on}T00:00:00Z`).getUTCFullYear() === year,
      )
      .reduce((acc, r) => acc + r.days_count, 0);

  const annualTaken = sum('ANNUAL', ['APPROVED']);
  const annualPending = sum('ANNUAL', ['PENDING']);
  const sickTaken = sum('SICK', ['APPROVED']);
  const sickPending = sum('SICK', ['PENDING']);

  return {
    annual_total: annualTotal,
    annual_taken: annualTaken,
    annual_pending: annualPending,
    annual_remaining: Math.max(0, annualTotal - annualTaken - annualPending),
    sick_total: sickTotal,
    sick_taken: sickTaken,
    sick_pending: sickPending,
    sick_remaining: Math.max(0, sickTotal - sickTaken - sickPending),
    year,
  };
}
