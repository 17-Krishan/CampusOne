import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { QuizClient } from "@/components/quiz/quiz-client";

export const metadata: Metadata = { title: "Quiz Arena" };

export default async function QuizPage() {
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

  const [quizzes, recentAttempts, allAttempts] = await Promise.all([
    prisma.quiz.findMany({
      where: { isPublic: true },
      include: {
        subject: true,
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),

    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      include: { quiz: { include: { subject: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),

    prisma.quizAttempt.findMany({
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    }),
  ]);

  const leaderboardMap = new Map();

  for (const attempt of allAttempts) {
    const percentage = (attempt.score / attempt.totalMarks) * 100;

    if (!leaderboardMap.has(attempt.userId)) {
      leaderboardMap.set(attempt.userId, {
        userId: attempt.userId,
        user: attempt.user,
        totalPercentage: 0,
        attemptCount: 0,
      });
    }

    const entry = leaderboardMap.get(attempt.userId);

    entry.totalPercentage += percentage;
    entry.attemptCount++;
  }

  const enrichedLeaderboard = Array.from(leaderboardMap.values())
    .map((entry) => ({
      userId: entry.userId,
      user: entry.user,
      averagePercentage: entry.totalPercentage / entry.attemptCount,
      attemptCount: entry.attemptCount,
    }))
    .sort((a, b) => b.averagePercentage - a.averagePercentage)
    .slice(0, 10);

  return (
    <QuizClient
      quizzes={quizzes as any}
      recentAttempts={recentAttempts as any}
      leaderboard={enrichedLeaderboard as any}
      userId={user.id}
    />
  );
}