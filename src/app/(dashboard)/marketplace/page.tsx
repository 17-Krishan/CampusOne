import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export const metadata: Metadata = { title: "Marketplace" };

export default async function MarketplacePage() {
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
    prisma.marketplaceItem.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: DEFAULT_PAGE_SIZE,
      include: { seller: { include: { profile: true } } },
    }),
    prisma.marketplaceItem.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <MarketplaceClient
      initialItems={items}
      initialTotal={total}
      userId={user.id}
    />
  );
}