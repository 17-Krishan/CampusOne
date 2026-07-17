"use client";

import { useMemo, useState } from "react";
import {
  Plus, Loader2, ClipboardList, Droplets, Wifi, Zap, Wrench, Sparkles,
  MoreHorizontal, MapPin, Flame, UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatDateTime, getDayName } from "@/lib/utils";
import { COMPLAINT_CATEGORIES } from "@/lib/constants";
import type { Complaint, ComplaintCategory, MessMenu } from "@/types";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Droplets, Wifi, Zap, Wrench, Sparkles, MoreHorizontal,
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  RESOLVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CLOSED: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"];
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast", LUNCH: "Lunch", SNACKS: "Snacks", DINNER: "Dinner",
};

interface HostelClientProps {
  initialComplaints: Complaint[];
  messMenu: MessMenu[];
}

export function HostelClient({ initialComplaints, messMenu }: HostelClientProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("MAINTENANCE");
  const [roomNumber, setRoomNumber] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const today = new Date().getDay();

  const menuGrid = useMemo(() => {
    const map = new Map<string, MessMenu>();
    for (const entry of messMenu) {
      map.set(`${entry.dayOfWeek}-${entry.mealType}`, entry);
    }
    return map;
  }, [messMenu]);

  function addImageUrl(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && imageUrlInput.trim()) {
      e.preventDefault();
      if (images.length < 3) {
        setImages((prev) => [...prev, imageUrlInput.trim()]);
        setImageUrlInput("");
      } else {
        toast.error("Max 3 images allowed.");
      }
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("MAINTENANCE");
    setRoomNumber("");
    setImages([]);
    setImageUrlInput("");
  }

  async function handleCreate() {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/hostel/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          roomNumber: roomNumber.trim() || undefined,
          images,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to file complaint");
      }
      const { data: newComplaint } = await res.json();
      setComplaints((prev) => [newComplaint, ...prev]);
      toast.success("Complaint filed. The hostel team will review it shortly.");
      setCreateOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Hostel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          File complaints and check this week's mess menu.
        </p>
      </div>

      <Tabs defaultValue="complaints">
        <TabsList>
          <TabsTrigger value="complaints">My Complaints</TabsTrigger>
          <TabsTrigger value="mess">Mess Menu</TabsTrigger>
        </TabsList>

        {/* ── Complaints ──────────────────────────────────────────── */}
        <TabsContent value="complaints" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              File Complaint
            </Button>
          </div>

          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-medium">No complaints filed yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Facing an issue in your hostel? Let us know.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => {
                const catMeta = COMPLAINT_CATEGORIES.find((cat) => cat.value === c.category);
                const Icon = catMeta ? CATEGORY_ICONS[catMeta.icon] : MoreHorizontal;
                return (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold leading-snug">{c.title}</h3>
                          <Badge className={cn("text-[10px] shrink-0", STATUS_STYLES[c.status])}>
                            {c.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">
                            {catMeta?.label ?? c.category}
                          </Badge>
                          {c.roomNumber && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              Room {c.roomNumber}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Filed {formatDateTime(c.createdAt)}
                          </span>
                          {c.resolvedAt && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              Resolved {formatDateTime(c.resolvedAt)}
                            </span>
                          )}
                        </div>
                        {c.images.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {c.images.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt=""
                                className="w-14 h-14 rounded-lg object-cover border border-border"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Mess Menu ───────────────────────────────────────────── */}
        <TabsContent value="mess" className="mt-4">
          {messMenu.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-medium">Mess menu not available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[720px]">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground p-2 w-24">Meal</th>
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                      <th
                        key={day}
                        className={cn(
                          "text-left text-xs font-medium p-2",
                          day === today ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {getDayName(day, true)}
                        {day === today && <span className="ml-1 text-[10px]">· Today</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_TYPES.map((meal) => (
                    <tr key={meal} className="border-t border-border">
                      <td className="p-2 text-sm font-medium align-top">{MEAL_LABELS[meal]}</td>
                      {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                        const entry = menuGrid.get(`${day}-${meal}`);
                        return (
                          <td
                            key={day}
                            className={cn(
                              "p-2 align-top text-xs",
                              day === today && "bg-primary/5 rounded-lg"
                            )}
                          >
                            {entry ? (
                              <div className="space-y-1">
                                <p className="text-foreground/90">{entry.items.join(", ")}</p>
                                {entry.calories && (
                                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Flame className="w-3 h-3" />
                                    {entry.calories} kcal
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Complaint Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>File a Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. No water supply since morning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input
                  placeholder="e.g. B-204"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URLs (press Enter to add, max 3)</Label>
              <Input
                placeholder="https://..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={addImageUrl}
              />
              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-1">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 bg-background/80 rounded-bl-lg px-1 text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}