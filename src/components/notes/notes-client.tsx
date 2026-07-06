"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Plus, Search, Upload, FileText, Sparkles,
  Eye, BookMarked, Filter, Loader2, File, Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { NoteCard } from "@/components/notes/note-card";
import { NoteDetailDialog } from "@/components/notes/note-detail-dialog";
import { noteUploadSchema, type NoteUploadFormData } from "@/lib/validations";
import { cn, formatFileSize } from "@/lib/utils";
import { ALLOWED_NOTE_TYPES, MAX_NOTE_FILE_SIZE } from "@/lib/constants";
import type { Subject } from "@/types";

type NoteWithDetails = {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  subject: Subject | null;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  isPublic: boolean;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  uploader: { id: string; profile: { firstName: string; lastName: string; avatar: string | null } | null };
  summaries: { id: string; type: string; content: string }[];
  _count: { flashcards: number };
};

interface NotesClientProps {
  initialNotes: NoteWithDetails[];
  subjects: Subject[];
  userId: string;
}

const FILE_TYPE_ICON: Record<string, React.ElementType> = {
  PDF: FileText,
  PPT: Presentation,
  DOC: File,
  IMAGE: File,
  OTHER: File,
};

export function NotesClient({ initialNotes, subjects, userId }: NotesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NoteUploadFormData>({
    resolver: zodResolver(noteUploadSchema),
    defaultValues: { isPublic: true },
  });

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.subject?.name.toLowerCase().includes(search.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesSubject =
        filterSubject === "all" || n.subjectId === filterSubject;
      return matchesSearch && matchesSubject;
    });
  }, [notes, search, filterSubject]);

  const myNotes = filtered.filter((n) => n.uploader.id === userId);
  const allNotes = filtered;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_NOTE_FILE_SIZE) {
      toast.error(`File too large. Max size is ${formatFileSize(MAX_NOTE_FILE_SIZE)}.`);
      return;
    }
    if (!ALLOWED_NOTE_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Please upload PDF, PPT, DOC, or image.");
      return;
    }
    setUploadFile(file);
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

  async function onUpload(data: NoteUploadFormData) {
    if (!uploadFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    setIsUploading(true);
    try {
      // 1. Get presigned upload URL
      const presignRes = await fetch("/api/notes/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          fileSize: uploadFile.size,
        }),
      });
      if (!presignRes.ok) {
        toast.error("Failed to get upload URL.");
        return;
      }
      const { uploadUrl, fileUrl } = await presignRes.json();

      // 2. Upload to Supabase Storage
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadFile,
        headers: { "Content-Type": uploadFile.type },
      });
      if (!uploadRes.ok) {
        toast.error("File upload failed.");
        return;
      }

      // 3. Create note record
      const noteRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          fileUrl,
          fileSize: uploadFile.size,
          tags,
        }),
      });
      if (!noteRes.ok) {
        const d = await noteRes.json();
        toast.error(d.error ?? "Failed to save note.");
        return;
      }
      const { data: newNote } = await noteRes.json();
      setNotes((prev) => [newNote, ...prev]);
      toast.success("Note uploaded! AI processing will begin shortly.");
      setUploadOpen(false);
      setUploadFile(null);
      setTags([]);
      reset();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  }

  async function triggerAIProcessing(noteId: string) {
    toast.loading("Generating AI summaries...", { id: "ai-processing" });
    try {
      const res = await fetch(`/api/ai/notes/${noteId}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Update note in state with summaries
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, summaries: data.summaries ?? n.summaries } : n))
      );
      toast.success("AI summaries generated!", { id: "ai-processing" });
      if (selectedNote?.id === noteId) {
        setSelectedNote((prev) => prev ? { ...prev, summaries: data.summaries ?? prev.summaries } : prev);
      }
    } catch {
      toast.error("AI processing failed. Please try again.", { id: "ai-processing" });
    }
  }

  function openNoteDetail(note: NoteWithDetails) {
    setSelectedNote(note);
    setDetailOpen(true);
  }

  function NoteGrid({ list }: { list: NoteWithDetails[] }) {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="font-medium">No notes found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try a different search term." : "Be the first to upload notes!"}
          </p>
        </div>
      );
    }
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            isOwner={note.uploader.id === userId}
            onClick={() => openNoteDetail(note)}
            onAIGenerate={() => triggerAIProcessing(note.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {notes.length} notes · AI-powered summaries and flashcards
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Notes
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search notes, subjects, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Notes ({allNotes.length})</TabsTrigger>
          <TabsTrigger value="mine">My Uploads ({myNotes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <NoteGrid list={allNotes} />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <NoteGrid list={myNotes} />
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Notes
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onUpload)} className="space-y-4 py-2">
            {/* File picker */}
            <div className="space-y-2">
              <Label>File</Label>
              <label className={cn(
                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                uploadFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-accent/50"
              )}>
                {uploadFile ? (
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-primary mx-auto mb-1" />
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF, PPT, DOC, Image · Max 50MB</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. DBMS Unit 3 Notes" {...register("title")} className={errors.title ? "border-destructive" : ""} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subject (optional)</Label>
                <Select onValueChange={(v) => setValue("subjectId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select defaultValue="true" onValueChange={(v) => setValue("isPublic", v === "true")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Public</SelectItem>
                    <SelectItem value="false">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (press Enter to add)</Label>
              <Input
                placeholder="e.g. sql, normalization"
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

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                AI will automatically generate summaries, key concepts, flashcards, and quiz questions after upload.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setUploadOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || !uploadFile} className="gap-2">
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4" />Upload & Analyse</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Note Detail Dialog */}
      {selectedNote && (
        <NoteDetailDialog
          note={selectedNote}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onAIGenerate={() => triggerAIProcessing(selectedNote.id)}
        />
      )}
    </div>
  );
}