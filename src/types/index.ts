import type {
  User,
  Profile,
  Subject,
  Attendance,
  Assignment,
  AssignmentSubmission,
  Note,
  NoteSummary,
  Flashcard,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizBattle,
  Company,
  Placement,
  PlacementApplication,
  Resume,
  InterviewSession,
  Post,
  Comment,
  PostVote,
  Bookmark,
  Club,
  ClubMember,
  Event,
  EventRegistration,
  MarketplaceItem,
  Complaint,
  MessMenu,
  Notification,
  AIChatSession,
  CareerRoadmap,
  UserRole,
  AttendanceStatus,
  AssignmentStatus,
  AssignmentPriority,
  QuizDifficulty,
  QuizBattleStatus,
  PlacementStatus,
  ApplicationStatus,
  NoteType,
  PostCategory,
  ComplaintStatus,
  ComplaintCategory,
  MarketplaceCategory,
  MarketplaceStatus,
  NotificationType,
  EventRegistrationStatus,
} from "@prisma/client";

// ─── Re-export Prisma types ───────────────────────────────────────────────────
export type {
  User,
  Profile,
  Subject,
  Attendance,
  Assignment,
  AssignmentSubmission,
  Note,
  NoteSummary,
  Flashcard,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizBattle,
  Company,
  Placement,
  PlacementApplication,
  Resume,
  InterviewSession,
  Post,
  Comment,
  PostVote,
  Bookmark,
  Club,
  ClubMember,
  Event,
  EventRegistration,
  MarketplaceItem,
  Complaint,
  MessMenu,
  Notification,
  AIChatSession,
  CareerRoadmap,
  UserRole,
  AttendanceStatus,
  AssignmentStatus,
  AssignmentPriority,
  QuizDifficulty,
  QuizBattleStatus,
  PlacementStatus,
  ApplicationStatus,
  NoteType,
  PostCategory,
  ComplaintStatus,
  ComplaintCategory,
  MarketplaceCategory,
  MarketplaceStatus,
  NotificationType,
  EventRegistrationStatus,
};

// ─── Extended types with relations ───────────────────────────────────────────
export type UserWithProfile = User & {
  profile: Profile | null;
};

export type AttendanceWithSubject = Attendance & {
  subject: Subject;
};

export type AssignmentWithSubject = Assignment & {
  subject: Subject;
  submissions: AssignmentSubmission[];
};

export type NoteWithDetails = Note & {
  subject: Subject | null;
  uploader: UserWithProfile;
  summaries: NoteSummary[];
  flashcards: Flashcard[];
};

export type PostWithDetails = Post & {
  author: UserWithProfile;
  comments: (Comment & { author: UserWithProfile })[];
  votes: PostVote[];
  _count: { comments: number; votes: number };
};

export type ClubWithMembers = Club & {
  members: (ClubMember & { user: UserWithProfile })[];
  _count: { members: number; events: number };
};

export type EventWithDetails = Event & {
  club: Club | null;
  registrations: {
    userId: string;
    status: EventRegistrationStatus;
  }[];
};

export type MarketplaceItemWithSeller = MarketplaceItem & {
  seller: UserWithProfile;
};

// ─── API Response types ───────────────────────────────────────────────────────
export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};

// ─── Auth types ───────────────────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  profile: Profile | null;
};

export type SignUpData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  branch?: string;
  semester?: number;
  college?: string;
};

export type LoginData = {
  email: string;
  password: string;
};

// ─── Dashboard types ──────────────────────────────────────────────────────────
export type AttendanceStats = {
  subject: Subject;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  safeBunks: number;
  status: "SAFE" | "WARNING" | "DANGER";
};

export type DashboardData = {
  attendanceStats: AttendanceStats[];
  upcomingAssignments: AssignmentWithSubject[];
  upcomingEvents: EventWithDetails[];
  recentNotifications: Notification[];
  quizPerformance: {
    totalAttempts: number;
    averageScore: number;
    recentAttempts: QuizAttempt[];
  };
  placementStatus: PlacementStatus;
};

// ─── AI types ─────────────────────────────────────────────────────────────────
export type AIChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type AINotesResult = {
  summary: string;
  keyConcepts: string[];
  flashcards: { question: string; answer: string }[];
  quizQuestions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  vivaQuestions: { question: string; answer: string }[];
  revisionNotes: string;
};

export type ResumeAnalysis = {
  atsScore: number;
  formatting: { score: number; feedback: string };
  keywords: { present: string[]; missing: string[] };
  skills: { present: string[]; missing: string[] };
  suggestions: string[];
  overallFeedback: string;
};

export type InterviewFeedback = {
  question: string;
  answer: string;
  feedback: string;
  score: number;
};

export type CareerRoadmapData = {
  goal: string;
  timeline: string;
  phases: {
    name: string;
    duration: string;
    skills: string[];
    projects: string[];
    resources: { title: string; url: string; type: string }[];
  }[];
  currentSkillGap: string[];
  salaryRange: string;
};

// ─── Quiz types ───────────────────────────────────────────────────────────────
export type QuizWithQuestions = Quiz & {
  questions: QuizQuestion[];
  _count: { attempts: number };
};

export type QuizResult = {
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  questionResults: {
    question: QuizQuestion;
    selectedAnswer: string;
    isCorrect: boolean;
  }[];
};

// ─── Sidebar & Navigation types ───────────────────────────────────────────────
export type NavItem = {
  title: string;
  href: string;
  icon: string;
  badge?: number | string;
  children?: NavItem[];
};

export type SidebarSection = {
  title?: string;
  items: NavItem[];
};