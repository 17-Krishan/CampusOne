import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { quizSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const difficulty = searchParams.get("difficulty");

    const quizzes = await prisma.quiz.findMany({
      where: {
        isPublic: true,
        ...(subjectId && { subjectId }),
        ...(difficulty && { difficulty: difficulty as any }),
      },
      include: {
        subject: true,
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: quizzes });
  } catch (err) {
    console.error("[GET /api/quiz]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        subjectId: parsed.data.subjectId ?? null,
        difficulty: parsed.data.difficulty,
        timeLimit: parsed.data.timeLimit,
        isPublic: parsed.data.isPublic,
      },
    });

    return NextResponse.json({ data: quiz }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quiz]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}