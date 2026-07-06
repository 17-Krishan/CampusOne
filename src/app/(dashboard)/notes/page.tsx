import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { NotesClient } from "@/components/notes/notes-client";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  const [notes, subjects] = await Promise.all([
    prisma.note.findMany({
      where: { isPublic: true },
      include: {
        subject: true,
        uploader: { include: { profile: true } },
        summaries: {
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: { select: { flashcards: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.subject.findMany({
      where: user.profile?.branch ? { branch: user.profile.branch } : undefined,
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <NotesClient
      initialNotes={notes as any}
      subjects={subjects}
      userId={user.id}
    />
  );
}