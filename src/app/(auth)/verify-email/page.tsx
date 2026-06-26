import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <MailCheck className="w-8 h-8 text-primary" />
      </div>

      <h1 className="text-2xl font-display font-bold tracking-tight mb-2">
        Check your inbox
      </h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        We've sent a verification link to your email address. Click the link to
        activate your account.
      </p>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Didn't receive the email?
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}