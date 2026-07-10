"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Send, Loader2, MessageSquare, CheckCircle2, Router } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPercentage } from "@/lib/utils";
import { toast } from "sonner";

interface MockInterviewPlayerProps {
  type: string;
  onBack: () => void;
}

type Message = {
  role: "interviewer" | "candidate";
  content: string;
  feedback?: string;
  score?: number;
};

export function MockInterviewPlayer({ type, onBack }: MockInterviewPlayerProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  // const [sessionId, setSessionId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const MAX_QUESTIONS = 5;
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;

    startedRef.current = true;
    startInterview();
  }, []); 
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function startInterview() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action: "start" }),
      });
      const data = await res.json();
      // setSessionId(data.sessionId);

      if (!res.ok) {
        throw new Error(
          data.error ||
          "Interview service unavailable"
        );
      }

      if (!data.question) {
        throw new Error(
          "Failed to generate interview question"
        );
      }

      setMessages([
        {
          role: "interviewer",
          content: data.question,
        },
      ]);

      setQuestionCount(1);
    } catch(err: any) {
      // console.error(err)
      toast.error("Failed to start interview.");
      setTimeout(() => {
        onBack();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendAnswer() {
    if (!input.trim() || isLoading) return;
    const answer = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "candidate", content: answer }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          action: questionCount >= MAX_QUESTIONS ? "finish" : "next",
          answer,
          // sessionId,
          history: messages,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
          "Interview service unavailable"
        );
      }

      if (!data.question && !data.complete) {
        toast.error(
          "Interview ended unexpectedly."
        );

        setTimeout(() => {
          router.refresh();
          onBack();
        }, 1500);

        return;
      }

      if (data.complete || questionCount >= MAX_QUESTIONS) {
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", content: data.feedback ?? "Thank you for your time!", feedback: data.feedback, score: data.score },
        ]);
        setFinalScore(data.overallScore ?? null);
        setIsComplete(true);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", content: data.question, feedback: data.feedbackOnLastAnswer, score: data.scoreForLastAnswer },
        ]);
        setQuestionCount((c) => c + 1);
      }
    } catch (err: any) {
      // console.error(err);

      toast.error(
        "AI service quota exceeded. Please try again later."
      );

      setTimeout(() => {
        router.refresh();
        onBack();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }

  const progress = (questionCount / MAX_QUESTIONS) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { router.refresh(); onBack(); }} className="gap-1 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          Exit Interview
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="w-3 h-3" />
            {type} Interview
          </Badge>
          <span className="text-xs text-muted-foreground">
            {questionCount}/{MAX_QUESTIONS}
          </span>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      {/* Chat window */}
      <div className="h-[420px] overflow-y-auto scrollbar-thin rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-3", msg.role === "candidate" && "flex-row-reverse")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
              msg.role === "interviewer" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
            )}>
              {msg.role === "interviewer" ? "AI" : "You"}
            </div>
            <div className={cn("max-w-[80%] space-y-1.5", msg.role === "candidate" && "items-end")}>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === "interviewer"
                  ? "bg-background border border-border rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                {msg.content}
              </div>
              {msg.feedback && msg.role === "interviewer" && idx > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs text-emerald-700 dark:text-emerald-400">
                  💡 {msg.feedback}
                </div>
              )}
              {msg.score !== undefined && (
                <Badge variant="secondary" className="text-[10px]">
                  Score: {msg.score}/10
                </Badge>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            </div>
            <div className="bg-background border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Final score */}
      {isComplete && finalScore !== null && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Interview Complete!</p>
              <Progress value={finalScore * 10} className="h-2 mt-1" indicatorClassName="bg-emerald-500" />
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-display font-bold text-emerald-500">{finalScore}/10</p>
              <p className="text-xs text-muted-foreground">Overall</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input */}
      {!isComplete && (
        <div className="flex gap-3">
          <Textarea
            placeholder="Type your answer here... (press Ctrl+Enter to submit)"
            className="resize-none"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) sendAnswer(); }}
            disabled={isLoading}
          />
          <Button
            className="self-end h-10 w-10 p-0 shrink-0"
            onClick={sendAnswer}
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {isComplete && (
        <Button variant="outline" className="w-full" onClick={() => { router.refresh(); onBack(); }}>
          Back to Placement Hub
        </Button>
      )}
    </div>
  );
}