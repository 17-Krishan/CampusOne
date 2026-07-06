import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const submitSchema = z.object({
  content: z.string().max(10000).optional(),
  fileUrl: z.string().url().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify assignment exists and user is assigned
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        assignedTo: { some: { id: user.id } },
      },
    });
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    // Upsert submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: user.id } },
      create: {
        assignmentId,
        userId: user.id,
        content: parsed.data.content ?? null,
        fileUrl: parsed.data.fileUrl ?? null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      update: {
        content: parsed.data.content ?? null,
        fileUrl: parsed.data.fileUrl ?? null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ data: submission, message: "Assignment submitted successfully" });
  } catch (err) {
    console.error("[POST /api/assignments/[assignmentId]/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}