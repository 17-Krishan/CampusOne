import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { TimetableClient } from "@/components/academic/timetable-client";

export const metadata: Metadata = { title: "Timetable" };

export default async function TimetablePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profile: true },
  });

  if (!user) redirect("/login");

  // Get active timetable with slots
  const timetable = await prisma.timetable.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      slots: {
        include: { subject: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  // All subjects for this user's branch/semester
  const subjects = await prisma.subject.findMany({
    where: user.profile?.branch ? { branch: user.profile.branch } : undefined,
    orderBy: { name: "asc" },
  });

  return (
    <TimetableClient
      timetable={timetable}
      subjects={subjects}
      userId={user.id}
      semester={user.profile?.semester ?? 1}
      branch={user.profile?.branch ?? ""}
    />
  );
}