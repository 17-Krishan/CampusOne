"use client";

import {
  FileText, Eye, Sparkles, BookMarked, Presentation,
  File, Clock, User, Tag,
} from "lucide-react";
import { formatTimeAgo, formatFileSize, getInitials, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type NoteCardProps = {
  note: {
    id: string;
    title: string;
    description: string | null;
    fileType: string;
    fileSize: number | null;
    tags: string[];
    viewCount: number;
    createdAt: Date;
    subject: { name: string; code: string } | null;
    uploader: {
      profile: { firstName: string; lastName: string; avatar: string | null } | null;
    };
    summaries: { type: string }[];
    _count: { flashcards: number };
  };
  isOwner: boolean;
  onClick: () => void;
  onAIGenerate: () => void;
};

const FILE_ICONS: Record<string, React.ElementType> = {
  PDF: FileText,
  PPT: Presentation,
  DOC: File,
  IMAGE: File,
  OTHER: File,
};

const FILE_COLORS: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-500",
  PPT: "bg-orange-500/10 text-orange-500",
  DOC: "bg-blue-500/10 text-blue-500",
  IMAGE: "bg-violet-500/10 text-violet-500",
  OTHER: "bg-muted text-muted-foreground",
};

export function NoteCard({ note, isOwner, onClick, onAIGenerate }: NoteCardProps) {
  const FileIcon = FILE_ICONS[note.fileType] ?? File;
  const hasAI = note.summaries.length > 0;
  const profile = note.uploader.profile;
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : "Unknown";
  const initials = getInitials(profile?.firstName ?? "?", profile?.lastName);

  return (
    <Card
      className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              FILE_COLORS[note.fileType] ?? FILE_COLORS.OTHER
            )}
          >
            <FileIcon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1">
            {hasAI && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 h-4 gap-0.5 bg-primary/10 text-primary border-0"
              >
                <Sparkles className="w-2.5 h-2.5" />
                AI
              </Badge>
            )}
            {note._count.flashcards > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 gap-0.5">
                <BookMarked className="w-2.5 h-2.5" />
                {note._count.flashcards}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {note.title}
          </h3>
          {note.subject && (
            <p className="text-xs text-muted-foreground mt-1">
              {note.subject.name} · {note.subject.code}
            </p>
          )}
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 h-4">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 h-4">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Avatar className="w-5 h-5">
              {profile?.avatar && <AvatarImage src={profile.avatar} />}
              <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {note.viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(note.createdAt)}
            </span>
          </div>
        </div>

        {/* AI generate button — only if no summaries yet */}
        {!hasAI && isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onAIGenerate();
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate AI Summary
          </Button>
        )}
      </CardContent>
    </Card>
  );
}