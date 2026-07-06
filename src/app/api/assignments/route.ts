import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { assignmentSchema } from "@/lib/validations";

// GET /api/assignments — list assignments for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending | submitted | overdue

    const assignments = await prisma.assignment.findMany({
      where: { assignedTo: { some: { id: user.id } } },
      include: {
        subject: true,
        submissions: { where: { userId: user.id } },
        creator: { include: { profile: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ data: assignments });
  } catch (err) {
    console.error("[GET /api/assignments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/assignments — create assignment (faculty/admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== "FACULTY" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden — faculty only" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = assignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    // Find all students in the subject's branch/semester
    const subject = await prisma.subject.findUnique({ where: { id: parsed.data.subjectId } });
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        profile: {
          branch: subject.branch,
          semester: subject.semester,
        },
      },
    });

    const assignment = await prisma.assignment.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        subjectId: parsed.data.subjectId,
        creatorId: user.id,
        dueDate: new Date(parsed.data.dueDate),
        maxMarks: parsed.data.maxMarks,
        priority: parsed.data.priority,
        assignedTo: {
          connect: students.map((s) => ({ id: s.id })),
        },
      },
      include: { subject: true },
    });

    // Create notifications for all assigned students
    if (students.length > 0) {
      await prisma.notification.createMany({
        data: students.map((s) => ({
          userId: s.id,
          type: "ASSIGNMENT",
          title: "New Assignment",
          message: `${assignment.title} has been assigned in ${assignment.subject.name}`,
          data: { assignmentId: assignment.id },
        })),
      });
    }

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/assignments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}