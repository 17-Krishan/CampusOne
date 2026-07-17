import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { HostelClient } from "@/components/shared/hostel-client";

export const metadata: Metadata = { title: "Hostel" };

export default async function HostelPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profile: true },
  });

  if (!user) redirect("/login");

  const [complaints, messMenu] = await Promise.all([
    prisma.complaint.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.messMenu.findMany({
      orderBy: [{ dayOfWeek: "asc" }],
    }),
  ]);

  return <HostelClient initialComplaints={complaints} messMenu={messMenu} />;
}