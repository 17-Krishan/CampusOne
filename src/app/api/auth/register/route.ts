import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { signUpSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      firstName,
      lastName,
      rollNumber,
      branch,
      semester,
      college,
    } = parsed.data;

    const supabase = await createSupabaseServerClient();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Check if user already exists (e.g. re-registering unverified account)
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: authData.user.id },
    });

    if (!existingUser) {
      // Create user in our database
      await prisma.user.create({
        data: {
          supabaseId: authData.user.id,
          email,
          role: "STUDENT",
          profile: {
            create: {
              firstName,
              lastName,
              displayName: `${firstName} ${lastName}`,
              rollNumber: rollNumber || undefined,
              branch: branch || undefined,
              semester: semester || undefined,
              college: college || undefined,
            },
          },
        },
      });
    }

    return NextResponse.json({
      message:
        "Account created successfully. Please check your email to verify your account.",
      requiresVerification: !authData.session,
    });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}