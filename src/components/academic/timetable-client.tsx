"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, Trash2, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn, getDayName, formatTime } from "@/lib/utils";
import type { Subject } from "@/types";

// Prisma inline types
type TimetableSlot = {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  type: string;
  subject: Subject;
};

type Timetable = {
  id: string;
  slots: TimetableSlot[];
};

interface TimetableClientProps {
  timetable: Timetable | null;
  subjects: Subject[];
  userId: string;
  semester: number;
  branch: string;
}

const DAYS = [1, 2, 3, 4, 5, 6]; // Mon–Sat
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const SLOT_COLORS = [
  "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
  "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300",
  "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
  "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300",
  "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300",
  "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300",
  "bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-300",
];

function getSubjectColor(subjectId: string, allSubjectIds: string[]) {
  const idx = allSubjectIds.indexOf(subjectId);
  return SLOT_COLORS[idx % SLOT_COLORS.length];
}

export function TimetableClient({
  timetable: initialTimetable,
  subjects,
  userId,
  semester,
  branch,
}: TimetableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slots, setSlots] = useState<TimetableSlot[]>(
    initialTimetable?.slots ?? []
  );
  const [timetableId, setTimetableId] = useState<string | null>(
    initialTimetable?.id ?? null
  );
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    subjectId: "",
    dayOfWeek: "1",
    startTime: "09:00",
    endTime: "10:00",
    room: "",
    type: "LECTURE",
  });

  const subjectIds = [...new Set(slots.map((s) => s.subjectId))];
  const today = new Date().getDay(); // 0=Sun

  async function ensureTimetable(): Promise<string> {
    if (timetableId) return timetableId;
    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semester, branch }),
    });
    if (!res.ok) throw new Error("Failed to create timetable");
    const data = await res.json();
    setTimetableId(data.data.id);
    return data.data.id;
  }

  async function handleAddSlot() {
    if (!form.subjectId) {
      toast.error("Please select a subject.");
      return;
    }
    try {
      const id = await ensureTimetable();
      const res = await fetch("/api/timetable/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, timetableId: id }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Failed to add slot.");
        return;
      }
      const data = await res.json();
      setSlots((prev) => [...prev, data.data]);
      toast.success("Class added!");
      setAddOpen(false);
      setForm({ subjectId: "", dayOfWeek: "1", startTime: "09:00", endTime: "10:00", room: "", type: "LECTURE" });
    } catch {
      toast.error("Something went wrong.");
    }
  }

  async function handleDeleteSlot(slotId: string) {
    try {
      const res = await fetch(`/api/timetable/slots/${slotId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete slot.");
        return;
      }
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast.success("Class removed.");
    } catch {
      toast.error("Something went wrong.");
    }
  }

  // Get slot for a specific day + time
  function getSlot(day: number, time: string) {
    return slots.find(
      (s) => s.dayOfWeek === day && s.startTime === time
    );
  }

  // Today's classes sorted by time
  const todaySlots = slots
    .filter((s) => s.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Timetable
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your weekly class schedule
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Class
        </Button>
      </div>

      {/* Today's schedule */}
      {todaySlots.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Today — {getDayName(today)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {todaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className={cn(
                    "flex-shrink-0 p-3 rounded-xl border min-w-[160px]",
                    getSubjectColor(slot.subjectId, subjectIds)
                  )}
                >
                  <p className="font-semibold text-sm truncate">
                    {slot.subject.name}
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </p>
                  {slot.room && (
                    <p className="text-xs mt-0.5 opacity-70">📍 {slot.room}</p>
                  )}
                  <Badge className="mt-2 text-[10px] px-1.5 py-0 h-4 bg-white/20 text-inherit border-0">
                    {slot.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {slots.length === 0 && !addOpen ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-medium">No classes added yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Build your weekly timetable by adding classes.
              </p>
              <Button onClick={() => setAddOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add your first class
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground w-20">
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className={cn(
                        "p-3 text-center text-xs font-semibold w-[14%]",
                        day === today
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <span className="hidden sm:block">{getDayName(day)}</span>
                      <span className="sm:hidden">{getDayName(day, true)}</span>
                      {day === today && (
                        <span className="block w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, timeIdx) => (
                  <tr
                    key={time}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      timeIdx % 2 === 0 ? "bg-muted/20" : ""
                    )}
                  >
                    <td className="p-3 text-xs text-muted-foreground font-mono">
                      {formatTime(time)}
                    </td>
                    {DAYS.map((day) => {
                      const slot = getSlot(day, time);
                      return (
                        <td key={day} className="p-1.5 align-top">
                          {slot ? (
                            <div
                              className={cn(
                                "relative group p-2 rounded-lg border text-xs font-medium cursor-default",
                                getSubjectColor(slot.subjectId, subjectIds)
                              )}
                            >
                              <p className="truncate">{slot.subject.code ?? slot.subject.name}</p>
                              {slot.room && (
                                <p className="text-[10px] opacity-70 mt-0.5 truncate">
                                  {slot.room}
                                </p>
                              )}
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-current hover:text-red-500"
                                title="Remove"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  dayOfWeek: String(day),
                                  startTime: time,
                                  endTime:
                                    TIME_SLOTS[
                                      Math.min(timeIdx + 1, TIME_SLOTS.length - 1)
                                    ],
                                }));
                                setAddOpen(true);
                              }}
                              className="w-full h-8 rounded-md text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-all text-lg"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Subject legend */}
      {subjectIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subjectIds.map((id) => {
            const subject = slots.find((s) => s.subjectId === id)?.subject;
            if (!subject) return null;
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
                  getSubjectColor(id, subjectIds)
                )}
              >
                <BookOpen className="w-3 h-3" />
                {subject.name}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Add Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={form.subjectId}
                onValueChange={(v) => setForm((f) => ({ ...f, subjectId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={form.dayOfWeek}
                onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {getDayName(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  value={form.startTime}
                  onValueChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatTime(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select
                  value={form.endTime}
                  onValueChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatTime(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Room (optional)</Label>
                <Input
                  placeholder="e.g. A-201"
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LECTURE">Lecture</SelectItem>
                    <SelectItem value="LAB">Lab</SelectItem>
                    <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot} disabled={isPending}>
              {isPending ? "Adding…" : "Add Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}