import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert user in our DB for OAuth sign-ins
      const existingUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
      });

      if (!existingUser) {
        const email = data.user.email ?? "";
        const fullName =
          data.user.user_metadata?.full_name ??
          data.user.user_metadata?.name ??
          email.split("@")[0];
        const [firstName, ...lastParts] = fullName.split(" ");
        const lastName = lastParts.join(" ") || "";
        const avatar =
          data.user.user_metadata?.avatar_url ??
          data.user.user_metadata?.picture ??
          null;

        await prisma.user.create({
          data: {
            supabaseId: data.user.id,
            email,
            role: "STUDENT",
            profile: {
              create: {
                firstName: firstName ?? "User",
                lastName: lastName || undefined,
                displayName: fullName,
                avatar: avatar,
              },
            },
          },
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}