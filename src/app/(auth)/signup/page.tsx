import type { Metadata } from "next";
import { SignUpForm } from "@/components/forms/signup-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function SignUpPage() {
  return <SignUpForm />;
}