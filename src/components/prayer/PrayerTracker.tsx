"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  PRAYERS,
  PrayerKey,
  DayStatus,
  getTodayKey,
  getStatusForDate,
  setStatusForDate,
  togglePrayer,
  STORAGE_KEY,
  DEFAULT_PRAYER_TIMES,
  nextPrayerKey,
  saveMap,
  loadMap,
} from "@/lib/prayer";
import { Progress } from "@/components/ui/progress";

export default function PrayerTracker() {
  const todayKey = useMemo(() => getTodayKey(new Date()), []);
  const [status, setStatus] = useState<DayStatus>({ fajr: false, zuhr: false, asr: false, maghrib: false, isha: false });
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [remindersOn, setRemindersOn] = useState(false);
  const [nextKey, setNextKey] = useState<PrayerKey | null>(() => nextPrayerKey(new Date(), DEFAULT_PRAYER_TIMES));
  const timeoutsRef = useRef<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStatus(getStatusForDate(todayKey));
  }, [todayKey]);

  // Listen to storage updates from other actions
  useEffect(() => {
    const handler = () => setStatus(getStatusForDate(todayKey));
    window.addEventListener("prayer:updated", handler);
    return () => window.removeEventListener("prayer:updated", handler);
  }, [todayKey]);

  // Notification support check
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  // Update next prayer highlight every minute
  useEffect(() => {
    const tick = () => setNextKey(nextPrayerKey(new Date(), DEFAULT_PRAYER_TIMES));
    const id = window.setInterval(tick, 60_000);
    tick();
    return () => window.clearInterval(id);
  }, []);

  const clearScheduled = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  const scheduleReminders = () => {
    if (!("Notification" in window)) return;
    clearScheduled();

    const now = new Date();
    const base = new Date();
    const parts = DEFAULT_PRAYER_TIMES;

    const toDate = (hhmm: string) => {
      const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
      const d = new Date(base);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const map = loadMap();
    const today = getStatusForDate(todayKey, map);

    (Object.keys(parts) as PrayerKey[]).forEach((k) => {
      const when = toDate(parts[k]);
      if (when > now && !today[k]) {
        const delay = when.getTime() - now.getTime();
        const tid = window.setTimeout(() => {
          try {
            new Notification(`Time for ${k[0].toUpperCase()}${k.slice(1)}`, {
              body: "May your prayer be accepted.",
              silent: false,
            });
          } catch {}
        }, delay);
        timeoutsRef.current.push(tid);
      }
    });
  };

  const enableReminders = async () => {
    if (!("Notification" in window)) return;
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
    }
    setPermission(perm);
    const on = perm === "granted";
    setRemindersOn(on);
    if (on) scheduleReminders();
  };

  const disableReminders = () => {
    clearScheduled();
    setRemindersOn(false);
  };

  const exportData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? "{}";
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salat-tracker-${todayKey}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (obj && typeof obj === "object") {
        saveMap(obj);
        setStatus(getStatusForDate(todayKey));
      }
    } catch {}
  };

  const completed = Object.values(status).filter(Boolean).length;
  const pct = Math.round((completed / 5) * 100);

  const onToggle = (p: PrayerKey) => {
    const next = togglePrayer(todayKey, p);
    setStatus(next);
    if (remindersOn) scheduleReminders(); // reschedule to skip completed
  };

  const resetToday = () => {
    const empty = { fajr: false, zuhr: false, asr: false, maghrib: false, isha: false };
    setStatusForDate(todayKey, empty);
    setStatus(empty);
    if (remindersOn) scheduleReminders();
  };

  return (
    <Card className="w-full max-w-md mx-auto border-emerald-200/50 shadow-sm bg-gradient-to-b from-emerald-50/50 to-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <span className="font-semibold tracking-tight">Today's Prayers • صلاة</span>
          <span className="text-xs text-muted-foreground">{todayKey}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Mark each Salah as you complete it. May Allah accept.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {permission === "unsupported" ? (
            <Button variant="secondary" disabled className="h-8">Notifications unsupported</Button>
          ) : remindersOn ? (
            <Button variant="destructive" className="h-8" onClick={disableReminders}>Disable Reminders</Button>
          ) : (
            <Button className="h-8" onClick={enableReminders}>
              {permission === "granted" ? "Enable Reminders" : "Allow Notifications"}
            </Button>
          )}
          <Button variant="secondary" className="h-8" onClick={exportData}>Export</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importData(e.target.files?.[0])}
          />
          <Button variant="secondary" className="h-8" onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {PRAYERS.map(({ key, label }) => {
            const isNext = nextKey === key && !status[key];
            return (
              <label
                key={key}
                className={
                  "flex items-center justify-between rounded-lg border p-3 transition-colors " +
                  (isNext ? " border-emerald-500 bg-emerald-50/80" : "")
                }
              >
                <div className="flex items-center gap-3">
                  <Checkbox id={key} checked={!!status[key]} onCheckedChange={() => onToggle(key)} />
                  <span className="text-base font-medium">{label}</span>
                </div>
                <span className={"text-sm " + (isNext ? "text-emerald-700" : "text-muted-foreground")}>{status[key] ? "Done" : isNext ? "Next" : "Mark"}</span>
              </label>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {completed}/5 ({pct}%)
            </span>
          </div>
          <Progress value={pct} />
        </div>
        <Button variant="secondary" className="w-full" onClick={resetToday}>
          Reset Today
        </Button>
      </CardContent>
    </Card>
  );
}