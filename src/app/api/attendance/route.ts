import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { attendanceSchema } from "@/lib/validations";

// GET /api/attendance — list attendance for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const records = await prisma.attendance.findMany({
      where: {
        userId: user.id,
        ...(subjectId && { subjectId }),
        ...(from || to
          ? {
              date: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            }
          : {}),
      },
      include: { subject: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ data: records });
  } catch (err) {
    console.error("[GET /api/attendance]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/attendance — create or update attendance record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = attendanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subjectId, date, status, remarks } = parsed.data;
    const attendanceDate = new Date(date);

    // Normalize to start of day
    attendanceDate.setHours(0, 0, 0, 0);

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Upsert — allow updating same-day record
    const record = await prisma.attendance.upsert({
      where: {
        userId_subjectId_date: {
          userId: user.id,
          subjectId,
          date: attendanceDate,
        },
      },
      create: {
        userId: user.id,
        subjectId,
        date: attendanceDate,
        status,
        remarks: remarks ?? undefined,
      },
      update: {
        status,
        remarks: remarks ?? undefined,
      },
      include: { subject: true },
    });

    return NextResponse.json(
      { data: record, message: "Attendance marked successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/attendance]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}