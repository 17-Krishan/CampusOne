"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot, Send, Plus, Trash2, Loader2, Sparkles, User, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatTimeAgo, truncate } from "@/lib/utils";
import type { AIChatMessage } from "@/types";

type SessionSummary = {
  id: string;
  title: string;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface AIAssistantClientProps {
  sessions: SessionSummary[];
  firstName: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize my pending assignments",
  "How can I improve my resume?",
  "Explain OS process scheduling simply",
  "Suggest a study plan for this week",
];

export function AIAssistantClient({ sessions: initialSessions, firstName }: AIAssistantClientProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function loadSession(id: string) {
    if (id === activeSessionId) return;
    setIsLoadingSession(true);
    try {
      const res = await fetch(`/api/ai/chat/sessions/${id}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const json = await res.json();
      setMessages(json.data.messages ?? []);
      setActiveSessionId(id);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsLoadingSession(false);
    }
  }

  function handleNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
  }

  async function handleDeleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/chat/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete conversation");
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeSessionId) handleNewChat();
      toast.success("Conversation deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    }
  }

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    const optimisticUserMsg: AIChatMessage = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: text,
          context: "AI Assistant",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "The assistant failed to respond.");
      }
      const json = await res.json();
      const { sessionId, title, message } = json.data;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: message, createdAt: new Date().toISOString() },
      ]);

      if (!activeSessionId) {
        setActiveSessionId(sessionId);
        setSessions((prev) => [
          { id: sessionId, title, context: "AI Assistant", createdAt: new Date(), updatedAt: new Date() },
          ...prev,
        ]);
      } else {
        setSessions((prev) => {
          const current = prev.find((s) => s.id === sessionId);
          if (!current) return prev;
          return [
            { ...current, updatedAt: new Date() },
            ...prev.filter((s) => s.id !== sessionId),
          ];
        });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
      setMessages((prev) => prev.filter((m) => m !== optimisticUserMsg));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Sidebar */}
      {sidebarOpen && (
        <Card className="w-64 shrink-0 flex flex-col p-3">
          <Button onClick={handleNewChat} className="w-full gap-2 mb-3" size="sm">
            <Plus className="w-4 h-4" />New Chat
          </Button>

          <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No conversations yet.
              </p>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group flex items-start justify-between gap-2",
                  activeSessionId === s.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{truncate(s.title, 26)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatTimeAgo(s.updatedAt)}</p>
                </div>
                <Trash2
                  className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shrink-0 mt-0.5"
                  onClick={(e) => handleDeleteSession(s.id, e)}
                />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Chat panel */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">CampusOne Assistant</p>
              <p className="text-[11px] text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto px-4 py-4">
          {isLoadingSession ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-lg">Hey {firstName} 👋</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Ask me anything about your academics, career, or campus life.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/50 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role !== "user" && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-accent/60 text-foreground rounded-tl-sm"
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-accent/60">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </CardContent>

        {/* Input */}
        <div className="p-3 border-t border-border shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 max-w-2xl mx-auto"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CampusOne AI anything…"
              className="flex-1 h-10 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isSending}
            />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={isSending || !input.trim()}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}