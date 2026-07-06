import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { slotId } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify slot belongs to user via timetable
    const slot = await prisma.timetableSlot.findFirst({
      where: { id: slotId, timetable: { userId: user.id } },
    });
    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    await prisma.timetableSlot.delete({ where: { id: slotId } });

    return NextResponse.json({ message: "Slot deleted" });
  } catch (err) {
    console.error("[DELETE /api/timetable/slots/[slotId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}