import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AttendanceStats } from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────
export const attendanceKeys = {
  all: ["attendance"] as const,
  stats: () => [...attendanceKeys.all, "stats"] as const,
  list: (params?: { subjectId?: string; from?: string; to?: string }) =>
    [...attendanceKeys.all, "list", params] as const,
};

// ─── Fetch attendance stats ───────────────────────────────────────────────────
async function fetchAttendanceStats(): Promise<AttendanceStats[]> {
  const res = await fetch("/api/attendance/stats");
  if (!res.ok) throw new Error("Failed to fetch attendance stats");
  const json = await res.json();
  return json.data;
}

export function useAttendanceStats() {
  return useQuery({
    queryKey: attendanceKeys.stats(),
    queryFn: fetchAttendanceStats,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// ─── Fetch attendance list ────────────────────────────────────────────────────
async function fetchAttendance(params?: {
  subjectId?: string;
  from?: string;
  to?: string;
}) {
  const url = new URL("/api/attendance", window.location.origin);
  if (params?.subjectId) url.searchParams.set("subjectId", params.subjectId);
  if (params?.from) url.searchParams.set("from", params.from);
  if (params?.to) url.searchParams.set("to", params.to);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const json = await res.json();
  return json.data;
}

export function useAttendanceList(params?: {
  subjectId?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: () => fetchAttendance(params),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mark attendance mutation ─────────────────────────────────────────────────
type MarkAttendancePayload = {
  subjectId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  date: string; // ISO string
  remarks?: string;
};

async function markAttendance(payload: MarkAttendancePayload) {
  const res = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to mark attendance");
  }

  return res.json();
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      toast.success("Attendance marked successfully!");
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}