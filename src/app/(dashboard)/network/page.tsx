import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { NetworkClient } from "@/components/shared/network-client";

export const metadata: Metadata = { title: "Network" };

export default async function NetworkPage() {
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

  const [users, myFollowing, followerCounts, followingCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: user.id }, role: "STUDENT" },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    }),
    // Follow.followerId == me → people I follow (the "follower" relation name on
    // the Follow model is misleading here — it just maps to the followerId column)
    prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }),
    // How many people follow each user
    prisma.follow.groupBy({ by: ["followingId"], _count: { followingId: true } }),
    // How many people each user follows
    prisma.follow.groupBy({ by: ["followerId"], _count: { followerId: true } }),
  ]);

  const followingIds = new Set(myFollowing.map((f) => f.followingId));
  const followerCountMap = new Map(followerCounts.map((f) => [f.followingId, f._count.followingId]));
  const followingCountMap = new Map(followingCounts.map((f) => [f.followerId, f._count.followerId]));

  const usersWithState = users.map((u) => ({
    ...u,
    isFollowing: followingIds.has(u.id),
    followerCount: followerCountMap.get(u.id) ?? 0,
    followingCount: followingCountMap.get(u.id) ?? 0,
  }));

  return (
    <NetworkClient
      initialUsers={usersWithState}
      myFollowerCount={followerCountMap.get(user.id) ?? 0}
      myFollowingCount={followingIds.size}
    />
  );
}