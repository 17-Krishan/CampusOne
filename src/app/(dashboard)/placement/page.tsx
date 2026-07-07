import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { PlacementClient } from "@/components/placement/placement-client";

export const metadata: Metadata = { title: "Placement Hub" };

export default async function PlacementPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  const [companies, placement, resumes, interviewSessions] = await Promise.all([
    prisma.company.findMany({
        where: user.profile?.branch
            ? {
                allowedBranches: {
                    has: user.profile.branch,
                },
            }
            : undefined,
        orderBy: { createdAt: "desc" },
    }),
    prisma.placement.findUnique({
      where: { userId: user.id },
      include: {
        applications: { include: { company: true } },
      },
    }),
    prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <PlacementClient
      companies={companies as any}
      placement={placement as any}
      resumes={resumes}
      interviewSessions={interviewSessions as any}
      userId={user.id}
      profile={user.profile}
    />
  );
}