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

    const flashcards = await prisma.flashcard.findMany({
      where: { noteId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: flashcards });
  } catch (err) {
    console.error("[GET /api/notes/[noteId]/flashcards]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}