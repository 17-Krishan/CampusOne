import { z } from "zod";

// ─── Auth schemas ─────────────────────────────────────────────────────────────
export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    rollNumber: z.string().optional(),
    branch: z.string().optional(),
    semester: z.coerce.number().min(1).max(8).optional(),
    college: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Profile schemas ──────────────────────────────────────────────────────────
export const profileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  rollNumber: z.string().optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().min(1).max(8).optional(),
  year: z.coerce.number().min(1).max(4).optional(),
  college: z.string().optional(),
  phone: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  cgpa: z.coerce.number().min(0).max(10).optional(),
  skills: z.array(z.string()).optional(),
});

// ─── Attendance schemas ───────────────────────────────────────────────────────
export const attendanceSchema = z.object({
  subjectId: z.string().cuid(),
  date: z.string().datetime(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  remarks: z.string().optional(),
});

// ─── Assignment schemas ───────────────────────────────────────────────────────
export const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(2000).optional(),
  subjectId: z.string().cuid(),
  dueDate: z.string().datetime(),
  maxMarks: z.coerce.number().min(1).max(1000).default(100),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const assignmentSubmissionSchema = z.object({
  content: z.string().max(5000).optional(),
});

// ─── Notes schemas ────────────────────────────────────────────────────────────
export const noteUploadSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  subjectId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
});

// ─── Community schemas ────────────────────────────────────────────────────────
export const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(300),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000),
  category: z.enum([
    "ACADEMICS",
    "PLACEMENTS",
    "HOSTEL",
    "EVENTS",
    "GENERAL",
    "TECH",
    "SPORTS",
  ]),
  tags: z.array(z.string().max(30)).max(5).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  parentId: z.string().cuid().optional(),
});

// ─── Complaint schemas ────────────────────────────────────────────────────────
export const complaintSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum([
    "WATER",
    "INTERNET",
    "ELECTRICITY",
    "MAINTENANCE",
    "CLEANLINESS",
    "OTHER",
  ]),
  roomNumber: z.string().optional(),
});

// ─── Marketplace schemas ──────────────────────────────────────────────────────
export const marketplaceItemSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0),
  category: z.enum([
    "BOOKS",
    "ELECTRONICS",
    "CYCLES",
    "HOSTEL_ITEMS",
    "CLOTHING",
    "SPORTS",
    "OTHER",
  ]),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR"]).default("GOOD"),
  location: z.string().optional(),
});

// ─── Event schemas ────────────────────────────────────────────────────────────
export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  onlineLink: z.string().url().optional().or(z.literal("")),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  maxAttendees: z.coerce.number().min(1).optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

// ─── Lost & Found schemas ─────────────────────────────────────────────────────
export const lostFoundSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  isLost: z.boolean().default(true),
  location: z.string().optional(),
  date: z.string().datetime(),
  contactInfo: z.string().optional(),
});

// ─── Quiz schemas ─────────────────────────────────────────────────────────────
export const quizSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  subjectId: z.string().cuid().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  timeLimit: z.coerce.number().min(60).max(7200).default(600),
  isPublic: z.boolean().default(true),
});

// ─── AI schemas ───────────────────────────────────────────────────────────────
export const aiChatSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().cuid().optional(),
});

export const careerGoalSchema = z.object({
  goal: z.string().min(5).max(200),
  currentSkills: z.array(z.string()).optional(),
  timeline: z.string().optional(),
});

// ─── Types from schemas ───────────────────────────────────────────────────────
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;
export type AssignmentFormData = z.infer<typeof assignmentSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type ComplaintFormData = z.infer<typeof complaintSchema>;
export type MarketplaceItemFormData = z.infer<typeof marketplaceItemSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type LostFoundFormData = z.infer<typeof lostFoundSchema>;
export type NoteUploadFormData = z.infer<typeof noteUploadSchema>;
export type AIChatFormData = z.infer<typeof aiChatSchema>;
export type CareerGoalFormData = z.infer<typeof careerGoalSchema>;