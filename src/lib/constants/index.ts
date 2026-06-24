// ─── App constants ────────────────────────────────────────────────────────────
export const APP_NAME = "CampusOne";
export const APP_DESCRIPTION =
  "The AI-powered campus operating system for modern students";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Attendance thresholds ────────────────────────────────────────────────────
export const ATTENDANCE_THRESHOLD = 75;
export const ATTENDANCE_WARNING_THRESHOLD = 80;

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const POSTS_PAGE_SIZE = 15;
export const NOTES_PAGE_SIZE = 12;

// ─── File upload limits ───────────────────────────────────────────────────────
export const MAX_NOTE_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_MARKETPLACE_IMAGES = 5;
export const ALLOWED_NOTE_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];

// ─── Supabase storage buckets ─────────────────────────────────────────────────
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  NOTES: "notes",
  RESUMES: "resumes",
  MARKETPLACE: "marketplace",
  EVENTS: "events",
  COMPLAINTS: "complaints",
  LOST_FOUND: "lost-found",
} as const;

// ─── Branches ─────────────────────────────────────────────────────────────────
export const BRANCHES = [
  "Computer Science Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Data Science",
  "Artificial Intelligence & ML",
] as const;

export const BRANCH_CODES: Record<string, string> = {
  "Computer Science Engineering": "CSE",
  "Information Technology": "IT",
  "Electronics & Communication": "ECE",
  "Electrical Engineering": "EEE",
  "Mechanical Engineering": "ME",
  "Civil Engineering": "CE",
  "Chemical Engineering": "CHE",
  Biotechnology: "BT",
  "Data Science": "DS",
  "Artificial Intelligence & ML": "AIML",
};

// ─── Semesters ────────────────────────────────────────────────────────────────
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// ─── Quiz subjects ────────────────────────────────────────────────────────────
export const QUIZ_SUBJECTS = [
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Java Programming",
  "Aptitude",
  "Data Structures & Algorithms",
  "System Design",
  "Web Development",
  "Machine Learning",
  "Cloud Computing",
] as const;

// ─── Career goals ─────────────────────────────────────────────────────────────
export const CAREER_GOALS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Cybersecurity Engineer",
  "Blockchain Developer",
  "Mobile Developer",
  "AI Engineer",
] as const;

// ─── Navigation ───────────────────────────────────────────────────────────────
export const SIDEBAR_ITEMS = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { title: "AI Assistant", href: "/dashboard/ai", icon: "Bot" },
      { title: "Notifications", href: "/dashboard/notifications", icon: "Bell" },
    ],
  },
  {
    title: "Academics",
    items: [
      { title: "Attendance", href: "/dashboard/academic/attendance", icon: "CalendarCheck" },
      { title: "Timetable", href: "/dashboard/academic/timetable", icon: "Clock" },
      { title: "Assignments", href: "/dashboard/academic/assignments", icon: "FileText" },
    ],
  },
  {
    title: "Learning",
    items: [
      { title: "Notes", href: "/dashboard/notes", icon: "BookOpen" },
      { title: "Quiz Arena", href: "/dashboard/quiz", icon: "Zap" },
      { title: "Career Mentor", href: "/dashboard/career", icon: "TrendingUp" },
    ],
  },
  {
    title: "Placement",
    items: [
      { title: "Placement Hub", href: "/dashboard/placement", icon: "Briefcase" },
    ],
  },
  {
    title: "Campus",
    items: [
      { title: "Community", href: "/dashboard/community", icon: "Users" },
      { title: "Clubs & Events", href: "/dashboard/clubs", icon: "Star" },
      { title: "Marketplace", href: "/dashboard/marketplace", icon: "ShoppingBag" },
      { title: "Lost & Found", href: "/dashboard/lost-found", icon: "Search" },
      { title: "Hostel", href: "/dashboard/hostel", icon: "Home" },
      { title: "Network", href: "/dashboard/network", icon: "Network" },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ],
  },
] as const;

// ─── Post categories ──────────────────────────────────────────────────────────
export const POST_CATEGORIES = [
  { value: "ACADEMICS", label: "Academics", emoji: "📚" },
  { value: "PLACEMENTS", label: "Placements", emoji: "💼" },
  { value: "HOSTEL", label: "Hostel", emoji: "🏠" },
  { value: "EVENTS", label: "Events", emoji: "🎉" },
  { value: "GENERAL", label: "General", emoji: "💬" },
  { value: "TECH", label: "Tech", emoji: "💻" },
  { value: "SPORTS", label: "Sports", emoji: "⚽" },
] as const;

// ─── Complaint categories ─────────────────────────────────────────────────────
export const COMPLAINT_CATEGORIES = [
  { value: "WATER", label: "Water Issue", icon: "Droplets" },
  { value: "INTERNET", label: "Internet Issue", icon: "Wifi" },
  { value: "ELECTRICITY", label: "Electricity Issue", icon: "Zap" },
  { value: "MAINTENANCE", label: "Maintenance", icon: "Wrench" },
  { value: "CLEANLINESS", label: "Cleanliness", icon: "Sparkles" },
  { value: "OTHER", label: "Other", icon: "MoreHorizontal" },
] as const;