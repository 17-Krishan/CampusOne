"use client";

import { CheckCircle2, XCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Resume = {
  id: string;
  name: string;
  atsScore: number | null;
  feedback: any;
};

interface ResumeAnalysisViewProps {
  resume: Resume;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeAnalysisView({ resume, open, onOpenChange }: ResumeAnalysisViewProps) {
  const feedback = resume.feedback as {
    formatting?: { score: number; feedback: string };
    keywords?: { present: string[]; missing: string[] };
    skills?: { present: string[]; missing: string[] };
    suggestions?: string[];
    overallFeedback?: string;
  } | null;

  const atsScore = resume.atsScore ?? 0;
  const scoreColor = atsScore >= 70 ? "text-emerald-500" : atsScore >= 50 ? "text-amber-500" : "text-red-500";
  const indicatorColor = atsScore >= 70 ? "bg-emerald-500" : atsScore >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Resume Analysis — {resume.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ATS Score */}
          <div className="p-4 rounded-xl border border-border text-center space-y-2">
            <p className="text-sm text-muted-foreground">ATS Score</p>
            <p className={cn("text-5xl font-display font-bold", scoreColor)}>{atsScore}%</p>
            <Progress value={atsScore} className="h-2.5" indicatorClassName={indicatorColor} />
            <p className="text-xs text-muted-foreground">
              {atsScore >= 70 ? "✅ Good ATS compatibility" :
               atsScore >= 50 ? "⚠️ Needs improvement" :
               "❌ Poor ATS compatibility — needs significant work"}
            </p>
          </div>

          {/* Overall feedback */}
          {feedback?.overallFeedback && (
            <div className="p-3 rounded-xl bg-muted text-sm leading-relaxed">
              {feedback.overallFeedback}
            </div>
          )}

          {/* Formatting */}
          {feedback?.formatting && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Formatting</p>
              <div className="flex items-center gap-3">
                <Progress value={feedback.formatting.score * 10} className="flex-1 h-2" />
                <span className="text-sm font-bold shrink-0">{feedback.formatting.score}/10</span>
              </div>
              <p className="text-xs text-muted-foreground">{feedback.formatting.feedback}</p>
            </div>
          )}

          {/* Keywords */}
          {feedback?.keywords && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Keywords</p>
              <div className="space-y-1.5">
                {feedback.keywords.present.length > 0 && (
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />Present ({feedback.keywords.present.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {feedback.keywords.present.map((k) => (
                        <Badge key={k} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] border-0">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {feedback.keywords.missing.length > 0 && (
                  <div>
                    <p className="text-xs text-red-500 mb-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />Missing ({feedback.keywords.missing.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {feedback.keywords.missing.map((k) => (
                        <Badge key={k} className="bg-red-500/10 text-red-500 text-[10px] border-0">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {feedback?.suggestions && feedback.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Improvement Suggestions</p>
              <div className="space-y-2">
                {feedback.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}