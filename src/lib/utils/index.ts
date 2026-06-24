import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

// ─── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatters ──────────────────────────────────────────────────────────
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy · h:mm a");
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// ─── Number formatters ────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatScore(score: number, total: number): string {
  return `${score}/${total}`;
}

// ─── Attendance helpers ───────────────────────────────────────────────────────
export function calculateAttendancePercentage(
  attended: number,
  total: number
): number {
  if (total === 0) return 0;
  return (attended / total) * 100;
}

export function calculateSafeBunks(
  attended: number,
  total: number,
  threshold = 75
): number {
  // How many classes can be missed while staying above threshold
  // attended / (total + future) >= threshold/100
  // Let future = x, all future attended by student except y bunks
  // Simplification: bunks from current total
  const required = Math.ceil((threshold / 100) * total);
  return Math.max(0, attended - required);
}

export function getAttendanceStatus(
  percentage: number
): "SAFE" | "WARNING" | "DANGER" {
  if (percentage >= 80) return "SAFE";
  if (percentage >= 75) return "WARNING";
  return "DANGER";
}

export function getAttendanceColor(status: "SAFE" | "WARNING" | "DANGER") {
  switch (status) {
    case "SAFE":
      return "text-emerald-500";
    case "WARNING":
      return "text-amber-500";
    case "DANGER":
      return "text-red-500";
  }
}

export function getAttendanceBgColor(status: "SAFE" | "WARNING" | "DANGER") {
  switch (status) {
    case "SAFE":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "WARNING":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "DANGER":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
  }
}

// ─── String helpers ───────────────────────────────────────────────────────────
export function getInitials(
  firstName: string,
  lastName?: string | null
): string {
  const first = firstName?.charAt(0)?.toUpperCase() ?? "";
  const last = lastName?.charAt(0)?.toUpperCase() ?? "";
  return `${first}${last}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .trim();
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Grade helpers ────────────────────────────────────────────────────────────
export function getGradeFromCgpa(cgpa: number): string {
  if (cgpa >= 9.0) return "O";
  if (cgpa >= 8.0) return "A+";
  if (cgpa >= 7.0) return "A";
  if (cgpa >= 6.0) return "B+";
  if (cgpa >= 5.0) return "B";
  return "C";
}

// ─── URL helpers ──────────────────────────────────────────────────────────────
export function getAvatarUrl(avatar?: string | null): string {
  if (!avatar) return "";
  if (avatar.startsWith("http")) return avatar;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatar}`;
}

export function getNoteFileUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/notes/${fileUrl}`;
}

// ─── Day of week helpers ──────────────────────────────────────────────────────
export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getDayName(day: number, short = false): string {
  return short ? SHORT_DAYS[day] : DAYS_OF_WEEK[day];
}

// ─── Validation helpers ───────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidRollNumber(roll: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(roll.toUpperCase());
}

// ─── Color helpers ────────────────────────────────────────────────────────────
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    ACADEMICS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PLACEMENTS: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    HOSTEL: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    EVENTS: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    GENERAL: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    TECH: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    SPORTS: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };
  return colors[category] ?? colors.GENERAL;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    HIGH: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    CRITICAL: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return colors[priority] ?? colors.MEDIUM;
}