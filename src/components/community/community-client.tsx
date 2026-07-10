"use client";

import { useState } from "react";
import {
  Plus, Search, ChevronUp, ChevronDown, MessageCircle, Pin, Lock,
  Loader2, Image as ImageIcon, Filter, Eye,
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
import { PostDetail } from "@/components/community/post-detail";
import { cn, formatTimeAgo, truncate, getInitials, getCategoryColor } from "@/lib/utils";
import { POST_CATEGORIES, POSTS_PAGE_SIZE } from "@/lib/constants";
import type { PostCategory } from "@/types";

export type PostListItem = {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  imageUrl: string | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: Date;
  author: {
    id: string;
    profile: { firstName: string; lastName: string; avatar: string | null } | null;
  };
  votes: { userId: string; value: number }[];
  _count: { comments: number; votes: number };
};

interface CommunityClientProps {
  initialPosts: PostListItem[];
  initialTotal: number;
  userId: string;
}

function getScore(votes: { value: number }[]) {
  return votes.reduce((sum, v) => sum + v.value, 0);
}

function getUserVote(votes: { userId: string; value: number }[], userId: string) {
  return votes.find((v) => v.userId === userId)?.value ?? 0;
}

export function CommunityClient({ initialPosts, initialTotal, userId }: CommunityClientProps) {
  const [posts, setPosts] = useState<PostListItem[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState<string>("GENERAL");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [selectedPost, setSelectedPost] = useState<PostListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const hasNextPage = page * POSTS_PAGE_SIZE < total;

  async function fetchPosts(nextPage: number, replace: boolean) {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (category !== "all") params.set("category", category);
    if (search.trim()) params.set("search", search.trim());

    const res = await fetch(`/api/community/posts?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
  }

  async function handleFilterChange(nextCategory: string) {
    setCategory(nextCategory);
    setIsFiltering(true);
    try {
      const params = new URLSearchParams({ page: "1" });
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/community/posts?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPosts(json.data);
      setTotal(json.total);
      setPage(1);
    } catch {
      toast.error("Failed to filter posts.");
    } finally {
      setIsFiltering(false);
    }
  }

  async function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    setIsFiltering(true);
    try {
      const json = await fetchPosts(1, true);
      setPosts(json.data);
      setTotal(json.total);
      setPage(1);
    } catch {
      toast.error("Failed to search posts.");
    } finally {
      setIsFiltering(false);
    }
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const json = await fetchPosts(page + 1, false);
      setPosts((prev) => [...prev, ...json.data]);
      setTotal(json.total);
      setPage((p) => p + 1);
    } catch {
      toast.error("Failed to load more posts.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags((prev) => [...prev, newTag]);
      }
      setTagInput("");
    }
  }

  async function handleCreatePost() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: postCategory,
          tags,
          imageUrl: imageUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create post");
      }
      const { data: newPost } = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setTotal((t) => t + 1);
      toast.success("Post published!");
      setCreateOpen(false);
      setTitle("");
      setContent("");
      setPostCategory("GENERAL");
      setTags([]);
      setImageUrl("");
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  }

  function updatePostInList(updated: PostListItem) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPost((prev) => (prev?.id === updated.id ? updated : prev));
  }

  async function handleVote(post: PostListItem, value: 1 | -1) {
    const userVote = getUserVote(post.votes, userId);
    const optimisticVotes =
      userVote === value
        ? post.votes.filter((v) => v.userId !== userId)
        : userVote === 0
        ? [...post.votes, { userId, value }]
        : post.votes.map((v) => (v.userId === userId ? { ...v, value } : v));

    updatePostInList({ ...post, votes: optimisticVotes });

    try {
      const res = await fetch(`/api/community/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      const { data } = await res.json();
      updatePostInList({ ...post, votes: data.votes });
    } catch {
      toast.error("Failed to vote.");
      updatePostInList(post); // rollback
    }
  }

  function openPostDetail(post: PostListItem) {
    setSelectedPost(post);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} posts · Discuss academics, placements, hostel & more
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search posts, tags... (press Enter)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        <Select value={category} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {POST_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feed */}
      {isFiltering ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="font-medium">No posts found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try a different search term." : "Be the first to start a discussion!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const score = getScore(post.votes);
            const userVote = getUserVote(post.votes, userId);
            const author = post.author.profile;
            return (
              <Card
                key={post.id}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => openPostDetail(post)}
              >
                <CardContent className="p-4 flex gap-4">
                  {/* Vote column */}
                  <div
                    className="flex flex-col items-center gap-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleVote(post, 1)}
                      className={cn(
                        "p-1 rounded-lg hover:bg-accent transition-colors",
                        userVote === 1 && "text-primary bg-primary/10"
                      )}
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold tabular-nums">{score}</span>
                    <button
                      onClick={() => handleVote(post, -1)}
                      className={cn(
                        "p-1 rounded-lg hover:bg-accent transition-colors",
                        userVote === -1 && "text-red-500 bg-red-500/10"
                      )}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {post.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                      {post.isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                      <Badge className={cn("text-[10px]", getCategoryColor(post.category))}>
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold leading-snug truncate">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {truncate(post.content, 160)}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {post.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={author?.avatar ?? undefined} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(author?.firstName ?? "?", author?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {author ? `${author.firstName} ${author.lastName}` : "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {post._count.comments}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                        {post.viewCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="gap-2">
                {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Post Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Share the details..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={postCategory} onValueChange={setPostCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags (press Enter to add)</Label>
              <Input
                placeholder="e.g. exams, sem5"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-destructive/10"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          userId={userId}
          onVote={(value) => handleVote(selectedPost, value)}
          onCommentAdded={() =>
            updatePostInList({
              ...selectedPost,
              _count: { ...selectedPost._count, comments: selectedPost._count.comments + 1 },
            })
          }
        />
      )}
    </div>
  );
}