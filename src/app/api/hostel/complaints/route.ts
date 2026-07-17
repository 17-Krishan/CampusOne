import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import type { ComplaintCategory, ComplaintStatus } from "@prisma/client";

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
    const status = searchParams.get("status") as ComplaintStatus | null;
    const category = searchParams.get("category") as ComplaintCategory | null;

    const complaints = await prisma.complaint.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: complaints });
  } catch (err) {
    console.error("[GET /api/hostel/complaints]", err);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
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

    const { title, description, category, roomNumber, images } = await request.json();

    if (!title?.trim() || !description?.trim() || !category) {
      return NextResponse.json(
        { error: "Title, description and category are required" },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category: category as ComplaintCategory,
        roomNumber: roomNumber?.trim() || null,
        images: Array.isArray(images) ? images.slice(0, 3) : [],
      },
    });

    return NextResponse.json({ data: complaint });
  } catch (err) {
    console.error("[POST /api/hostel/complaints]", err);
    return NextResponse.json({ error: "Failed to file complaint" }, { status: 500 });
  }
}