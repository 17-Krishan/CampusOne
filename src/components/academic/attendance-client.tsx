"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  cn,
  formatPercentage,
  getAttendanceBgColor,
  formatDate,
} from "@/lib/utils";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { AttendanceStats, Subject, Attendance } from "@/types";

interface AttendanceClientProps {
  initialStats: AttendanceStats[];
  subjects: Subject[];
  userId: string;
  recentRecords: (Attendance & { subject: Subject })[];
}

export function AttendanceClient({
  initialStats,
  subjects,
  userId,
  recentRecords,
}: AttendanceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [markOpen, setMarkOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("PRESENT");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const stats = initialStats;
  const overallAvg =
    stats.length > 0
      ? stats.reduce((sum, s) => sum + s.percentage, 0) / stats.length
      : 0;

  const dangerCount = stats.filter((s) => s.status === "DANGER").length;
  const safeCount = stats.filter((s) => s.status === "SAFE").length;

  async function handleMarkAttendance() {
    if (!selectedSubject || !selectedStatus) {
      toast.error("Please select a subject and status.");
      return;
    }

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubject,
          status: selectedStatus,
          date: new Date(selectedDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to mark attendance.");
        return;
      }

      toast.success("Attendance marked successfully!");
      setMarkOpen(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  // Chart data
  const chartData = stats.map((s) => ({
    name: s.subject.code ?? s.subject.name.slice(0, 8),
    percentage: Math.round(s.percentage),
    fill:
      s.status === "SAFE"
        ? "#10b981"
        : s.status === "WARNING"
        ? "#f59e0b"
        : "#ef4444",
  }));

  const statusIcon = {
    PRESENT: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    ABSENT: <XCircle className="w-4 h-4 text-red-500" />,
    LATE: <Clock className="w-4 h-4 text-amber-500" />,
    EXCUSED: <CalendarCheck className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Attendance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your attendance across all subjects
          </p>
        </div>
        <Button onClick={() => setMarkOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Mark Attendance
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Overall Avg</p>
          <p className="text-2xl font-display font-bold gradient-text">
            {overallAvg > 0 ? formatPercentage(overallAvg, 1) : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Subjects</p>
          <p className="text-2xl font-display font-bold">{stats.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Safe</p>
          <p className="text-2xl font-display font-bold text-emerald-500">
            {safeCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">At Risk</p>
          <p className="text-2xl font-display font-bold text-red-500">
            {dangerCount}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* By Subject */}
        <TabsContent value="subjects" className="mt-4">
          {stats.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No attendance data yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click &quot;Mark Attendance&quot; to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {stats
                .sort((a, b) => a.percentage - b.percentage)
                .map((stat) => (
                  <Card
                    key={stat.subject.id}
                    className={cn(
                      "transition-all hover:shadow-md",
                      stat.status === "DANGER" &&
                        "border-red-200 dark:border-red-900"
                    )}
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{stat.subject.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {stat.subject.code}
                            {stat.subject.facultyName &&
                              ` · ${stat.subject.facultyName}`}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs",
                            getAttendanceBgColor(stat.status)
                          )}
                        >
                          {formatPercentage(stat.percentage, 1)}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {stat.attendedClasses}/{stat.totalClasses} classes
                          </span>
                          <span>75% required</span>
                        </div>
                        <Progress
                          value={stat.percentage}
                          className="h-2"
                          indicatorClassName={cn(
                            stat.status === "SAFE" && "bg-emerald-500",
                            stat.status === "WARNING" && "bg-amber-500",
                            stat.status === "DANGER" && "bg-red-500"
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        {stat.safeBunks > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            Can miss {stat.safeBunks} more class
                            {stat.safeBunks > 1 ? "es" : ""}
                          </span>
                        ) : stat.status === "DANGER" ? (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            Attend all classes immediately
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-500">
                            <AlertTriangle className="w-3 h-3" />
                            At minimum threshold
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Subject-wise Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No data to display yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Attendance"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        fontSize: "12px",
                      }}
                    />
                    {/* 75% threshold line */}
                    <Bar
                      dataKey="percentage"
                      radius={[4, 4, 0, 0]}
                      fill="#6272f1"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Records</CardTitle>
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No records yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                    >
                      {statusIcon[record.status]}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {record.subject.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.subject.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            record.status === "PRESENT"
                              ? "success"
                              : record.status === "ABSENT"
                              ? "danger"
                              : record.status === "LATE"
                              ? "warning"
                              : "info"
                          }
                          className="text-[10px] capitalize"
                        >
                          {record.status.toLowerCase()}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(record.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Attendance Dialog */}
      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Mark Attendance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select onValueChange={setSelectedSubject}>
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
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all",
                      selectedStatus === status
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    {statusIcon[status as keyof typeof statusIcon]}
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAttendance}
              disabled={isPending || !selectedSubject}
            >
              {isPending ? "Saving…" : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}