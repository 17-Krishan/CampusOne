"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase, Upload, MessageSquare, Building2, CheckCircle2,
  XCircle, Clock, FileText, Star, TrendingUp, Plus, Loader2,
  ChevronRight, Target, Award, Code,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn, formatFileSize, formatDate } from "@/lib/utils";
import { MockInterviewPlayer } from "@/components/placement/mock-interview-player";
import { ResumeAnalysisView } from "@/components/placement/resume-analysis-view";

type Company = {
  id: string;
  name: string;
  logo: string | null;
  industry: string | null;
  package: string | null;
  role: string | null;
  visitDate: Date | null;
  minCgpa: number;
};

type Application = {
  id: string;
  status: string;
  appliedAt: Date;
  company: Company;
};

type Resume = {
  id: string;
  name: string;
  fileUrl: string;
  atsScore: number | null;
  feedback: any;
  isActive: boolean;
  createdAt: Date;
};

type InterviewSession = {
  id: string;
  type: string;
  overallScore: number | null;
  confidenceScore: number | null;
  completedAt: Date | null;
  createdAt: Date;
};

interface PlacementClientProps {
  companies: Company[];
  placement: { id: string; status: string; applications: Application[] } | null;
  resumes: Resume[];
  interviewSessions: InterviewSession[];
  userId: string;
  profile: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  APPLIED: { label: "Applied", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Clock },
  SHORTLISTED: { label: "Shortlisted", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Star },
  INTERVIEW_SCHEDULED: { label: "Interview", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: MessageSquare },
  SELECTED: { label: "Selected 🎉", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
};

export function PlacementClient({
  companies,
  placement,
  resumes,
  interviewSessions,
  userId,
  profile,
}: PlacementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewType, setInterviewType] = useState("HR");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [activeInterview, setActiveInterview] = useState(false);
  const [applyingTo, setApplyingTo] = useState<Company | null>(null);

  const applications = placement?.applications ?? [];
  const placedCount = applications.filter((a) => a.status === "SELECTED").length;

