import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { clubId } = await params;

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club || !club.isActive) return NextResponse.json({ error: "Club not found" }, { status: 404 });

    const existing = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already a member of this club" }, { status: 409 });
    }

    const member = await prisma.clubMember.create({
      data: { clubId, userId: user.id, role: "MEMBER" },
      include: { user: { include: { profile: true } } },
    });

    return NextResponse.json({ data: member });
  } catch (err) {
    console.error("[POST /api/clubs/[clubId]/join]", err);
    return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { clubId } = await params;

    const membership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "You're not a member of this club" }, { status: 404 });
    }

    if (membership.role === "ADMIN") {
      const adminCount = await prisma.clubMember.count({ where: { clubId, role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "You're the only admin — promote another member before leaving" },
          { status: 400 }
        );
      }
    }

    await prisma.clubMember.delete({ where: { id: membership.id } });

    return NextResponse.json({ message: "Left club" });
  } catch (err) {
    console.error("[DELETE /api/clubs/[clubId]/join]", err);
    return NextResponse.json({ error: "Failed to leave club" }, { status: 500 });
  }
}