"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Plus, Search, Loader2, PackageSearch, MapPin, Calendar, Phone,
  CheckCircle2, ImageIcon, Trash2, Frown, PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatDate, formatTimeAgo, getInitials, truncate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { LostFoundItem } from "@prisma/client";

const MAX_IMAGES = 3;

const CATEGORY_OPTIONS = [
  "Electronics", "ID Card", "Books", "Keys", "Bag", "Clothing", "Accessories", "Other",
];

type ReporterInfo = {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string; avatar: string | null } | null;
} | null;

type LostFoundItemWithReporter = LostFoundItem & { reporter: ReporterInfo };

interface LostFoundClientProps {
  initialItems: LostFoundItemWithReporter[];
  initialTotal: number;
  userId: string;
}

export function LostFoundClient({ initialItems, initialTotal, userId }: LostFoundClientProps) {
  const [items, setItems] = useState<LostFoundItemWithReporter[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const [tab, setTab] = useState<"all" | "lost" | "found">("all");
  const [search, setSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [isLost, setIsLost] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contactInfo, setContactInfo] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
      const timeout = setTimeout(() => {
        performSearch();
      }, 400);
  
      return () => clearTimeout(timeout);
    }, [search]);

  const hasNextPage = page * DEFAULT_PAGE_SIZE < total;

  const visibleItems = useMemo(() => {
    if (tab === "lost") return items.filter((i) => i.isLost);
    if (tab === "found") return items.filter((i) => !i.isLost);
    return items;
  }, [items, tab]);

  async function runFilter(nextPage: number) {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/lost-found?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch items");
    return res.json();
  }

  async function performSearch() {
    setIsFiltering(true);
    try {
      const json = await runFilter(1);
      setItems(json.data);
      setTotal(json.total);
      setPage(1);
    } catch {
      toast.error("Failed to search items.");
    } finally {
      setIsFiltering(false);
    }
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const json = await runFilter(page + 1);
      setItems((prev) => [...prev, ...json.data]);
      setTotal(json.total);
      setPage((p) => p + 1);
    } catch {
      toast.error("Failed to load more items.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function addImageUrl(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && imageUrlInput.trim()) {
      e.preventDefault();
      if (images.length < MAX_IMAGES) {
        setImages((prev) => [...prev, imageUrlInput.trim()]);
        setImageUrlInput("");
      } else {
        toast.error(`Max ${MAX_IMAGES} images allowed.`);
      }
    }
  }

  function resetForm() {
    setIsLost(true);
    setTitle("");
    setDescription("");
    setCategory("Other");
    setLocation("");
    setDate(new Date().toISOString().slice(0, 10));
    setContactInfo("");
    setImages([]);
    setImageUrlInput("");
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          isLost,
          location: location.trim() || undefined,
          date,
          contactInfo: contactInfo.trim() || undefined,
          images,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to submit report");
      }
      const { data: newItem } = await res.json();
      setItems((prev) => [newItem, ...prev]);
      setTotal((t) => t + 1);
      toast.success(isLost ? "Lost item reported." : "Found item reported.");
      setCreateOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleMarkResolved(item: LostFoundItemWithReporter) {
    setIsUpdating(item.id);
    try {
      const res = await fetch(`/api/lost-found?itemId=${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: true }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success(item.isLost ? "Marked as found!" : "Marked as returned!");
    } catch {
      toast.error("Failed to update item.");
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleDelete(item: LostFoundItemWithReporter) {
    setIsUpdating(item.id);
    try {
      const res = await fetch(`/api/lost-found?itemId=${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Report removed.");
    } catch {
      toast.error("Failed to remove report.");
    } finally {
      setIsUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Lost & Found</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} open reports · Reunite items with their owners
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Report Item
        </Button>
      </div>

      <div className="flex gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
            <TabsTrigger value="found">Found</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // onKeyDown={handleSearch}
          />
        </div>
      </div>

      {isFiltering ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageSearch className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="font-medium">No reports found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Nothing to show here right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item) => {
            const isOwner = item.reporterId === userId;
            return (
              <Card key={item.id}>
                {item.images[0] && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      className={cn(
                        "gap-1 text-[10px]",
                        item.isLost
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {item.isLost ? <Frown className="w-3 h-3" /> : <PackageCheck className="w-3 h-3" />}
                      {item.isLost ? "LOST" : "FOUND"}
                    </Badge>
                    {item.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.category}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold leading-snug">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {truncate(item.description, 110)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {item.location && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.location}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(item.date)}
                    </p>
                    {item.contactInfo && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {item.contactInfo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={item.reporter?.profile?.avatar ?? undefined} />
                        <AvatarFallback className="text-[9px]">
                          {getInitials(item.reporter?.profile?.firstName ?? "?", item.reporter?.profile?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-muted-foreground">{formatTimeAgo(item.createdAt)}</span>
                    </div>

                    {isOwner && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 gap-1 text-[11px]"
                          onClick={() => handleMarkResolved(item)}
                          disabled={isUpdating === item.id}
                        >
                          {isUpdating === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Resolved
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(item)}
                          disabled={isUpdating === item.id}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="gap-2">
            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report an Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isLost ? "default" : "outline"}
                className="flex-1 gap-1.5"
                onClick={() => setIsLost(true)}
              >
                <Frown className="w-4 h-4" />
                I lost something
              </Button>
              <Button
                type="button"
                variant={!isLost ? "default" : "outline"}
                className="flex-1 gap-1.5"
                onClick={() => setIsLost(false)}
              >
                <PackageCheck className="w-4 h-4" />
                I found something
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder={isLost ? "e.g. Black wallet" : "e.g. Found a water bottle"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Distinguishing details..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isLost ? "Date lost" : "Date found"}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="e.g. Library, 2nd floor"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact info</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Phone or email"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URLs (press Enter to add, max {MAX_IMAGES})</Label>
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
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}