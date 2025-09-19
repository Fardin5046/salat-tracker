"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentWeekRange, currentMonthRange, computeStats, PRAYERS } from "@/lib/prayer";
import { Progress } from "@/components/ui/progress";

export default function StatsDashboard() {
  const [view, setView] = useState<"week" | "month">("week");
  const [key, setKey] = useState(0);

  // force refresh when storage changes (best-effort: listen to storage)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "prayer-tracker:v1") setKey((k) => k + 1);
    };
    const onUpdated = () => setKey((k) => k + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("prayer:updated", onUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("prayer:updated", onUpdated);
    };
  }, []);

  const stats = useMemo(() => {
    const range = view === "week" ? currentWeekRange() : currentMonthRange();
    return computeStats(range);
  }, [view, key]);

  const pct = Math.round((stats.totalCompleted / stats.totalSlots) * 100);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Statistics</CardTitle>
        <div className="inline-flex items-center gap-2">
          <button className={`px-3 py-1.5 rounded-md border ${view === "week" ? "bg-primary text-primary-foreground" : "bg-secondary"}`} onClick={() => setView("week")}>
            This Week
          </button>
          <button className={`px-3 py-1.5 rounded-md border ${view === "month" ? "bg-primary text-primary-foreground" : "bg-secondary"}`} onClick={() => setView("month")}>
            This Month
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Completion</span>
            <span>{stats.totalCompleted}/{stats.totalSlots} ({pct}%)</span>
          </div>
          <Progress value={pct} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRAYERS.map((p) => {
            const total = stats.byPrayer[p.key].completed + stats.byPrayer[p.key].missed;
            const pp = total ? Math.round((stats.byPrayer[p.key].completed / total) * 100) : 0;
            return (
              <div key={p.key} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{p.label}</span>
                  <Badge variant="secondary">{pp}%</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Completed: {stats.byPrayer[p.key].completed} • Missed: {stats.byPrayer[p.key].missed}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}