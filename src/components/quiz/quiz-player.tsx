"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, ChevronRight,
  Trophy, Target, RotateCcw, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPercentage } from "@/lib/utils";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  marks: number;
};

type Quiz = {
  id: string;
  title: string;
  timeLimit: number;
  difficulty: string;
  _count: { questions: number };
};

interface QuizPlayerProps {
  quiz: Quiz;
  userId: string;
  onBack: () => void;
}

type Phase = "loading" | "playing" | "results";

export function QuizPlayer({ quiz, userId, onBack }: QuizPlayerProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit);
  const [startTime, setStartTime] = useState<number>(0);
  const [results, setResults] = useState<{
    score: number;
    totalMarks: number;
    timeTaken: number;
    correctCount: number;
  } | null>(null);

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`/api/quiz/${quiz.id}/questions`);
        const data = await res.json();
        if (data.data?.length > 0) {
          setQuestions(data.data);
          setPhase("playing");
          setStartTime(Date.now());
        } else {
          toast.error("No questions available for this quiz.");
          onBack();
        }
      } catch {
        toast.error("Failed to load quiz questions.");
        onBack();
      }
    }
    loadQuestions();
  }, [quiz.id, onBack]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      submitQuiz();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const submitQuiz = useCallback(async () => {
    if (phase !== "playing") return;

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    let score = 0;
    let correctCount = 0;
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) {
        score += q.marks;
        correctCount++;
      }
    }

    try {
      await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          score,
          totalMarks,
          timeTaken,
        }),
      });
    } catch {
      // optional toast
    }

    setResults({
      score,
      totalMarks,
      timeTaken,
      correctCount,
    });

    setPhase("results");
  }, [phase, startTime, questions, answers, quiz.id]);

  function selectAnswer(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      submitQuiz();
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeWarning = timeLeft < 60;
  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  // ── Loading ──
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium">Loading quiz…</p>
        </div>
      </div>
    );
  }

  // ── Results ──
  if (phase === "results" && results) {
    const pct = (results.score / results.totalMarks) * 100;
    const passed = pct >= 60;
    const mins = Math.floor(results.timeTaken / 60);
    const secs = results.timeTaken % 60;

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center py-6 space-y-4">
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg",
            passed ? "bg-emerald-500/10" : "bg-red-500/10"
          )}>
            {passed
              ? <Trophy className="w-10 h-10 text-emerald-500" />
              : <Target className="w-10 h-10 text-red-500" />}
          </div>
          <div>
            <p className={cn("text-5xl font-display font-bold", passed ? "text-emerald-500" : "text-red-500")}>
              {formatPercentage(pct, 0)}
            </p>
            <p className="text-lg font-semibold mt-1">{passed ? "Great job! 🎉" : "Keep practising!"}</p>
            <p className="text-muted-foreground text-sm">{quiz.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Score", value: `${results.score}/${results.totalMarks}` },
            { label: "Correct", value: `${results.correctCount}/${questions.length}` },
            { label: "Time", value: `${mins}m ${secs}s` },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <p className="text-xl font-display font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Review answers */}
        <div className="space-y-3">
          <p className="font-semibold text-sm">Review Answers</p>
          {questions.map((q, idx) => {
            const selected = answers[q.id];
            const correct = q.correctAnswer;
            const isRight = selected === correct;
            
            return (
              <div key={q.id} className={cn(
                "p-4 rounded-xl border text-sm space-y-2",
                isRight ? "border-emerald-200 bg-emerald-500/5 dark:border-emerald-900"
                        : "border-red-200 bg-red-500/5 dark:border-red-900"
              )}>
                <div className="flex items-start gap-2">
                  {isRight
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  <p className="font-medium">{idx + 1}. {q.question}</p>
                </div>
                {!isRight && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 ml-6">
                    ✓ Correct: {correct}
                  </p>
                )}
                {q.explanation && (
                  <p className="text-xs text-muted-foreground ml-6 bg-background/50 p-2 rounded-lg">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back to Arena
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => {
              setPhase("playing");
              setAnswers({});
              setCurrentIdx(0);
              setTimeLeft(quiz.timeLimit);
              setStartTime(Date.now());
              setResults(null);
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Retry Quiz
          </Button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          Exit
        </Button>
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold",
          timeWarning ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-muted text-foreground"
        )}>
          <Clock className="w-3.5 h-3.5" />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Question */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <Badge className={cn(
            "text-[10px]",
            quiz.difficulty === "EASY" ? "bg-emerald-500/10 text-emerald-600" :
            quiz.difficulty === "MEDIUM" ? "bg-amber-500/10 text-amber-600" :
            "bg-red-500/10 text-red-600"
          )}>
            {quiz.difficulty}
          </Badge>
        </div>
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <p className="text-base font-semibold leading-relaxed">
              {currentQuestion.question}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {currentQuestion.options.map((option, optIdx) => {
          const selected = answers[currentQuestion.id] === option;
          return (
            <button
              key={optIdx}
              onClick={() => selectAnswer(currentQuestion.id, option)}
              className={cn(
                "flex items-center gap-3 w-full text-left p-4 rounded-xl border text-sm font-medium transition-all",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              )}
            >
              <span className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {["A", "B", "C", "D"][optIdx]}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          {Object.keys(answers).length}/{questions.length} answered
        </span>
        <Button
          size="sm"
          onClick={nextQuestion}
          className="gap-1"
        >
          {currentIdx === questions.length - 1 ? "Submit" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}