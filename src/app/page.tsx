"use client";

import PrayerTracker from "@/components/prayer/PrayerTracker";
import StatsDashboard from "@/components/prayer/StatsDashboard";
import MissedHistory from "@/components/prayer/MissedHistory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1549643276-fdf2fab574f5?q=80&w=1600&auto=format&fit=crop"
          alt="Mosque silhouette at sunset"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        {/* overlay for Islamic emerald vibe */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 via-background/60 to-background" />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:py-16">
          <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/60 border-emerald-200/60 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2">
                <img src="/icon.svg" alt="crescent" className="h-6 w-6 opacity-80" />
                <span>Salat Tracker • صلاة</span>
              </h1>
{/*               <p className="mt-2 text-sm sm:text-base text-muted-foreground">
               
              </p> */}
              <div className="mt-4 flex items-center gap-3">
                <Button asChild>
                  <a href="/" aria-label="Refresh app">Open Today</a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href="/" aria-label="Home">Refresh</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 pb-16 space-y-8 -mt-4 sm:-mt-6">
        <PrayerTracker />
        <StatsDashboard />
        <MissedHistory />
      </main>

      {/* Footer */}
{/*       <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-muted-foreground">
        <p>
          Made with intention. Install to Home Screen for the best experience (PWA).
        </p>
      </footer> */}
    </div>
  );    
}
