import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServerAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { STORAGE_BUCKETS } from "@/lib/constants";

const schema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().max(50 * 1024 * 1024),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { fileName, fileType, fileSize } = parsed.data;
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${supabaseUser.id}/${Date.now()}_${safeFileName}`;

    const adminSupabase = await createSupabaseServerAdminClient();
    const { data, error } = await adminSupabase.storage
      .from(STORAGE_BUCKETS.NOTES)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("[upload-url] Supabase error:", error);
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKETS.NOTES}/${storagePath}`;

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      fileUrl: publicUrl,
      path: storagePath,
    });
  } catch (err) {
    console.error("[POST /api/notes/upload-url]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}