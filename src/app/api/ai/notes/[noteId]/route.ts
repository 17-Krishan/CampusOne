import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});


const SYSTEM_PROMPT = `You are an expert academic assistant. Analyze the provided note content and return a JSON object with:
{
  "summary": "A concise 200-300 word summary in HTML format using <p>, <h3>, <ul>, <li> tags",
  "keyConcepts": "HTML formatted list of 5-10 key concepts/topics covered",
  "flashcards": [{"question": "...", "answer": "..."}] (10-15 cards),
  "quizQuestions": [{"question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..."}] (5-10 MCQs),
  "vivaQuestions": "HTML formatted Q&A pairs for viva/interview (5-8 questions)",
  "revisionNotes": "HTML formatted 100-word quick revision notes"
}
Return ONLY a valid JSON object.
Do not use markdown.
Do not wrap the JSON inside markdown code blocks.
Do not add explanations.
Return raw JSON only.`;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const note = await prisma.note.findFirst({
      where: { id: noteId, uploaderId: user.id },
      include: { subject: true },
    });
    if (!note) return NextResponse.json({ error: "Note not found or access denied" }, { status: 404 });

    // For now, use the note title + subject as context.
    // In production, you'd fetch + parse the actual PDF content.
    const context = `Title: ${note.title} 
    ${note.subject ? `Subject: ${note.subject.name} (${note.subject.code})` : ""} ${note.description ? `Description: ${note.description}` : ""} Tags: ${note.tags.join(", ")} 
    Please generate comprehensive study materials for this note.
    `.trim();

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${SYSTEM_PROMPT}\n\n${context}`,
    });

    const raw = response.text;

    if (!raw) {
        throw new Error("No response from Gemini");
    }

    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleaned);

    // Delete old summaries + flashcards + quiz
    await prisma.noteSummary.deleteMany({ where: { noteId } });
    await prisma.flashcard.deleteMany({ where: { noteId } });
    const oldQuiz = await prisma.quiz.findFirst({ where: { noteId } });
    if (oldQuiz) {
      await prisma.quizQuestion.deleteMany({ where: { quizId: oldQuiz.id } });
      await prisma.quiz.delete({ where: { id: oldQuiz.id } });
    }

    // Save summaries
    const summaries = await Promise.all([
      prisma.noteSummary.create({ data: { noteId, type: "SUMMARY", content: result.summary ?? "" } }),
      prisma.noteSummary.create({ data: { noteId, type: "KEY_CONCEPTS", content: result.keyConcepts ?? "" } }),
      prisma.noteSummary.create({ data: { noteId, type: "VIVA_QUESTIONS", content: result.vivaQuestions ?? "" } }),
      prisma.noteSummary.create({ data: { noteId, type: "REVISION", content: result.revisionNotes ?? "" } }),
    ]);

    // Save flashcards
    if (Array.isArray(result.flashcards) && result.flashcards.length > 0) {
      await prisma.flashcard.createMany({
        data: result.flashcards.map((f: { question: string; answer: string }) => ({
          noteId,
          question: f.question,
          answer: f.answer,
        })),
      });
    }

    // Save quiz + questions
    if (Array.isArray(result.quizQuestions) && result.quizQuestions.length > 0) {
      const quiz = await prisma.quiz.create({
        data: {
          title: `${note.title} — Quiz`,
          noteId,
          subjectId: note.subjectId ?? undefined,
          isPublic: false,
        },
      });
      await prisma.quizQuestion.createMany({
        data: result.quizQuestions.map((q: {
          question: string;
          options: string[];
          correctAnswer: string;
          explanation: string;
        }) => ({
          quizId: quiz.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
        })),
      });
    }

    return NextResponse.json({
      message: "AI content generated successfully",
      summaries,
    });
  } catch (err) {
    console.error("[POST /api/ai/notes/[noteId]]", err);
    return NextResponse.json({ error: "AI processing failed. Please try again." }, { status: 500 });
  }
}