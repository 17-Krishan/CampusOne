"use client";

import { useState } from "react";
import {
  ExternalLink, Sparkles, BookOpen, Layers, HelpCircle,
  MessageSquare, FileText, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getNoteFileUrl, cn } from "@/lib/utils";

type Summary = { id: string; type: string; content: string };

type NoteDetailProps = {
  note: {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileType: string;
    subject: { name: string } | null;
    summaries: Summary[];
    _count: { flashcards: number };
    tags: string[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAIGenerate: () => void;
};

type Flashcard = { id: string; question: string; answer: string };
type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
};

function FlashcardView({ noteId }: { noteId: string }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [fetched, setFetched] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/flashcards`);
      const data = await res.json();
      setCards(data.data ?? []);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  if (!fetched) {
    return (
      <div className="py-8 text-center">
        <Button onClick={load} variant="outline" className="gap-2">
          <Layers className="w-4 h-4" />
          Load Flashcards
        </Button>
      </div>
    );
  }
  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (cards.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No flashcards generated yet.</p>;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => setFlipped((f) => ({ ...f, [card.id]: !f[card.id] }))}
          className={cn(
            "p-4 rounded-xl border text-left transition-all hover:border-primary/40",
            flipped[card.id] ? "bg-primary/5 border-primary/30" : "bg-card border-border"
          )}
        >
          {flipped[card.id] ? (
            <div>
              <Badge className="mb-2 text-[10px] bg-primary/10 text-primary border-0">Answer</Badge>
              <p className="text-sm">{card.answer}</p>
            </div>
          ) : (
            <div>
              <Badge className="mb-2 text-[10px] bg-muted text-muted-foreground border-0">Question</Badge>
              <p className="text-sm font-medium">{card.question}</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">
            {flipped[card.id] ? "Click to see question" : "Click to reveal answer"}
          </p>
        </button>
      ))}
    </div>
  );
}

function QuizView({ noteId }: { noteId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [fetched, setFetched] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/quiz-questions`);
      const data = await res.json();
      setQuestions(data.data ?? []);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  if (!fetched) {
    return (
      <div className="py-8 text-center">
        <Button onClick={load} variant="outline" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Load Quiz Questions
        </Button>
      </div>
    );
  }
  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (questions.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No quiz questions generated yet.</p>;

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id} className="p-4 rounded-xl border border-border space-y-3">
          <p className="text-sm font-medium">
            <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
            {q.question}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt;
              const isCorrect = opt === q.correctAnswer;
              const show = revealed[q.id];
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (!revealed[q.id]) {
                      setAnswers((a) => ({ ...a, [q.id]: opt }));
                      setRevealed((r) => ({ ...r, [q.id]: true }));
                    }
                  }}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg border text-sm transition-all",
                    !show && "hover:border-primary/50 hover:bg-accent",
                    show && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    show && selected && !isCorrect && "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300",
                    !show && "border-border"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {revealed[q.id] && q.explanation && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
              💡 {q.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function NoteDetailDialog({ note, open, onOpenChange, onAIGenerate }: NoteDetailProps) {
  const hasSummary = note.summaries.some((s) => s.type === "SUMMARY");
  const summary = note.summaries.find((s) => s.type === "SUMMARY");
  const keyConcepts = note.summaries.find((s) => s.type === "KEY_CONCEPTS");
  const vivaQuestions = note.summaries.find((s) => s.type === "VIVA_QUESTIONS");
  const revisionNotes = note.summaries.find((s) => s.type === "REVISION");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-base font-semibold line-clamp-2">
                {note.title}
              </DialogTitle>
              {note.subject && (
                <p className="text-xs text-muted-foreground mt-0.5">{note.subject.name}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-7 text-xs gap-1"
              asChild
            >
              <a href={getNoteFileUrl(note.fileUrl)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
                Open
              </a>
            </Button>
          </div>
        </DialogHeader>

        {!hasSummary ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold mb-1">AI summaries not generated yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate AI-powered summaries, flashcards, and quiz questions for this note.
            </p>
            <Button onClick={onAIGenerate} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate AI Content
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="shrink-0 w-full grid grid-cols-5">
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
              <TabsTrigger value="concepts" className="text-xs">Concepts</TabsTrigger>
              <TabsTrigger value="flashcards" className="text-xs">Cards</TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs">Quiz</TabsTrigger>
              <TabsTrigger value="viva" className="text-xs">Viva</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto scrollbar-thin mt-4 space-y-4">
              <TabsContent value="summary" className="prose-campus mt-0">
                {summary ? (
                  <div dangerouslySetInnerHTML={{ __html: summary.content }} />
                ) : (
                  <p className="text-sm text-muted-foreground">No summary available.</p>
                )}
              </TabsContent>

              <TabsContent value="concepts" className="mt-0">
                {keyConcepts ? (
                  <div className="prose-campus" dangerouslySetInnerHTML={{ __html: keyConcepts.content }} />
                ) : (
                  <p className="text-sm text-muted-foreground">No key concepts available.</p>
                )}
              </TabsContent>

              <TabsContent value="flashcards" className="mt-0">
                <FlashcardView noteId={note.id} />
              </TabsContent>

              <TabsContent value="quiz" className="mt-0">
                <QuizView noteId={note.id} />
              </TabsContent>

              <TabsContent value="viva" className="mt-0">
                {vivaQuestions ? (
                  <div className="prose-campus" dangerouslySetInnerHTML={{ __html: vivaQuestions.content }} />
                ) : (
                  <p className="text-sm text-muted-foreground">No viva questions available.</p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}