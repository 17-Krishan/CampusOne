import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

const CLUB_INCLUDE = {
  members: { include: { user: { include: { profile: true } } } },
  _count: { select: { members: true, events: true } },
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
    const category = searchParams.get("category");

    const clubs = await prisma.club.findMany({
      where: {
        isActive: true,
        ...(category && category !== "all" ? { category } : {}),
      },
      orderBy: { name: "asc" },
      include: CLUB_INCLUDE,
    });

    return NextResponse.json({ data: clubs });
  } catch (err) {
    console.error("[GET /api/clubs]", err);
    return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
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

    const { name, description, category, logo, banner } = await request.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 });
    }

    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        logo: logo?.trim() || null,
        banner: banner?.trim() || null,
        // Creator automatically becomes the club admin
        members: {
          create: { userId: user.id, role: "ADMIN" },
        },
      },
      include: CLUB_INCLUDE,
    });

    return NextResponse.json({ data: club });
  } catch (err) {
    console.error("[POST /api/clubs]", err);
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 });
  }
}