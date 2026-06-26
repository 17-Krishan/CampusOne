import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s · CampusOne",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand */}
      <div className="relative hidden lg:flex flex-col bg-[#070b14] text-white overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">
              CampusOne
            </span>
          </Link>

          {/* Main tagline */}
          <div className="mt-auto mb-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm text-white/70 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered Campus OS
            </div>
            <h1 className="text-5xl font-display font-bold leading-[1.1] tracking-tight mb-6">
              Your campus,
              <br />
              <span className="gradient-text">reimagined.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Attendance, notes, placements, quizzes, community — all powered
              by AI in one intelligent platform.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-auto">
            {[
              { label: "Students", value: "50K+" },
              { label: "Colleges", value: "200+" },
              { label: "AI Insights", value: "1M+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold font-display">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center p-8 bg-background">
        {/* Mobile logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 mb-10 lg:hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold">CampusOne</span>
        </Link>

        <div className="w-full max-w-[420px]">{children}</div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          By using CampusOne, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}