  async function handleResumeUpload() {
    if (!resumeFile) { toast.error("Please select a resume file."); return; }
    setIsAnalyzing(true);
    try {
      // Get presigned URL
      const presignRes = await fetch("/api/placement/resume/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: resumeFile.name, fileType: resumeFile.type }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, fileUrl } = await presignRes.json();

      // Upload file
      await fetch(uploadUrl, { method: "PUT", body: resumeFile, headers: { "Content-Type": resumeFile.type } });

      // Analyze with AI
      const analyzeRes = await fetch("/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, name: resumeName || resumeFile.name }),
      });
      if (!analyzeRes.ok) throw new Error("Analysis failed");
      const data = await analyzeRes.json();
      setAnalysisResult(data.analysis);
      toast.success("Resume analyzed successfully!");
      setUploadOpen(false);
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleApply(company: Company) {
    try {
      const res = await fetch("/api/placement/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed to apply."); return; }
      toast.success(`Applied to ${company.name}!`);
      setApplyingTo(null);
      startTransition(() => router.refresh());
    } catch { toast.error("Something went wrong."); }
  }

  if (activeInterview) {
    return <MockInterviewPlayer type={interviewType} onBack={() => setActiveInterview(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Placement Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resume analysis · Mock interviews · Company tracker
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Companies", value: companies.length, icon: Building2, color: "text-primary" },
          { label: "Applied", value: applications.length, icon: FileText, color: "text-blue-500" },
          { label: "Interviews", value: applications.filter((a) => a.status === "INTERVIEW_SCHEDULED").length, icon: MessageSquare, color: "text-violet-500" },
          { label: "Selected", value: placedCount, icon: Award, color: "text-emerald-500" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className={cn("w-4 h-4 mb-2", s.color)} />
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card
          className="p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
          onClick={() => setUploadOpen(true)}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
            <Upload className="w-5 h-5 text-blue-500" />
          </div>
          <p className="font-semibold text-sm">Resume Analyzer</p>
          <p className="text-xs text-muted-foreground mt-1">
            Get ATS score, keyword gaps & improvement tips
          </p>
        </Card>
        <Card
          className="p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
          onClick={() => setInterviewOpen(true)}
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
            <MessageSquare className="w-5 h-5 text-violet-500" />
          </div>
          <p className="font-semibold text-sm">Mock Interview</p>
          <p className="text-xs text-muted-foreground mt-1">
            HR, technical & behavioural AI interviews with feedback
          </p>
        </Card>
        <Card className="p-5 hover:border-primary/40 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <Code className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="font-semibold text-sm">Coding Tracker</p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect LeetCode, Codeforces & GeeksForGeeks
          </p>
          <Badge variant="secondary" className="mt-2 text-[10px]">Coming Soon</Badge>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Companies ({companies.length})</TabsTrigger>
          <TabsTrigger value="applications">My Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="resumes">Resumes ({resumes.length})</TabsTrigger>
          <TabsTrigger value="interviews">Interviews ({interviewSessions.length})</TabsTrigger>
        </TabsList>

        {/* Companies */}
        <TabsContent value="companies" className="mt-4">
          {companies.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No companies listed yet.</p>
            </CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {companies.map((company) => {
                const applied = applications.some((a) => a.company.id === company.id);
                return (
                  <Card key={company.id} className="hover:shadow-md transition-all hover:border-primary/30">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {applied && (
                          <Badge variant="success" className="text-[10px]">Applied</Badge>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{company.name}</p>
                        {company.industry && (
                          <p className="text-xs text-muted-foreground">{company.industry}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {company.role && (
                          <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                            <Briefcase className="w-3 h-3" />{company.role}
                          </span>
                        )}
                        {company.package && (
                          <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3" />{company.package}
                          </span>
                        )}
                        {company.minCgpa > 0 && (
                          <span className="bg-muted px-2 py-0.5 rounded-full">
                            Min CGPA: {company.minCgpa}
                          </span>
                        )}
                      </div>
                      {company.visitDate && (
                        <p className="text-xs text-muted-foreground">
                          📅 Visit: {format(new Date(company.visitDate), "MMM d, yyyy")}
                        </p>
                      )}
                      {!applied && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1"
                          onClick={() => handleApply(company)}
                        >
                          <Plus className="w-3.5 h-3.5" />Apply
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Applications */}
        <TabsContent value="applications" className="mt-4">
          {applications.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No applications yet. Browse companies above.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.APPLIED;
                return (
                  <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{app.company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied {formatDate(app.appliedAt)}
                        {app.company.role && ` · ${app.company.role}`}
                      </p>
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", cfg.color)}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Resumes */}
        <TabsContent value="resumes" className="mt-4">
          <div className="space-y-3">
            {resumes.length === 0 && (
              <Card><CardContent className="py-12 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No resumes uploaded yet</p>
                <p className="text-xs text-muted-foreground mb-4">Upload your resume to get an AI-powered ATS analysis.</p>
                <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-2">
                  <Upload className="w-4 h-4" />Upload Resume
                </Button>
              </CardContent></Card>
            )}
            {resumes.map((resume) => (
              <div key={resume.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{resume.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(resume.createdAt)}</p>
                  {resume.atsScore !== null && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress
                        value={resume.atsScore}
                        className="h-1.5 flex-1"
                        indicatorClassName={resume.atsScore >= 70 ? "bg-emerald-500" : resume.atsScore >= 50 ? "bg-amber-500" : "bg-red-500"}
                      />
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">
                        ATS: {resume.atsScore}%
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => setSelectedResume(resume)}
                >
                  View Analysis <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Interviews */}
        <TabsContent value="interviews" className="mt-4">
          <div className="space-y-3">
            {interviewSessions.length === 0 && (
              <Card><CardContent className="py-12 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No mock interviews yet</p>
                <p className="text-xs text-muted-foreground mb-4">Practice with our AI interviewer.</p>
                <Button size="sm" onClick={() => setInterviewOpen(true)} className="gap-2">
                  <MessageSquare className="w-4 h-4" />Start Interview
                </Button>
              </CardContent></Card>
            )}
            {interviewSessions.map((session) => (
              <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{session.type} Interview</p>
                  <p className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</p>
                </div>
                {session.overallScore !== null && (
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{session.overallScore}/10</p>
                    <p className="text-[11px] text-muted-foreground">Overall</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Resume Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload & Analyze Resume
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
              resumeFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-accent/50"
            )}>
              {resumeFile ? (
                <div className="text-center">
                  <FileText className="w-7 h-7 text-primary mx-auto mb-1" />
                  <p className="text-sm font-medium">{resumeFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(resumeFile.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-medium">Click to upload PDF</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setResumeFile(f); setResumeName(f.name.replace(/\.[^.]+$/, "")); }
                }}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={isAnalyzing}>Cancel</Button>
            <Button onClick={handleResumeUpload} disabled={isAnalyzing || !resumeFile} className="gap-2">
              {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><Star className="w-4 h-4" />Analyze</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mock Interview Type Dialog */}
      <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Start Mock Interview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Interview Type</Label>
            <div className="grid gap-2">
              {["HR", "TECHNICAL", "BEHAVIORAL"].map((type) => (
                <button
                  key={type}
                  onClick={() => setInterviewType(type)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all text-left",
                    interviewType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <MessageSquare className={cn("w-4 h-4", interviewType === type ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p>{type.charAt(0) + type.slice(1).toLowerCase()} Interview</p>
                    <p className="text-xs text-muted-foreground font-normal">
                      {type === "HR" ? "Background, goals, salary expectations" :
                       type === "TECHNICAL" ? "DSA, system design, coding concepts" :
                       "Situational, teamwork, leadership questions"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewOpen(false)}>Cancel</Button>
            <Button onClick={() => { setInterviewOpen(false); setActiveInterview(true); }} className="gap-2">
              <MessageSquare className="w-4 h-4" />Start Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Analysis View */}
      {selectedResume && (
        <ResumeAnalysisView
          resume={selectedResume}
          open={!!selectedResume}
          onOpenChange={(o) => { if (!o) setSelectedResume(null); }}
        />
      )}
    </div>
  );
}