"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Users, Calendar, MapPin, Video, Plus, Search, Loader2, Crown,
  Building2, Image as ImageIcon, Ticket, Clock, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDateTime, truncate } from "@/lib/utils";
import type { ClubWithMembers, EventWithDetails } from "@/types";

interface ClubsClientProps {
  initialClubs: ClubWithMembers[];
  initialEvents: EventWithDetails[];
  userId: string;
}

export function ClubsClient({ initialClubs, initialEvents, userId }: ClubsClientProps) {
  const [clubs, setClubs] = useState<ClubWithMembers[]>(initialClubs);
  const [events, setEvents] = useState<EventWithDetails[]>(initialEvents);

  const [clubSearch, setClubSearch] = useState("");
  const [clubCategory, setClubCategory] = useState("all");
  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past">("upcoming");

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const [createClubOpen, setCreateClubOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubCategoryInput, setClubCategoryInput] = useState("");
  const [clubLogo, setClubLogo] = useState("");
  const [isCreatingClub, setIsCreatingClub] = useState(false);

  const clubCategories = useMemo(() => {
    const set = new Set(clubs.map((c) => c.category).filter(Boolean) as string[]);
    return Array.from(set);
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const matchesSearch =
        !clubSearch.trim() ||
        c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(clubSearch.toLowerCase());
      const matchesCategory = clubCategory === "all" || c.category === clubCategory;
      return matchesSearch && matchesCategory;
    });
  }, [clubs, clubSearch, clubCategory]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        const isPast = new Date(e.startDate) < now;
        const matchesFilter = eventFilter === "upcoming" ? !isPast : isPast;
        const matchesSearch =
          !eventSearch.trim() ||
          e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
          e.description?.toLowerCase().includes(eventSearch.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) =>
        eventFilter === "upcoming"
          ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
  }, [events, eventSearch, eventFilter]);

  function isMember(club: ClubWithMembers) {
    return club.members.some((m) => m.userId === userId);
  }

  async function handleJoinClub(club: ClubWithMembers) {
    setJoiningId(club.id);
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to join club");
      }
      const { data: member } = await res.json();
      setClubs((prev) =>
        prev.map((c) =>
          c.id === club.id
            ? { ...c, members: [...c.members, member], _count: { ...c._count, members: c._count.members + 1 } }
            : c
        )
      );
      toast.success(`Joined ${club.name}!`);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setJoiningId(null);
    }
  }

  async function handleLeaveClub(club: ClubWithMembers) {
    setJoiningId(club.id);
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to leave club");
      }
      setClubs((prev) =>
        prev.map((c) =>
          c.id === club.id
            ? {
                ...c,
                members: c.members.filter((m) => m.userId !== userId),
                _count: { ...c._count, members: Math.max(0, c._count.members - 1) },
              }
            : c
        )
      );
      toast.success(`Left ${club.name}`);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setJoiningId(null);
    }
  }

  async function handleCreateClub() {
    if (!clubName.trim()) {
      toast.error("Club name is required.");
      return;
    }
    setIsCreatingClub(true);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName.trim(),
          description: clubDescription.trim() || undefined,
          category: clubCategoryInput.trim() || undefined,
          logo: clubLogo.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create club");
      }
      const { data: newClub } = await res.json();
      setClubs((prev) => [...prev, newClub]);
      toast.success("Club created!");
      setCreateClubOpen(false);
      setClubName("");
      setClubDescription("");
      setClubCategoryInput("");
      setClubLogo("");
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsCreatingClub(false);
    }
  }

  function getRegistration(event: EventWithDetails) {
    return event.registrations.find((r) => r.userId === userId && r.status !== "CANCELLED");
  }

  async function handleRegister(event: EventWithDetails) {
    setRegisteringId(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to register");
      }
      const { data: registration } = await res.json();
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                registrations: [...e.registrations, registration],
                // _count: { ...e._count, registrations: e._count.registrations + 1 },
              }
            : e
        )
      );
      toast.success(
        registration.status === "WAITLISTED"
          ? "Event is full — you've been waitlisted."
          : "You're registered!"
      );
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setRegisteringId(null);
    }
  }

  async function handleCancelRegistration(event: EventWithDetails) {
    setRegisteringId(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to cancel registration");
      }
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                registrations: e.registrations.filter((r) => r.userId !== userId),
                // _count: { ...e._count, registrations: Math.max(0, e._count.registrations - 1) },
              }
            : e
        )
      );
      toast.success("Registration cancelled");
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setRegisteringId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Clubs & Events</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Join clubs, discover events, and get involved on campus.
        </p>
      </div>

      <Tabs defaultValue="clubs">
        <TabsList>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* ── Clubs tab ───────────────────────────────────────────── */}
        <TabsContent value="clubs" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search clubs..."
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
              />
            </div>
            <Select value={clubCategory} onValueChange={setClubCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {clubCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateClubOpen(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              New Club
            </Button>
          </div>

          {filteredClubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-medium">No clubs found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  userId={userId}
                  isMember={isMember(club)}
                  isLoading={joiningId === club.id}
                  onJoin={() => handleJoinClub(club)}
                  onLeave={() => handleLeaveClub(club)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Events tab ──────────────────────────────────────────── */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search events..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
              />
            </div>
            <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as "upcoming" | "past")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-medium">No events found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {eventFilter === "upcoming" ? "Check back soon for new events." : "No past events to show."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  registration={getRegistration(event)}
                  isPast={eventFilter === "past"}
                  isLoading={registeringId === event.id}
                  onRegister={() => handleRegister(event)}
                  onCancel={() => handleCancelRegistration(event)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Club Dialog */}
      <Dialog open={createClubOpen} onOpenChange={setCreateClubOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Club</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Robotics Club" value={clubName} onChange={(e) => setClubName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What's this club about?"
                rows={3}
                value={clubDescription}
                onChange={(e) => setClubDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Tech, Sports"
                  value={clubCategoryInput}
                  onChange={(e) => setClubCategoryInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="https://..."
                    value={clubLogo}
                    onChange={(e) => setClubLogo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateClubOpen(false)} disabled={isCreatingClub}>
              Cancel
            </Button>
            <Button onClick={handleCreateClub} disabled={isCreatingClub} className="gap-2">
              {isCreatingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Club card ────────────────────────────────────────────────────────────
function ClubCard({
  club, userId, isMember, isLoading, onJoin, onLeave,
}: {
  club: ClubWithMembers;
  userId: string;
  isMember: boolean;
  isLoading: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const role = club.members.find((m) => m.userId === userId)?.role;

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative">
        {club.banner && (
          <img src={club.banner} alt="" className="w-full h-full object-cover" />
        )}
        <Avatar className="w-12 h-12 absolute -bottom-6 left-4 border-4 border-background">
          <AvatarImage src={club.logo ?? undefined} />
          <AvatarFallback>
            <Building2 className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      </div>
      <CardContent className="pt-8 pb-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{club.name}</h3>
          {role === "ADMIN" && (
            <Crown className="w-4 h-4 text-amber-500 shrink-0" aria-label="Club admin" />
          )}
        </div>
        {club.category && (
          <Badge variant="secondary" className="text-[10px] w-fit mt-1.5">
            {club.category}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
          {club.description ? truncate(club.description, 100) : "No description yet."}
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {club._count.members}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {club._count.events}
            </span>
          </div>
          <Button
            size="sm"
            variant={isMember ? "outline" : "default"}
            onClick={isMember ? onLeave : onJoin}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isMember ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : null}
            {isMember ? "Joined" : "Join"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────
function EventCard({
  event, registration, isPast, isLoading, onRegister, onCancel,
}: {
  event: EventWithDetails;
  registration: EventWithDetails["registrations"][number] | undefined;
  isPast: boolean;
  isLoading: boolean;
  onRegister: () => void;
  onCancel: () => void;
}) {
  const registeredCount = event.registrations.filter((r) => r.status === "REGISTERED" || r.status === "ATTENDED").length;
  const isFull = event.maxAttendees ? registeredCount >= event.maxAttendees : false;

  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-primary uppercase">
            {format(new Date(event.startDate), "MMM")}
          </span>
          <span className="text-lg font-bold text-primary leading-none">
            {format(new Date(event.startDate), "d")}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold leading-snug truncate">{event.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.club?.name ?? "Campus-wide"} · {formatDateTime(event.startDate)}
              </p>
            </div>
            {!isPast && (
              <Button
                size="sm"
                variant={registration ? "outline" : "default"}
                onClick={registration ? onCancel : onRegister}
                disabled={isLoading}
                className="gap-1.5 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : registration ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Ticket className="w-3.5 h-3.5" />
                )}
                {registration
                  ? registration.status === "WAITLISTED"
                    ? "Waitlisted"
                    : "Registered"
                  : isFull
                  ? "Join waitlist"
                  : "Register"}
              </Button>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {truncate(event.description, 140)}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {event.isOnline ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Video className="w-3.5 h-3.5" />
                Online
              </span>
            ) : event.location ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            ) : null}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {registeredCount}
              {event.maxAttendees ? ` / ${event.maxAttendees}` : ""}
            </span>
            {event.endDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Ends {formatDateTime(event.endDate)}
              </span>
            )}
            {event.tags.length > 0 &&
              event.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  #{t}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}