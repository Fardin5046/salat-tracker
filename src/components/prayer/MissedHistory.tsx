"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentMonthRange, computeMissedHistory, PRAYERS } from "@/lib/prayer";

const LABEL: Record<string, string> = Object.fromEntries(PRAYERS.map(p => [p.key, p.label]));

export default function MissedHistory() {
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const onUpdated = () => setBump((k) => k + 1);
    window.addEventListener("prayer:updated", onUpdated);
    window.addEventListener("storage", onUpdated);
    return () => {
      window.removeEventListener("prayer:updated", onUpdated);
      window.removeEventListener("storage", onUpdated);
    };
  }, []);

  const entries = useMemo(() => {
    // show last 30 days based on current month + previous days
    const days = currentMonthRange();
    return computeMissedHistory(days).slice(-150); // up to 30 days * 5 prayers
  }, [bump]);

  const byPrayer = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const e of entries) {
      if (!map[e.prayer]) map[e.prayer] = [];
      map[e.prayer].push(e.date);
    }
    return map;
  }, [entries]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Missed History (This Month)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.keys(byPrayer).length === 0 ? (
          <p className="text-sm text-muted-foreground">No missed prayers this month. Ma sha Allah!</p>
        ) : (
          Object.entries(byPrayer).map(([prayer, dates]) => (
            <div key={prayer} className="rounded-lg border p-3">
              <div className="font-medium mb-1">{LABEL[prayer] || prayer}</div>
              <p className="text-sm text-muted-foreground">Missed on: {dates.join(", ")}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}