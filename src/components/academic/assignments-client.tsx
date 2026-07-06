"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, CheckCircle2, Clock, AlertTriangle,
  Filter, Search, ChevronDown, Upload, Calendar, BookOpen,
} from "lucide-react";
import { format, isPast, differenceInDays, isFuture } from "date-fns";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  cn, formatDate, getPriorityColor, formatTimeAgo,
} from "@/lib/utils";
import { assignmentSchema, type AssignmentFormData } from "@/lib/validations";
import type {
  Assignment, AssignmentSubmission, Subject, UserRole,
  User, Profile,
} from "@/types";

type AssignmentWithDetails = Assignment & {
  subject: Subject;
  submissions: AssignmentSubmission[];
  creator: User & { profile: Profile | null };
};

interface AssignmentsClientProps {
  assignments: AssignmentWithDetails[];
  subjects: Subject[];
  userId: string;
  userRole: UserRole;
}

function getAssignmentStatus(
  assignment: AssignmentWithDetails,
  userId: string
): "submitted" | "overdue" | "due-soon" | "upcoming" {
  const submitted = assignment.submissions.some((s) => s.userId === userId);
  if (submitted) return "submitted";
  if (isPast(new Date(assignment.dueDate))) return "overdue";
  if (differenceInDays(new Date(assignment.dueDate), new Date()) <= 2) return "due-soon";
  return "upcoming";
}

