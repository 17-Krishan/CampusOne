import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { userId: targetId } = await request.json();
    if (!targetId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (targetId === user.id) {
      return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already following this user" }, { status: 409 });
    }

    await prisma.follow.create({
      data: { followerId: user.id, followingId: targetId },
    });

    await prisma.notification.create({
      data: {
        userId: targetId,
        type: "SYSTEM",
        title: "New follower",
        message: "Someone started following you on CampusOne.",
        data: { followerId: user.id },
      },
    });

    return NextResponse.json({ message: "Followed" });
  } catch (err) {
    console.error("[POST /api/users/follow]", err);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { userId: targetId } = await request.json();
    if (!targetId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
    });
    if (!existing) {
      return NextResponse.json({ error: "You're not following this user" }, { status: 404 });
    }

    await prisma.follow.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "Unfollowed" });
  } catch (err) {
    console.error("[DELETE /api/users/follow]", err);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}