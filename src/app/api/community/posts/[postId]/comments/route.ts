import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { truncate } from "@/lib/utils";

const COMMENT_AUTHOR_INCLUDE = { include: { profile: true } } as const;

export async function GET(
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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const [comments] = await Promise.all([
      prisma.comment.findMany({
        where: { postId, parentId: null },
        include: {
          author: COMMENT_AUTHOR_INCLUDE,
          replies: {
            include: { author: COMMENT_AUTHOR_INCLUDE },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      // Count this open as a view
      prisma.post.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } }),
    ]);

    return NextResponse.json({ data: comments });
  } catch (err) {
    console.error("[GET /api/community/posts/[postId]/comments]", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

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
    const { content, parentId } = await request.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.isLocked) {
      return NextResponse.json({ error: "This post is locked for new comments" }, { status: 403 });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: user.id,
        content: content.trim(),
        parentId: parentId ?? null,
      },
      include: { author: COMMENT_AUTHOR_INCLUDE },
    });

    if (post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "COMMUNITY",
          title: "New comment on your post",
          message: `${truncate(content.trim(), 80)}`,
          data: { postId, commentId: comment.id },
        },
      });
    }

    return NextResponse.json({ data: { ...comment, replies: [] } });
  } catch (err) {
    console.error("[POST /api/community/posts/[postId]/comments]", err);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}