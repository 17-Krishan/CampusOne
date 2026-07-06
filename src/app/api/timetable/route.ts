import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const createTimetableSchema = z.object({
  semester: z.coerce.number().min(1).max(8),
  branch: z.string().min(1),
});

// GET /api/timetable — get active timetable for current user
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const timetable = await prisma.timetable.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        slots: {
          include: { subject: true },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    return NextResponse.json({ data: timetable });
  } catch (err) {
    console.error("[GET /api/timetable]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/timetable — create a new timetable
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const parsed = createTimetableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    // Deactivate old timetables
    await prisma.timetable.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    const timetable = await prisma.timetable.create({
      data: {
        userId: user.id,
        semester: parsed.data.semester,
        branch: parsed.data.branch,
        isActive: true,
      },
    });

    return NextResponse.json({ data: timetable }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/timetable]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}