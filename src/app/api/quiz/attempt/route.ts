import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const attemptSchema = z.object({
  quizId: z.string().cuid(),
  answers: z.record(z.string(), z.string()),
  score: z.number(),
  totalMarks: z.number(),
  timeTaken: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const parsed = attemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: parsed.data.quizId,
        userId: user.id,
        answers: parsed.data.answers,
        score: parsed.data.score,
        totalMarks: parsed.data.totalMarks,
        timeTaken: parsed.data.timeTaken ?? null,
      },
    });

    return NextResponse.json({ data: attempt }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quiz/attempt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}