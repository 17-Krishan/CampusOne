import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { noteUploadSchema } from "@/lib/validations";
import { z } from "zod";

const createNoteSchema = noteUploadSchema.extend({
  fileUrl: z.string().min(1),
  fileSize: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/notes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const mine = searchParams.get("mine") === "true";
    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const notes = await prisma.note.findMany({
      where: {
        ...(mine ? { uploaderId: user.id } : { isPublic: true }),
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: true,
        uploader: { include: { profile: true } },
        summaries: {
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: { select: { flashcards: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ data: notes });
  } catch (err) {
    console.error("[GET /api/notes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { fileUrl, fileSize, title, description, subjectId, isPublic, tags } = parsed.data;

    // Determine file type from extension
    const ext = fileUrl.split(".").pop()?.toUpperCase() ?? "OTHER";
    const fileType = ["PDF", "PPT", "PPTX", "DOC", "DOCX", "PNG", "JPG", "JPEG", "WEBP"].includes(ext)
      ? ext === "PPTX" ? "PPT" : ext === "DOCX" ? "DOC" : ["PNG","JPG","JPEG","WEBP"].includes(ext) ? "IMAGE" : ext
      : "OTHER";

    const note = await prisma.note.create({
      data: {
        title,
        description: description ?? null,
        subjectId: subjectId ?? null,
        uploaderId: user.id,
        fileUrl,
        fileType: fileType as any,
        fileSize: fileSize ?? null,
        isPublic: isPublic ?? true,
        tags: tags ?? [],
      },
      include: {
        subject: true,
        uploader: { include: { profile: true } },
        summaries: true,
        _count: { select: { flashcards: true } },
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/notes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}