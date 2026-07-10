import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { GoogleGenAI } from "@google/genai";
import { truncate } from "@/lib/utils";
import type { AIChatMessage } from "@/types";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

const SYSTEM_PROMPT = `You are the AI Assistant inside CampusOne, an AI-powered campus operating system for college students.
You help students with academics (attendance, assignments, subjects), career guidance, resume/interview prep, quizzes, campus life (clubs, events, hostel, marketplace) and general study questions.
Be concise, friendly, and practical. Use short paragraphs or markdown-style bullet points when listing things. Never invent specific data about the student (grades, attendance numbers, deadlines) that you were not given — instead tell them where to check it inside the app.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { sessionId, message, context } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let session = null as Awaited<ReturnType<typeof prisma.aIChatSession.findUnique>> | null;
    let existingMessages: AIChatMessage[] = [];

    if (sessionId) {
      session = await prisma.aIChatSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== user.id) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      existingMessages = (session.messages as unknown as AIChatMessage[]) ?? [];
    }

    const historyText = existingMessages
      .map((m) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const prompt = `${SYSTEM_PROMPT}
${context ? `\nThe student is currently on the "${context}" section of the app.` : ""}
${historyText ? `\nConversation so far:\n${historyText}` : ""}

Student: ${message}

Respond as the Assistant.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const reply = response.text;
    if (!reply) throw new Error("No response from Gemini");

    const nowUser = new Date().toISOString();
    const newMessages: AIChatMessage[] = [
      ...existingMessages,
      { role: "user", content: message, createdAt: nowUser },
      { role: "assistant", content: reply, createdAt: new Date().toISOString() },
    ];

    if (session) {
      session = await prisma.aIChatSession.update({
        where: { id: session.id },
        data: { messages: newMessages as any },
      });
    } else {
      session = await prisma.aIChatSession.create({
        data: {
          userId: user.id,
          title: truncate(message, 40),
          messages: newMessages as any,
          context: context ?? null,
        },
      });
    }

    return NextResponse.json({
      data: {
        sessionId: session.id,
        title: session.title,
        message: reply,
      },
    });
  } catch (err) {
    console.error("[POST /api/ai/chat]", err);
    return NextResponse.json({ error: "AI assistant failed to respond" }, { status: 500 });
  }
}