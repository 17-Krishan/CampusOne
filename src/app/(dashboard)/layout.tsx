import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s · CampusOne",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profile: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}