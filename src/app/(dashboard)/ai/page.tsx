import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { AIAssistantClient } from "@/components/ai/ai-assistant-client";

export const metadata: Metadata = { title: "AI Assistant" };

export default async function AIAssistantPage() {
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

  const sessions = await prisma.aIChatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      context: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <AIAssistantClient
      sessions={sessions}
      firstName={user.profile?.firstName ?? "Student"}
    />
  );
}