import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

const INTERVIEW_PROMPTS: Record<string, string> = {
  HR: `You are a professional HR interviewer at a top tech company. Ask one question at a time. 
Start with introductions, then cover: background, strengths/weaknesses, career goals, salary expectations, why this company.
After each answer, give brief feedback (1 sentence) and a score out of 10. Then ask the next question.
Keep a professional yet friendly tone. Return JSON: { "question": string, "feedbackOnLastAnswer"?: string, "scoreForLastAnswer"?: number }`,

  TECHNICAL: `You are a senior software engineer conducting a technical interview. Ask one question at a time.
Cover: data structures, algorithms, system design, OOP concepts, databases, or specific language questions.
After each answer, provide technical feedback and scoring. 
Return JSON: { "question": string, "feedbackOnLastAnswer"?: string, "scoreForLastAnswer"?: number }`,

  BEHAVIORAL: `You are an experienced interviewer conducting a behavioral interview using STAR method.
Ask situational questions: teamwork, conflict resolution, leadership, handling failure, meeting deadlines.
After each answer, evaluate the STAR method usage and give a score.
Return JSON: { "question": string, "feedbackOnLastAnswer"?: string, "scoreForLastAnswer"?: number }`,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { type, action, answer, sessionId, history } = await request.json();

    const systemPrompt = INTERVIEW_PROMPTS[type] ?? INTERVIEW_PROMPTS.HR;

    function parseGeminiJson(text: string) {
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      return JSON.parse(cleaned);
    }

    if (action === "start") {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemPrompt}
                        Start the interview.
                        Ask your first question.`,
        config: {
          responseMimeType: "application/json",
        },
      });

      const raw = response.text;

      if (!raw) {
        throw new Error("No response from Gemini");
      }

      const data = parseGeminiJson(raw);

      // Create session in DB
      // const session = await prisma.interviewSession.create({
      //   data: {
      //     userId: user.id,
      //     type,
      //     questions: [],
      //   },
      // });
      if (!data.question) {
        throw new Error(
          "Failed to generate interview question"
        );
      }

      return NextResponse.json({
        question: data.question,
      });
    }

    if (action === "next") {
      const conversation = (history ?? [])
        .map((m: any) =>
          `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`
        )
        .join("\n");

      const prompt = `
        ${systemPrompt}
        Conversation so far:
        ${conversation}
        Candidate's latest answer:
        ${answer}
        Evaluate the answer.
        Provide feedback.
        Ask the next interview question.
        Return ONLY valid JSON.
        `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const raw = response.text;

      if (!raw) {
        throw new Error("No response from Gemini");
      }

      const data = parseGeminiJson(raw);

      if (!data.question) {
        throw new Error(
          "Failed to generate next question"
        );
      }

      return NextResponse.json(data);
    }

    if (action === "finish") {
      const conversation = (history ?? [])
        .map((m: any) =>
          `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`
        )
        .join("\n");

      const prompt = `
        ${systemPrompt}
        Interview Transcript:
        ${conversation}
        Candidate's final answer:
        ${answer}
        The interview is complete.
        Return ONLY this JSON:
        {
        "complete": true,
        "feedback": "2-3 sentence assessment",
        "overallScore": number,
        "confidenceScore": number,
        "communicationScore": number,
        "strengths": ["..."],
        "improvements": ["..."]
        }
        `;

      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

      const raw = response.text;

      if (!raw) {
        throw new Error("No response from Gemini");
      }

      const data = parseGeminiJson(raw);

      if (data.overallScore === undefined) {
        throw new Error(
          "Failed to generate interview evaluation"
        );
      }

      // Update session with results
      // if (sessionId) {
      //   await prisma.interviewSession.update({
      //     where: { id: sessionId },
      //     data: {
      //       overallScore: data.overallScore,
      //       confidenceScore: data.confidenceScore,
      //       communicationScore: data.communicationScore,
      //       feedback: data.feedback,
      //       completedAt: new Date(),
      //       questions: history ?? [],
      //     },
      //   });
      // }

      await prisma.interviewSession.create({
        data: {
          userId: user.id,
          type,
          overallScore: data.overallScore,
          confidenceScore: data.confidenceScore,
          communicationScore: data.communicationScore,
          feedback: data.feedback,
          completedAt: new Date(),
          questions: history ?? [],
        },
      });

      return NextResponse.json({ ...data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/ai/interview]", err);

    return NextResponse.json(
      {
        error:
          err?.message ||
          "AI interview service is currently unavailable.",
      },
      {
        status: 503,
      }
    );
  }
}