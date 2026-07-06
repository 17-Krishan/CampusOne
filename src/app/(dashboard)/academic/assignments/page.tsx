import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { AssignmentsClient } from "@/components/academic/assignments-client";

export const metadata: Metadata = { title: "Assignments" };

export default async function AssignmentsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  const [assignments, subjects] = await Promise.all([
    prisma.assignment.findMany({
      where: { assignedTo: { some: { id: user.id } } },
      include: {
        subject: true,
        submissions: { where: { userId: user.id } },
        creator: { include: { profile: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.subject.findMany({
      where: user.profile?.branch ? { branch: user.profile.branch } : undefined,
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AssignmentsClient
      assignments={assignments}
      subjects={subjects}
      userId={user.id}
      userRole={user.role}
    />
  );
}