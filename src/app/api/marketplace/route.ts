import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { DEFAULT_PAGE_SIZE, MAX_MARKETPLACE_IMAGES } from "@/lib/constants";
import type { MarketplaceCategory, MarketplaceStatus } from "@prisma/client";

const ITEM_INCLUDE = {
  seller: { include: { profile: true } },
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
    const sellerId = searchParams.get("sellerId");
    const status = searchParams.get("status") as MarketplaceStatus | null;

    const where: Record<string, unknown> = { status: status ?? "ACTIVE" };
    if (category && category !== "all") where.category = category as MarketplaceCategory;
    if (sellerId) where.sellerId = sellerId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.marketplaceItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * DEFAULT_PAGE_SIZE,
        take: DEFAULT_PAGE_SIZE,
        include: ITEM_INCLUDE,
      }),
      prisma.marketplaceItem.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      total,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      hasNextPage: page * DEFAULT_PAGE_SIZE < total,
    });
  } catch (err) {
    console.error("[GET /api/marketplace]", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
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

    const { title, description, price, category, condition, location, images } = await request.json();

    if (!title?.trim() || typeof price !== "number" || price <= 0) {
      return NextResponse.json({ error: "Title and a valid price are required" }, { status: 400 });
    }

    const item = await prisma.marketplaceItem.create({
      data: {
        sellerId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        price,
        category: (category as MarketplaceCategory) ?? "OTHER",
        condition: condition ?? "GOOD",
        location: location?.trim() || null,
        images: Array.isArray(images) ? images.slice(0, MAX_MARKETPLACE_IMAGES) : [],
      },
      include: ITEM_INCLUDE,
    });

    return NextResponse.json({ data: item });
  } catch (err) {
    console.error("[POST /api/marketplace]", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
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

    const existing = await prisma.marketplaceItem.findUnique({ where: { id: itemId } });
    if (!existing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (existing.sellerId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own listings" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.title) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (typeof body.price === "number") data.price = body.price;
    if (body.category) data.category = body.category as MarketplaceCategory;
    if (body.condition) data.condition = body.condition;
    if (body.location !== undefined) data.location = body.location?.trim() || null;
    if (Array.isArray(body.images)) data.images = body.images.slice(0, MAX_MARKETPLACE_IMAGES);
    if (body.status) data.status = body.status as MarketplaceStatus;

    const item = await prisma.marketplaceItem.update({
      where: { id: itemId },
      data,
      include: ITEM_INCLUDE,
    });

    return NextResponse.json({ data: item });
  } catch (err) {
    console.error("[PATCH /api/marketplace]", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
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

    const existing = await prisma.marketplaceItem.findUnique({ where: { id: itemId } });
    if (!existing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (existing.sellerId !== user.id) {
      return NextResponse.json({ error: "You can only remove your own listings" }, { status: 403 });
    }

    // Soft-remove so existing chat history tied to this item (Message.itemId) stays intact
    await prisma.marketplaceItem.update({
      where: { id: itemId },
      data: { status: "REMOVED" },
    });

    return NextResponse.json({ message: "Listing removed" });
  } catch (err) {
    console.error("[DELETE /api/marketplace]", err);
    return NextResponse.json({ error: "Failed to remove listing" }, { status: 500 });
  }
}