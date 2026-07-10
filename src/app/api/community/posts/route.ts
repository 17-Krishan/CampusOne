import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { POSTS_PAGE_SIZE } from "@/lib/constants";
import type { PostCategory } from "@prisma/client";

const POST_INCLUDE = {
  author: { include: { profile: true } },
  votes: { select: { userId: true, value: true } },
  _count: { select: { comments: true, votes: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category as PostCategory;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * POSTS_PAGE_SIZE,
        take: POSTS_PAGE_SIZE,
        include: POST_INCLUDE,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      total,
      page,
      pageSize: POSTS_PAGE_SIZE,
      hasNextPage: page * POSTS_PAGE_SIZE < total,
    });
  } catch (err) {
    console.error("[GET /api/community/posts]", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { title, content, category, tags, imageUrl } = await request.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        title: title.trim(),
        content: content.trim(),
        category: (category as PostCategory) ?? "GENERAL",
        tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
        imageUrl: imageUrl?.trim() || null,
      },
      include: POST_INCLUDE,
    });

    return NextResponse.json({ data: post });
  } catch (err) {
    console.error("[POST /api/community/posts]", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}