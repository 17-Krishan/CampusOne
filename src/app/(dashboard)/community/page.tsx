import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { CommunityClient } from "@/components/community/community-client";
import { POSTS_PAGE_SIZE } from "@/lib/constants";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
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

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: POSTS_PAGE_SIZE,
      include: {
        author: { include: { profile: true } },
        votes: { select: { userId: true, value: true } },
        _count: { select: { comments: true, votes: true } },
      },
    }),
    prisma.post.count(),
  ]);

  return (
    <CommunityClient
      initialPosts={posts}
      initialTotal={total}
      userId={user.id}
    />
  );
}