"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Zap, Trophy, Clock, BookOpen, Star, TrendingUp,
  Play, Users, Target, Medal, Search, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { cn, formatPercentage, formatTimeAgo, getInitials } from "@/lib/utils";

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimit: number;
  subject: { name: string; code: string } | null;
  _count: { questions: number; attempts: number };
};

type QuizAttempt = {
  id: string;
  score: number;
  totalMarks: number;
  timeTaken: number | null;
  completedAt: Date;
  quiz: Quiz & { subject: { name: string } | null };
};

type LeaderboardEntry = {
  userId: string;
  averagePercentage: number;
  attemptCount: number;
  user?: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    } | null;
  };
};

interface QuizClientProps {
  quizzes: Quiz[];
  recentAttempts: QuizAttempt[];
  leaderboard: LeaderboardEntry[];
  userId: string;
}

const DIFFICULTY_COLOR = {
  EASY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  HARD: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function QuizClient({ quizzes, recentAttempts, leaderboard, userId }: QuizClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("all");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  const filtered = quizzes.filter((q) => {
    const matchSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.name.toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === "all" || q.difficulty === diffFilter;
    return matchSearch && matchDiff;
  });

  const totalAttempts = recentAttempts.length;
  const avgScore =
    totalAttempts > 0
      ? recentAttempts.reduce((s, a) => s + (a.score / a.totalMarks) * 100, 0) /
        totalAttempts
      : 0;
  const bestScore =
    totalAttempts > 0
      ? Math.max(...recentAttempts.map((a) => (a.score / a.totalMarks) * 100))
      : 0;

  if (activeQuiz) {
    return (
      <QuizPlayer
        quiz={activeQuiz}
        userId={userId}
        onBack={() => {
          startTransition(() => {
            router.refresh();
            setActiveQuiz(null);
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Quiz Arena
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Test your knowledge, battle peers, climb the leaderboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Quizzes Taken", value: totalAttempts, icon: Target, color: "text-primary" },
          { label: "Avg Score", value: avgScore > 0 ? formatPercentage(avgScore) : "—", icon: TrendingUp, color: "text-emerald-500" },
          { label: "Best Score", value: bestScore > 0 ? formatPercentage(bestScore) : "—", icon: Star, color: "text-amber-500" },
          { label: "Available", value: quizzes.length, icon: BookOpen, color: "text-violet-500" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Quizzes</TabsTrigger>
          <TabsTrigger value="history">My History</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Browse */}
        <TabsContent value="browse" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search quizzes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={diffFilter} onValueChange={setDiffFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No quizzes found</p>
              <p className="text-sm text-muted-foreground mt-1">Try different filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <Badge className={cn("text-[10px]", DIFFICULTY_COLOR[quiz.difficulty])}>
                        {quiz.difficulty.toLowerCase()}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2">{quiz.title}</h3>
                      {quiz.subject && (
                        <p className="text-xs text-muted-foreground mt-0.5">{quiz.subject.name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {quiz._count.questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(quiz.timeLimit / 60)} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {quiz._count.attempts}
                      </span>
                    </div>

                    <Button
                      className="w-full gap-2"
                      size="sm"
                      onClick={() => setActiveQuiz(quiz)}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          {recentAttempts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No attempts yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start a quiz to see your history.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => {
                const pct = (attempt.score / attempt.totalMarks) * 100;
                const passed = pct >= 60;
                return (
                  <div
                    key={attempt.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-all"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      passed ? "bg-emerald-500/10" : "bg-red-500/10"
                    )}>
                      {passed
                        ? <Trophy className="w-5 h-5 text-emerald-500" />
                        : <Target className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attempt.quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.quiz.subject?.name} · {formatTimeAgo(attempt.completedAt)}
                      </p>
                      <Progress
                        value={pct}
                        className="h-1.5 mt-2"
                        indicatorClassName={passed ? "bg-emerald-500" : "bg-red-500"}
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-lg font-bold font-display", passed ? "text-emerald-500" : "text-red-500")}>
                        {formatPercentage(pct, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.score}/{attempt.totalMarks}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Top Students
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No data yet.</p>
              ) : (
                leaderboard.map((entry, idx) => {
                  const profile = entry.user?.profile;
                  const name = profile
                    ? `${profile.firstName} ${profile.lastName}`
                    : "Unknown";
                  const initials = getInitials(profile?.firstName ?? "?", profile?.lastName);
                  const avg = entry.averagePercentage;
                  const isMe = entry.userId === userId;

                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl",
                        isMe && "bg-primary/5 border border-primary/20",
                        idx === 0 && "bg-amber-500/5"
                      )}
                    >
                      <div className="w-8 text-center font-bold font-display shrink-0">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (
                          <span className="text-sm text-muted-foreground">{idx + 1}</span>
                        )}
                      </div>
                      <Avatar className="w-8 h-8 shrink-0">
                        {profile?.avatar && <AvatarImage src={profile.avatar} />}
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {name} {isMe && <span className="text-primary text-xs">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.attemptCount} quizzes</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">{formatPercentage(avg, 0)}</p>
                        <p className="text-[11px] text-muted-foreground">avg score</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}