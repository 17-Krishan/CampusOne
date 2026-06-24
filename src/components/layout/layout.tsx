import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/layout/providers";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CampusOne — AI Campus Operating System",
    template: "%s · CampusOne",
  },
  description:
    "The AI-powered campus operating system. Manage attendance, notes, placements, quizzes, community and more — all in one place.",
  keywords: [
    "campus",
    "student",
    "AI",
    "attendance",
    "placement",
    "notes",
    "quiz",
  ],
  authors: [{ name: "CampusOne" }],
  creator: "CampusOne",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "CampusOne — AI Campus Operating System",
    description: "The AI-powered campus operating system for modern students.",
    siteName: "CampusOne",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusOne — AI Campus Operating System",
    description: "The AI-powered campus operating system for modern students.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              classNames: {
                toast:
                  "group border border-border bg-background text-foreground shadow-lg",
                title: "text-sm font-medium",
                description: "text-xs text-muted-foreground",
                actionButton: "bg-primary text-primary-foreground",
                cancelButton: "bg-muted text-muted-foreground",
                closeButton:
                  "border border-border bg-background text-foreground",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
