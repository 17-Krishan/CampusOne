import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const schema = z.object({ companyId: z.string().cuid() });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    // Ensure placement record exists
    const placement = await prisma.placement.upsert({
      where: { userId: user.id },
      create: { userId: user.id, status: "IN_PROGRESS" },
      update: { status: "IN_PROGRESS" },
    });

    // Check if already applied
    const existing = await prisma.placementApplication.findUnique({
      where: { placementId_companyId: { placementId: placement.id, companyId: parsed.data.companyId } },
    });
    if (existing) return NextResponse.json({ error: "Already applied to this company." }, { status: 409 });

    const application = await prisma.placementApplication.create({
      data: {
        placementId: placement.id,
        companyId: parsed.data.companyId,
        status: "APPLIED",
      },
      include: { company: true },
    });

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/placement/apply]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}