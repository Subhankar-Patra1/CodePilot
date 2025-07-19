// Make this a client component to manage theme state
"use client";

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebarContent } from "@/components/layout/app-sidebar-content";
import { useState, useEffect } from "react";

// Although this is a client component, we can't export metadata directly.
// Next.js will handle the <head> tags we are providing below.
// For more advanced, dynamic metadata, one would typically use a Server Component parent.
// const metadata: Metadata = {
//   title: {
//     default: 'CodePilot - AI-Powered Code Review',
//     template: '%s | CodePilot',
//   },
//   description: 'Get instant, AI-powered code reviews for over 20 programming languages. Improve code quality, find bugs, and learn best practices with CodePilot.',
//   keywords: ['AI code review', 'code analysis', 'programming assistant', 'CodePilot', 'developer tools', 'software quality'],
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setTheme] = useState<string>("dark"); // Default to dark

  useEffect(() => {
    const storedTheme = localStorage.getItem("codepilot-theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
    localStorage.setItem("codepilot-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    // The suppressHydrationWarning is important when dynamically changing classNames on <html>
    <html lang="en" className={theme} suppressHydrationWarning>
      <head>
        <title>CodePilot – AI Code Review Tool</title>
        <meta
          name="description"
          content="Codepilot will help to analyze error and bugs in the code and give improved code."
        />
        <link rel="canonical" href="https://your-domain.com/" />
        <meta property="og:title" content="CodePilot – AI Code Review Tool" />
        <meta
          property="og:description"
          content="Codepilot will help to analyze error and bugs in the code and give improved code."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://your-domain.com/" />
        <meta property="og:image" content="/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CodePilot – AI Code Review Tool" />
        <meta
          name="twitter:description"
          content="Codepilot will help to analyze error and bugs in the code and give improved code."
        />
        <meta name="twitter:image" content="/logo.png" />
        <meta
          name="keywords"
          content="AI code review, code analysis, programming assistant, CodePilot, developer tools, software quality"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <SidebarProvider defaultOpen={true}>
          <Sidebar collapsible="icon" variant="sidebar" side="left">
            <AppSidebarContent currentTheme={theme} toggleTheme={toggleTheme} />
          </Sidebar>
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
