import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { LostFoundClient } from "@/components/shared/lost-found-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export const metadata: Metadata = { title: "Lost & Found" };

export default async function LostFoundPage() {
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

  const [items, total] = await Promise.all([
    prisma.lostFoundItem.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: "desc" },
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.lostFoundItem.count({ where: { isResolved: false } }),
  ]);

  // LostFoundItem has no Prisma relation to User, so reporters are resolved manually.
  const reporterIds = Array.from(new Set(items.map((i) => i.reporterId)));
  const reporters = await prisma.user.findMany({
    where: { id: { in: reporterIds } },
    include: { profile: true },
  });
  const reporterMap = new Map(reporters.map((r) => [r.id, r]));

  const itemsWithReporter = items.map((item) => ({
    ...item,
    reporter: reporterMap.get(item.reporterId) ?? null,
  }));

  return (
    <LostFoundClient
      initialItems={itemsWithReporter}
      initialTotal={total}
      userId={user.id}
    />
  );
}