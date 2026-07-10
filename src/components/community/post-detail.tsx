"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, MessageCircle, Loader2, Send, Pin, Lock, CornerDownRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, formatTimeAgo, getInitials, getCategoryColor } from "@/lib/utils";
import type { PostListItem } from "@/components/community/community-client";

type CommentAuthor = {
  id: string;
  profile: { firstName: string; lastName: string; avatar: string | null } | null;
};

type CommentItem = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  author: CommentAuthor;
  replies: CommentItem[];
};

interface PostDetailProps {
  post: PostListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onVote: (value: 1 | -1) => void;
  onCommentAdded: () => void;
}

function getScore(votes: { value: number }[]) {
  return votes.reduce((sum, v) => sum + v.value, 0);
}

function getUserVote(votes: { userId: string; value: number }[], userId: string) {
  return votes.find((v) => v.userId === userId)?.value ?? 0;
}

export function PostDetail({ post, open, onOpenChange, userId, onVote, onCommentAdded }: PostDetailProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/community/posts/${post.id}/comments`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load comments");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setComments(json.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load comments.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, post.id]);

  async function handleSubmitComment() {
    if (!commentText.trim() || post.isLocked) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText.trim(),
          parentId: replyTo?.id ?? undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to post comment");
      }
      const { data: newComment } = await res.json();

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...c.replies, newComment] } : c
          )
        );
      } else {
        setComments((prev) => [...prev, { ...newComment, replies: [] }]);
      }
      onCommentAdded();
      setCommentText("");
      setReplyTo(null);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const score = getScore(post.votes);
  const userVote = getUserVote(post.votes, userId);
  const author = post.author.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {post.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
            {post.isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
            <Badge className={cn("text-[10px]", getCategoryColor(post.category))}>
              {post.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt)}</span>
          </div>
          <DialogTitle className="text-left text-lg leading-snug">{post.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Post body */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <button
                onClick={() => onVote(1)}
                className={cn(
                  "p-1 rounded-lg hover:bg-accent transition-colors",
                  userVote === 1 && "text-primary bg-primary/10"
                )}
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold tabular-nums">{score}</span>
              <button
                onClick={() => onVote(-1)}
                className={cn(
                  "p-1 rounded-lg hover:bg-accent transition-colors",
                  userVote === -1 && "text-red-500 bg-red-500/10"
                )}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={author?.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(author?.firstName ?? "?", author?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {author ? `${author.firstName} ${author.lastName}` : "Unknown"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="rounded-xl border border-border max-h-80 w-full object-cover"
                />
              )}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      #{t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <MessageCircle className="w-4 h-4" />
              Comments ({comments.reduce((n, c) => n + 1 + c.replies.length, 0)})
            </p>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No comments yet. Be the first to reply!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="space-y-3">
                    <CommentRow comment={c} onReply={() => setReplyTo(c)} />
                    {c.replies.map((r) => (
                      <div key={r.id} className="pl-8 flex gap-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground mt-2 shrink-0" />
                        <CommentRow comment={r} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        {post.isLocked ? (
          <div className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 inline mr-1" />
            This post is locked for new comments.
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-border shrink-0">
            {replyTo && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 bg-accent/50 rounded-lg px-3 py-1.5">
                <span>
                  Replying to{" "}
                  <span className="font-medium">
                    {replyTo.author.profile?.firstName ?? "Unknown"}
                  </span>
                </span>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Add a comment..."
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="resize-none"
              />
              <Button
                size="icon"
                className="shrink-0"
                onClick={handleSubmitComment}
                disabled={isSubmitting || !commentText.trim()}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CommentRow({ comment, onReply }: { comment: CommentItem; onReply?: () => void }) {
  const author = comment.author.profile;
  return (
    <div className="flex gap-2.5">
      <Avatar className="w-7 h-7 shrink-0">
        <AvatarImage src={author?.avatar ?? undefined} />
        <AvatarFallback className="text-[10px]">
          {getInitials(author?.firstName ?? "?", author?.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {author ? `${author.firstName} ${author.lastName}` : "Unknown"}
          </span>
          <span className="text-[11px] text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        {onReply && (
          <button
            onClick={onReply}
            className="text-[11px] text-muted-foreground hover:text-primary mt-1 font-medium"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}