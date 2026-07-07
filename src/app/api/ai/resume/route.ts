import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { fileUrl, name } = await request.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert ATS resume analyzer.

Analyze the resume and return ONLY a valid JSON object in this format:

{
  "atsScore": number,
  "formatting": {
    "score": number,
    "feedback": "string"
  },
  "keywords": {
    "present": ["keyword1"],
    "missing": ["keyword2"]
  },
  "skills": {
    "present": ["skill1"],
    "missing": ["skill2"]
  },
  "suggestions": [
    "suggestion1",
    "suggestion2",
    "suggestion3"
  ],
  "overallFeedback": "2-3 sentence summary"
}

Resume Name: ${name}
Resume URL: ${fileUrl}

Assume this is a typical student software engineering resume and generate a realistic ATS analysis.

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

    const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    const analysis = JSON.parse(cleaned);

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        name: name ?? "Resume",
        fileUrl,
        atsScore: analysis.atsScore,
        feedback: analysis,
        isActive: false,
      },
    });

    return NextResponse.json({
      resume,
      analysis,
    });
} catch (err) {
    console.error("[POST /api/ai/resume]", err);

    return NextResponse.json(
      { error: "Resume analysis failed" },
      { status: 500 }
    );
  }
}