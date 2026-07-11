"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Plus, Search, Loader2, Package, MapPin, ImageIcon, ChevronLeft, ChevronRight,
  Mail, CheckCircle2, Trash2, Tag,
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
import { cn, formatTimeAgo, getInitials, truncate } from "@/lib/utils";
import { MAX_MARKETPLACE_IMAGES, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { MarketplaceItemWithSeller, MarketplaceCategory } from "@/types";

const MARKETPLACE_CATEGORIES: { value: MarketplaceCategory; label: string; emoji: string }[] = [
  { value: "BOOKS", label: "Books", emoji: "📚" },
  { value: "ELECTRONICS", label: "Electronics", emoji: "🔌" },
  { value: "CYCLES", label: "Cycles", emoji: "🚲" },
  { value: "HOSTEL_ITEMS", label: "Hostel Items", emoji: "🛏️" },
  { value: "CLOTHING", label: "Clothing", emoji: "👕" },
  { value: "SPORTS", label: "Sports", emoji: "⚽" },
  { value: "OTHER", label: "Other", emoji: "📦" },
];

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCategoryMeta(category: string) {
  return MARKETPLACE_CATEGORIES.find((c) => c.value === category);
}

interface MarketplaceClientProps {
  initialItems: MarketplaceItemWithSeller[];
  initialTotal: number;
  userId: string;
}

export function MarketplaceClient({ initialItems, initialTotal, userId }: MarketplaceClientProps) {
  const [items, setItems] = useState<MarketplaceItemWithSeller[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [itemCategory, setItemCategory] = useState<MarketplaceCategory>("BOOKS");
  const [condition, setCondition] = useState("GOOD");
  const [location, setLocation] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedItem, setSelectedItem] = useState<MarketplaceItemWithSeller | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  // const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch();
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);


  async function performSearch() {
    setIsFiltering(true);

    try {
      const json = await runFilter(1);
      setItems(json.data);
      setTotal(json.total);
      setPage(1);
    } catch {
      toast.error("Failed to search listings.");
    } finally {
      setIsFiltering(false);
    }
  }
  const hasNextPage = page * DEFAULT_PAGE_SIZE < total;

  const visibleItems = useMemo(
    () => (mineOnly ? items.filter((i) => i.sellerId === userId) : items),
    [items, mineOnly, userId]
  );

  async function runFilter(nextPage: number) {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (category !== "all") params.set("category", category);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/marketplace?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch listings");
    return res.json();
  }

  async function handleFilterChange(nextCategory: string) {
    setCategory(nextCategory);
    setIsFiltering(true);
    try {
      const params = new URLSearchParams({ page: "1" });
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/marketplace?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems(json.data);
      setTotal(json.total);
      setPage(1);
    } catch {
      toast.error("Failed to filter listings.");
    } finally {
      setIsFiltering(false);
    }
  }

  // async function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
  //   if (e.key !== "Enter") return;
  //   setIsFiltering(true);
  //   try {
  //     const json = await runFilter(1);
  //     setItems(json.data);
  //     setTotal(json.total);
  //     setPage(1);
  //   } catch {
  //     toast.error("Failed to search listings.");
  //   } finally {
  //     setIsFiltering(false);
  //   }
  // }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const json = await runFilter(page + 1);
      setItems((prev) => [...prev, ...json.data]);
      setTotal(json.total);
      setPage((p) => p + 1);
    } catch {
      toast.error("Failed to load more listings.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function addImageUrl(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && imageUrlInput.trim()) {
      e.preventDefault();
      if (images.length < MAX_MARKETPLACE_IMAGES) {
        setImages((prev) => [...prev, imageUrlInput.trim()]);
        setImageUrlInput("");
      } else {
        toast.error(`Max ${MAX_MARKETPLACE_IMAGES} images allowed.`);
      }
    }
  }

  function resetCreateForm() {
    setTitle("");
    setDescription("");
    setPrice("");
    setItemCategory("BOOKS");
    setCondition("GOOD");
    setLocation("");
    setImages([]);
    setImageUrlInput("");
  }

  async function handleCreateListing() {
    const priceNum = parseFloat(price);
    if (!title.trim() || !priceNum || priceNum <= 0) {
      toast.error("Title and a valid price are required.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          price: priceNum,
          category: itemCategory,
          condition,
          location: location.trim() || undefined,
          images,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create listing");
      }
      const { data: newItem } = await res.json();
      setItems((prev) => [newItem, ...prev]);
      setTotal((t) => t + 1);
      toast.success("Listing published!");
      setCreateOpen(false);
      resetCreateForm();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  }

  function openDetail(item: MarketplaceItemWithSeller) {
    setSelectedItem(item);
    setActiveImage(0);
    setDetailOpen(true);
  }

  async function handleMarkSold(item: MarketplaceItemWithSeller) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/marketplace?itemId=${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      if (!res.ok) throw new Error("Failed to update listing");
      const { data: updated } = await res.json();
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      setSelectedItem(updated);
      toast.success("Marked as sold.");
    } catch {
      toast.error("Failed to update listing.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemove(item: MarketplaceItemWithSeller) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/marketplace?itemId=${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove listing");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTotal((t) => Math.max(0, t - 1));
      setDetailOpen(false);
      toast.success("Listing removed.");
    } catch {
      toast.error("Failed to remove listing.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Buy and sell with fellow students · {total} active listings
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Listing
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          // onKeyDown={handleSearch}
          />
        </div>
        <Select value={category} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={mineOnly ? "default" : "outline"}
          onClick={() => setMineOnly((v) => !v)}
          className="shrink-0"
        >
          My Listings
        </Button>
      </div>

      {isFiltering ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="font-medium">No listings found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {mineOnly ? "You haven't listed anything yet." : "Try a different search or category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleItems.map((item) => {
            const catMeta = getCategoryMeta(item.category);
            return (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => openDetail(item)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                  {item.status === "SOLD" && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Badge variant="secondary">SOLD</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-primary font-bold mt-0.5">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {catMeta && (
                      <Badge variant="secondary" className="text-[10px]">
                        {catMeta.emoji} {catMeta.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {CONDITIONS.find((c) => c.value === item.condition)?.label ?? item.condition}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">{formatTimeAgo(item.createdAt)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {hasNextPage && !mineOnly && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="gap-2">
            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}

      {/* Create Listing Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. Data Structures Textbook" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Condition details, why you're selling, etc."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" min="0" placeholder="500" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={itemCategory} onValueChange={(v) => setItemCategory(v as MarketplaceCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="e.g. Hostel Block C"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URLs (press Enter to add, max {MAX_MARKETPLACE_IMAGES})</Label>
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
            <Button onClick={handleCreateListing} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">{selectedItem.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image gallery */}
                <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
                  {selectedItem.images.length > 0 ? (
                    <img
                      src={selectedItem.images[activeImage]}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  {selectedItem.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImage((i) => (i === 0 ? selectedItem.images.length - 1 : i - 1))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImage((i) => (i === selectedItem.images.length - 1 ? 0 : i + 1))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1.5"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {selectedItem.status === "SOLD" && (
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      SOLD
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">{formatPrice(selectedItem.price)}</p>
                  <div className="flex gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {getCategoryMeta(selectedItem.category)?.emoji}{" "}
                      {getCategoryMeta(selectedItem.category)?.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {CONDITIONS.find((c) => c.value === selectedItem.condition)?.label}
                    </Badge>
                  </div>
                </div>

                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedItem.description}
                  </p>
                )}

                {selectedItem.location && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedItem.location}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedItem.seller.profile?.avatar ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(
                          selectedItem.seller.profile?.firstName ?? "?",
                          selectedItem.seller.profile?.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedItem.seller.profile?.firstName} {selectedItem.seller.profile?.lastName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Seller</p>
                    </div>
                  </div>

                  {selectedItem.sellerId === userId ? (
                    <div className="flex gap-2">
                      {selectedItem.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handleMarkSold(selectedItem)}
                          disabled={isUpdating}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark sold
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-500 hover:text-red-600"
                        onClick={() => handleRemove(selectedItem)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <a href={`mailto:${selectedItem.seller.email}`}>
                      <Button size="sm" className="gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Contact seller
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}