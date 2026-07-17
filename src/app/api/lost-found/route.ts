import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// LostFoundItem has no Prisma relation to User (reporterId is a plain string column),
// so reporter profiles are resolved with a separate lookup rather than `include`.
async function withReporters<T extends { reporterId: string }>(items: T[]) {
  const reporterIds = Array.from(new Set(items.map((i) => i.reporterId)));
  const reporters = await prisma.user.findMany({
    where: { id: { in: reporterIds } },
    include: { profile: true },
  });
  const reporterMap = new Map(reporters.map((r) => [r.id, r]));
  return items.map((item) => ({ ...item, reporter: reporterMap.get(item.reporterId) ?? null }));
}

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
    const search = searchParams.get("search")?.trim();
    const isLostParam = searchParams.get("isLost");
    const showResolved = searchParams.get("resolved") === "true";

    const where: Record<string, unknown> = { isResolved: showResolved };
    if (isLostParam === "true") where.isLost = true;
    if (isLostParam === "false") where.isLost = false;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.lostFoundItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * DEFAULT_PAGE_SIZE,
        take: DEFAULT_PAGE_SIZE,
      }),
      prisma.lostFoundItem.count({ where }),
    ]);

    const data = await withReporters(items);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      hasNextPage: page * DEFAULT_PAGE_SIZE < total,
    });
  } catch (err) {
    console.error("[GET /api/lost-found]", err);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
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

    const { title, description, category, isLost, location, date, contactInfo, images } =
      await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const item = await prisma.lostFoundItem.create({
      data: {
        reporterId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        isLost: isLost ?? true,
        location: location?.trim() || null,
        date: date ? new Date(date) : new Date(),
        contactInfo: contactInfo?.trim() || null,
        images: Array.isArray(images) ? images.slice(0, 3) : [],
      },
    });

    const [enriched] = await withReporters([item]);

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("[POST /api/lost-found]", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });

    const existing = await prisma.lostFoundItem.findUnique({ where: { id: itemId } });
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    if (existing.reporterId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own reports" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.title) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.category !== undefined) data.category = body.category?.trim() || null;
    if (typeof body.isLost === "boolean") data.isLost = body.isLost;
    if (body.location !== undefined) data.location = body.location?.trim() || null;
    if (body.date) data.date = new Date(body.date);
    if (body.contactInfo !== undefined) data.contactInfo = body.contactInfo?.trim() || null;
    if (Array.isArray(body.images)) data.images = body.images.slice(0, 3);
    if (typeof body.isResolved === "boolean") data.isResolved = body.isResolved;

    const item = await prisma.lostFoundItem.update({ where: { id: itemId }, data });
    const [enriched] = await withReporters([item]);

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("[PATCH /api/lost-found]", err);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });

    const existing = await prisma.lostFoundItem.findUnique({ where: { id: itemId } });
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    if (existing.reporterId !== user.id) {
      return NextResponse.json({ error: "You can only remove your own reports" }, { status: 403 });
    }

    await prisma.lostFoundItem.delete({ where: { id: itemId } });

    return NextResponse.json({ message: "Report removed" });
  } catch (err) {
    console.error("[DELETE /api/lost-found]", err);
    return NextResponse.json({ error: "Failed to remove report" }, { status: 500 });
  }
}