export function AssignmentsClient({
  assignments: initial,
  subjects,
  userId,
  userRole,
}: AssignmentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignments, setAssignments] = useState(initial);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentWithDetails | null>(null);
  const [submitContent, setSubmitContent] = useState("");

  const canCreate = userRole === "FACULTY" || userRole === "SUPER_ADMIN";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { priority: "MEDIUM", maxMarks: 100 },
  });

  // Filtered + grouped
  const filtered = useMemo(() => {
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.subject.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [assignments, search]);

  const pending = filtered.filter(
    (a) => !a.submissions.some((s) => s.userId === userId) && isFuture(new Date(a.dueDate))
  );
  const submitted = filtered.filter((a) =>
    a.submissions.some((s) => s.userId === userId)
  );
  const overdue = filtered.filter(
    (a) =>
      isPast(new Date(a.dueDate)) &&
      !a.submissions.some((s) => s.userId === userId)
  );

  async function onCreateAssignment(data: AssignmentFormData) {
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Failed to create assignment.");
        return;
      }
      const { data: created } = await res.json();
      toast.success("Assignment created!");
      setCreateOpen(false);
      reset();
      startTransition(() => router.refresh());
    } catch {
      toast.error("Something went wrong.");
    }
  }

  async function handleSubmitAssignment() {
    if (!selectedAssignment) return;
    try {
      const res = await fetch(`/api/assignments/${selectedAssignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: submitContent }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Submission failed.");
        return;
      }
      toast.success("Assignment submitted!");
      setSubmitOpen(false);
      setSubmitContent("");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Something went wrong.");
    }
  }

  const statusConfig = {
    submitted: { label: "Submitted", icon: CheckCircle2, color: "text-emerald-500", badgeVariant: "success" as const },
    overdue: { label: "Overdue", icon: AlertTriangle, color: "text-red-500", badgeVariant: "danger" as const },
    "due-soon": { label: "Due Soon", icon: Clock, color: "text-amber-500", badgeVariant: "warning" as const },
    upcoming: { label: "Upcoming", icon: Calendar, color: "text-blue-500", badgeVariant: "info" as const },
  };

  function AssignmentCard({ assignment }: { assignment: AssignmentWithDetails }) {
    const status = getAssignmentStatus(assignment, userId);
    const cfg = statusConfig[status];
    const dueDate = new Date(assignment.dueDate);
    const daysLeft = differenceInDays(dueDate, new Date());

    return (
      <div
        className={cn(
          "p-4 rounded-xl border transition-all hover:shadow-sm",
          status === "overdue" && "border-red-200 bg-red-500/5 dark:border-red-900",
          status === "due-soon" && "border-amber-200 bg-amber-500/5 dark:border-amber-900",
          status === "submitted" && "border-emerald-200/50 dark:border-emerald-900/50",
          status === "upcoming" && "border-border"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
            status === "submitted" ? "bg-emerald-500/10" :
            status === "overdue" ? "bg-red-500/10" :
            status === "due-soon" ? "bg-amber-500/10" : "bg-primary/10"
          )}>
            <cfg.icon className={cn("w-4 h-4", cfg.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{assignment.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {assignment.subject.name}
                  {assignment.creator.profile &&
                    ` · ${assignment.creator.profile.firstName} ${assignment.creator.profile.lastName}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={cfg.badgeVariant} className="text-[10px] px-1.5 py-0 h-4">
                  {cfg.label}
                </Badge>
                <Badge className={cn("text-[10px] px-1.5 py-0 h-4", getPriorityColor(assignment.priority))}>
                  {assignment.priority.toLowerCase()}
                </Badge>
              </div>
            </div>

            {assignment.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {assignment.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due {format(dueDate, "MMM d, yyyy")}
                </span>
                {status !== "submitted" && status !== "overdue" && (
                  <span className={cn(daysLeft <= 1 ? "text-amber-500 font-medium" : "")}>
                    {daysLeft === 0 ? "Due today!" :
                     daysLeft === 1 ? "1 day left" :
                     `${daysLeft} days left`}
                  </span>
                )}
                <span>{assignment.maxMarks} marks</span>
              </div>

              {status !== "submitted" && (
                <Button
                  size="sm"
                  variant={status === "overdue" ? "destructive" : "outline"}
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setSubmitOpen(true);
                  }}
                >
                  <Upload className="w-3 h-3" />
                  Submit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Assignments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pending.length} pending · {overdue.length} overdue
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Assignment
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: assignments.length, color: "text-foreground" },
          { label: "Pending", value: pending.length, color: "text-blue-500" },
          { label: "Submitted", value: submitted.length, color: "text-emerald-500" },
          { label: "Overdue", value: overdue.length, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search assignments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            Overdue
            {overdue.length > 0 && (
              <Badge variant="danger" className="text-[10px] h-4 px-1.5">{overdue.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {(["pending", "overdue", "submitted", "all"] as const).map((tab) => {
          const list =
            tab === "pending" ? pending :
            tab === "overdue" ? overdue :
            tab === "submitted" ? submitted :
            filtered;

          return (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
              {list.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {tab === "overdue" ? "No overdue assignments! 🎉" :
                       tab === "submitted" ? "Nothing submitted yet." :
                       tab === "pending" ? "All caught up!" :
                       "No assignments found."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                list.map((a) => <AssignmentCard key={a.id} assignment={a} />)
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Submit Dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Submit Assignment
            </DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted">
                <p className="font-semibold text-sm">{selectedAssignment.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedAssignment.subject.name} · Due{" "}
                  {format(new Date(selectedAssignment.dueDate), "MMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Your submission (text)</Label>
                <Textarea
                  placeholder="Write your answer or paste your solution here..."
                  className="min-h-[120px] resize-none"
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                File upload support coming soon. For now, paste your content above.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAssignment} disabled={isPending}>
              {isPending ? "Submitting…" : "Submit Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog (Faculty only) */}
      {canCreate && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Create Assignment
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreateAssignment)} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Assignment title" {...register("title")} className={errors.title ? "border-destructive" : ""} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Describe the assignment..."
                  className="min-h-[80px] resize-none"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select onValueChange={(v) => setValue("subjectId", v)}>
                    <SelectTrigger className={errors.subjectId ? "border-destructive" : ""}>
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
                  <Label>Priority</Label>
                  <Select defaultValue="MEDIUM" onValueChange={(v) => setValue("priority", v as AssignmentFormData["priority"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="datetime-local" {...register("dueDate")} className={errors.dueDate ? "border-destructive" : ""} />
                </div>
                <div className="space-y-2">
                  <Label>Max Marks</Label>
                  <Input type="number" defaultValue={100} {...register("maxMarks")} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}