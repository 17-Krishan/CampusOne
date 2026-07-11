import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { ClubsClient } from "@/components/clubs/clubs-client";

export const metadata: Metadata = { title: "Clubs & Events" };

export default async function ClubsPage() {
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

  const [clubs, events] = await Promise.all([
    prisma.club.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        _count: { select: { members: true, events: true } },
      },
    }),
    // prisma.event.findMany({
    //   where: { isPublic: true },
    //   orderBy: { startDate: "asc" },
    //   include: {
    //     club: true,
    //     registrations: true,
    //     _count: { select: { registrations: true } },
    //   },
    // }),
    prisma.event.findMany({
      where: {
        isPublic: true
      },
      orderBy: {
        startDate: "asc"
      },
      include: {
        club: true,
        registrations: {
          select: {
            userId: true,
            status: true,
          }
        }
      }
    }),
  ]);

  return <ClubsClient initialClubs={clubs} initialEvents={events} userId={user.id} />;
}