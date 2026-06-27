import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowRight, Bot, BookOpen, Briefcase, Users, Zap, CalendarCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const features = [
    { icon: Bot, title: "AI Campus Assistant", description: "Answer questions, summarise notes, generate study plans — your 24/7 AI tutor." },
    { icon: CalendarCheck, title: "Attendance Tracker", description: "Know exactly how many classes you can safely miss with our bunk calculator." },
    { icon: BookOpen, title: "AI Notes Platform", description: "Upload PDFs and get instant summaries, flashcards, and quiz questions." },
    { icon: Zap, title: "Quiz Arena", description: "Solo practice or real-time multiplayer battles with live leaderboards." },
    { icon: Briefcase, title: "Placement Hub", description: "Resume analysis, mock interviews, and company tracking in one place." },
    { icon: Users, title: "Campus Community", description: "Reddit-style communities for academics, hostel, events, and more." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold">CampusOne</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="container max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            AI-Powered Campus OS · Now in Beta
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
            Your campus,
            <br />
            <span className="gradient-text">one platform.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Replace scattered portals with a single AI-powered system for attendance,
            notes, quizzes, placements, and your entire campus life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="h-12 px-8 text-base font-medium" asChild>
              <Link href="/signup">
                Get started free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-bold tracking-tight mb-3">
              Everything in one place
            </h2>
            <p className="text-muted-foreground text-lg">
              Sixteen modules replacing a dozen scattered apps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-brand text-white">
            <h2 className="text-3xl font-display font-bold mb-3">
              Ready to get started?
            </h2>
            <p className="text-white/70 mb-8">
              Join 50,000+ students already using CampusOne.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-8 font-medium text-base bg-white text-primary hover:bg-white/90"
              asChild
            >
              <Link href="/signup">
                Create free account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-semibold text-sm">CampusOne</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CampusOne. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}