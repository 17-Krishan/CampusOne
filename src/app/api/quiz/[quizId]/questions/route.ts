import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    // Shuffle questions for each attempt
    const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5);

    return NextResponse.json({ data: shuffled });
  } catch (err) {
    console.error("[GET /api/quiz/[quizId]/questions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}