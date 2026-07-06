import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const assignmentKeys = {
  all: ["assignments"] as const,
  list: () => [...assignmentKeys.all, "list"] as const,
};

async function fetchAssignments() {
  const res = await fetch("/api/assignments");
  if (!res.ok) throw new Error("Failed to fetch assignments");
  const json = await res.json();
  return json.data;
}

export function useAssignments() {
  return useQuery({
    queryKey: assignmentKeys.list(),
    queryFn: fetchAssignments,
    staleTime: 5 * 60 * 1000,
  });
}

type SubmitPayload = { assignmentId: string; content?: string; fileUrl?: string };

async function submitAssignment({ assignmentId, ...body }: SubmitPayload) {
  const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error ?? "Submission failed");
  }
  return res.json();
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAssignment,
    onSuccess: () => {
      toast.success("Assignment submitted!");
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}