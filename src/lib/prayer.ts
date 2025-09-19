export type PrayerKey = "fajr" | "zuhr" | "asr" | "maghrib" | "isha";

export const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: "fajr", label: "Fajr" },
  { key: "zuhr", label: "Zuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

export type DayStatus = Record<PrayerKey, boolean>;
export type PrayerMap = Record<string, DayStatus>; // key: YYYY-MM-DD

export const STORAGE_KEY = "prayer-tracker:v1";

export function getTodayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyDay(): DayStatus {
  return { fajr: false, zuhr: false, asr: false, maghrib: false, isha: false };
}

export function loadMap(): PrayerMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PrayerMap) : {};
  } catch {
    return {};
  }
}

export function saveMap(map: PrayerMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  // notify current tab listeners to refresh derived views
  try {
    window.dispatchEvent(new Event("prayer:updated"));
  } catch {}
}

export function getStatusForDate(dateKey: string, map?: PrayerMap): DayStatus {
  const m = map ?? loadMap();
  return { ...emptyDay(), ...(m[dateKey] ?? {}) };
}

export function setStatusForDate(dateKey: string, status: DayStatus) {
  const m = loadMap();
  m[dateKey] = status;
  saveMap(m);
}

export function togglePrayer(dateKey: string, prayer: PrayerKey): DayStatus {
  const m = loadMap();
  const prev = getStatusForDate(dateKey, m);
  const next = { ...prev, [prayer]: !prev[prayer] } as DayStatus;
  m[dateKey] = next;
  saveMap(m);
  return next;
}

export function getWeekStart(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // make Monday=0
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function dateKey(d: Date): string {
  return getTodayKey(d);
}

export function rangeDays(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(dateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function currentWeekRange(base = new Date()): string[] {
  const start = getWeekStart(base);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return rangeDays(start, end);
}

export function currentMonthRange(base = new Date()): string[] {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return rangeDays(start, end);
}

export type Stats = {
  totalCompleted: number;
  totalMissed: number;
  byPrayer: Record<PrayerKey, { completed: number; missed: number }>;
  totalSlots: number;
};

export function computeStats(dateKeys: string[], map?: PrayerMap): Stats {
  const m = map ?? loadMap();
  const byPrayer: Stats["byPrayer"] = {
    fajr: { completed: 0, missed: 0 },
    zuhr: { completed: 0, missed: 0 },
    asr: { completed: 0, missed: 0 },
    maghrib: { completed: 0, missed: 0 },
    isha: { completed: 0, missed: 0 },
  };
  let totalCompleted = 0;
  let totalMissed = 0;

  for (const key of dateKeys) {
    const status = getStatusForDate(key, m);
    for (const p of PRAYERS) {
      if (status[p.key]) {
        byPrayer[p.key].completed++;
        totalCompleted++;
      } else {
        byPrayer[p.key].missed++;
        totalMissed++;
      }
    }
  }

  return {
    totalCompleted,
    totalMissed,
    byPrayer,
    totalSlots: dateKeys.length * PRAYERS.length,
  };
}

export type MissedEntry = { date: string; prayer: PrayerKey };

export function computeMissedHistory(dateKeys: string[], map?: PrayerMap): MissedEntry[] {
  const m = map ?? loadMap();
  const out: MissedEntry[] = [];
  for (const key of dateKeys) {
    const status = getStatusForDate(key, m);
    for (const p of PRAYERS) {
      if (!status[p.key]) out.push({ date: key, prayer: p.key });
    }
  }
  return out;
}

// --- Prayer times & next prayer helper ---
export type PrayerTimes = Record<PrayerKey, string>; // "HH:MM" in local time

export const DEFAULT_PRAYER_TIMES: PrayerTimes = {
  fajr: "05:00",
  zuhr: "13:00",
  asr: "16:30",
  maghrib: "18:30",
  isha: "20:00",
};

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

export function nextPrayerKey(now = new Date(), times: PrayerTimes = DEFAULT_PRAYER_TIMES): PrayerKey | null {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const order: PrayerKey[] = ["fajr", "zuhr", "asr", "maghrib", "isha"];
  for (const k of order) {
    if (minutesNow < timeToMinutes(times[k])) return k;
  }
  return null; // day complete
}