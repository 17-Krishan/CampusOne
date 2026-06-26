"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <MailCheck className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-foreground">
              {getValues("email")}
            </span>
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">
          Reset your password
        </h1>
        <p className="text-muted-foreground mt-1.5">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@college.edu"
            autoComplete="email"
            disabled={isSubmitting}
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sending link…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <Button variant="ghost" className="w-full" asChild>
        <Link href="/login">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Link>
      </Button>
    </div>
  );
}