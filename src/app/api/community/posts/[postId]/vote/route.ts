import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { postId } = await params;
    const { value } = await request.json();

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "value must be 1 or -1" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await prisma.postVote.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing) {
      if (existing.value === value) {
        // Same vote again → remove it (toggle off)
        await prisma.postVote.delete({ where: { id: existing.id } });
      } else {
        await prisma.postVote.update({ where: { id: existing.id }, data: { value } });
      }
    } else {
      await prisma.postVote.create({ data: { postId, userId: user.id, value } });
    }

    const votes = await prisma.postVote.findMany({
      where: { postId },
      select: { userId: true, value: true },
    });

    return NextResponse.json({ data: { votes } });
  } catch (err) {
    console.error("[POST /api/community/posts/[postId]/vote]", err);
    return NextResponse.json({ error: "Failed to register vote" }, { status: 500 });
  }
}