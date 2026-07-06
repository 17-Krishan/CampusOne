import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the quiz linked to this note
    const quiz = await prisma.quiz.findFirst({
      where: { noteId },
      include: { questions: true },
    });

    return NextResponse.json({ data: quiz?.questions ?? [] });
  } catch (err) {
    console.error("[GET /api/notes/[noteId]/quiz-questions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}