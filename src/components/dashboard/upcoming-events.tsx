"use client";

import Link from "next/link";
import { ArrowRight, Star, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Event, Club, EventRegistration } from "@/types";

interface UpcomingEventsProps {
  events: (Event & {
    club: Club | null;
    registrations: EventRegistration[];
    _count: { registrations: number };
  })[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Events
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href="/dashboard/clubs">
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => {
          const isRegistered = event.registrations.length > 0;
          const eventDate = new Date(event.startDate);

          return (
            <div
              key={event.id}
              className="flex gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer"
            >
              {/* Date box */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0 border border-primary/20">
                <span className="text-[10px] font-semibold text-primary uppercase leading-none">
                  {format(eventDate, "MMM")}
                </span>
                <span className="text-xl font-bold font-display text-primary leading-tight">
                  {format(eventDate, "d")}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                {event.club && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {event.club.name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {event.location && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="w-2.5 h-2.5" />
                      {event.location}
                    </span>
                  )}
                  {isRegistered && (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                      Registered
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}