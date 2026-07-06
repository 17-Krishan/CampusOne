import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const slotSchema = z.object({
  timetableId: z.string().cuid(),
  subjectId: z.string().cuid(),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().optional(),
  type: z.enum(["LECTURE", "LAB", "TUTORIAL"]).default("LECTURE"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const parsed = slotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    // Verify timetable belongs to user
    const timetable = await prisma.timetable.findFirst({
      where: { id: parsed.data.timetableId, userId: user.id },
    });
    if (!timetable) return NextResponse.json({ error: "Timetable not found" }, { status: 404 });

    // Check for overlap
    const overlap = await prisma.timetableSlot.findFirst({
      where: {
        timetableId: parsed.data.timetableId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
      },
    });
    if (overlap) {
      return NextResponse.json({ error: "A class already exists at this time slot." }, { status: 409 });
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        timetableId: parsed.data.timetableId,
        subjectId: parsed.data.subjectId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        room: parsed.data.room ?? null,
        type: parsed.data.type,
      },
      include: { subject: true },
    });

    return NextResponse.json({ data: slot }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/timetable/slots]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}