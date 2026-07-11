import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { eventId } = await params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (new Date(event.startDate) < new Date()) {
      return NextResponse.json({ error: "This event has already ended" }, { status: 400 });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing && existing.status !== "CANCELLED") {
      return NextResponse.json({ error: "You're already registered for this event" }, { status: 409 });
    }

    const activeCount = await prisma.eventRegistration.count({
      where: { eventId, status: { in: ["REGISTERED", "ATTENDED"] } },
    });
    const isFull = event.maxAttendees ? activeCount >= event.maxAttendees : false;
    const status = isFull ? "WAITLISTED" : "REGISTERED";

    const registration = existing
      ? await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: { status },
        })
      : await prisma.eventRegistration.create({
          data: { eventId, userId: user.id, status },
        });

    return NextResponse.json({ data: registration });
  } catch (err) {
    console.error("[POST /api/events/[eventId]/register]", err);
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { eventId } = await params;

    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (!registration || registration.status === "CANCELLED") {
      return NextResponse.json({ error: "You're not registered for this event" }, { status: 404 });
    }

    const wasRegistered = registration.status === "REGISTERED";

    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });

    // Promote the earliest waitlisted registrant into the freed-up spot
    if (wasRegistered) {
      const nextInLine = await prisma.eventRegistration.findFirst({
        where: { eventId, status: "WAITLISTED" },
        orderBy: { createdAt: "asc" },
      });
      if (nextInLine) {
        await prisma.eventRegistration.update({
          where: { id: nextInLine.id },
          data: { status: "REGISTERED" },
        });
        await prisma.notification.create({
          data: {
            userId: nextInLine.userId,
            type: "EVENT",
            title: "You're off the waitlist!",
            message: "A spot opened up and you've been registered for the event.",
            data: { eventId },
          },
        });
      }
    }

    return NextResponse.json({ message: "Registration cancelled" });
  } catch (err) {
    console.error("[DELETE /api/events/[eventId]/register]", err);
    return NextResponse.json({ error: "Failed to cancel registration" }, { status: 500 });
  }
}