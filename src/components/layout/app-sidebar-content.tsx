"use client";

import {
  Bot,
  Settings,
  Sun,
  Moon,
  Pencil,
  Library,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Eye, EyeOff, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AppSidebarContentProps {
  currentTheme: string;
  toggleTheme: () => void;
}

const SidebarToggle = () => {
  const { state, toggleSidebar } = useSidebar();
  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip={{
        children: "Toggle Sidebar",
        className: "bg-sidebar text-sidebar-foreground border-sidebar-border",
      }}
    >
      {state === "expanded" ? <PanelLeft /> : <PanelRight />}
      <span>Toggle Sidebar</span>
    </SidebarMenuButton>
  );
};

const GEMINI_API_KEY_PREFIX = "AIzaSy";
const GEMINI_API_KEY_LENGTH = 39;
const GEMINI_API_KEY_STORAGE = "gemini-api-key";

export function AppSidebarContent({
  currentTheme,
  toggleTheme,
}: AppSidebarContentProps) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();
  const [showApi, setShowApi] = useState(false);
  const [inputError, setInputError] = useState("");

  // Load key from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE);
      if (stored) setApiKey(stored);
    }
  }, []);

  const handleSave = () => {
    if (
      !apiKey.startsWith(GEMINI_API_KEY_PREFIX) ||
      apiKey.length !== GEMINI_API_KEY_LENGTH
    ) {
      setInputError("Wrong or invalid API key.");
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid Gemini API key.",
        variant: "destructive",
      });
      return;
    }
    setInputError("");
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved.",
    });
    setDialogOpen(false);
  };

  const handleReset = () => {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    setApiKey("");
    setInputError("");
    toast({
      title: "API Key Reset",
      description: "Your Gemini API key has been removed.",
      variant: "destructive",
    });
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleNewReviewClick = (e: React.MouseEvent) => {
    // Prevent default navigation
    e.preventDefault();
    // Dispatch a custom event to trigger reset
    window.dispatchEvent(new Event("new-review"));
    // Optionally, navigate to root if not already there
    if (pathname !== "/") {
      window.location.href = "/";
    }
  };

  return (
    <>
      <SidebarHeader className="p-2">
        <div
          className={`flex items-center ${
            state === "expanded" ? "" : "justify-center"
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              state === "expanded" ? "px-2" : ""
            }`}
          >
                 <Bot className="h-7 w-7 text-primary" />
            {state === "expanded" && (
                    <h1 className="font-headline text-xl font-semibold text-sidebar-foreground">
                        CodePilot
                    </h1>
                 )}
            </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 flex-grow">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={{
                children: "New Review",
                className:
                  "bg-sidebar text-sidebar-foreground border-sidebar-border",
              }}
              isActive={pathname === "/"}
            >
              <a href="/" onClick={handleNewReviewClick}>
                <Pencil />
                <span>New Review</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={{
                children: "Library",
                className:
                  "bg-sidebar text-sidebar-foreground border-sidebar-border",
              }}
              isActive={pathname.startsWith("/library")}
            >
              <Link href="/library">
                <Library />
                <span>Library</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarToggle />
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              tooltip={{
                children: `Toggle ${
                  currentTheme === "dark" ? "Light" : "Dark"
                } Mode`,
                className:
                  "bg-sidebar text-sidebar-foreground border-sidebar-border",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {currentTheme === "dark" ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="inline-flex"
                  >
                    <Sun className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="inline-flex"
                  >
                    <Moon className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
              <span>Toggle Theme</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
            <SidebarMenuButton
                  tooltip={{
                    children: "Settings",
                    className:
                      "bg-sidebar text-sidebar-foreground border-sidebar-border",
                  }}
                  onClick={handleOpenDialog}
            >
                <Settings />
                <span>Settings</span>
            </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>
                    Enter your Gemini API key below. It will be stored in your
                    browser only.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="gemini-api-key" className="font-medium">
                      Gemini API Key
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer">
                          <Info size={16} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <span>
                          Get your Gemini API key from{" "}
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Google AI Studio
                          </a>
                          .
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="gemini-api-key"
                      type={showApi ? "text" : "password"}
                      placeholder="Enter Gemini API Key"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setInputError("");
                      }}
                      autoFocus
                      className={inputError ? "border-red-500" : ""}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      tabIndex={-1}
                      onClick={() => setShowApi((v) => !v)}
                      aria-label={showApi ? "Hide API key" : "Show API key"}
                    >
                      {showApi ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {inputError && (
                    <span className="text-red-500 text-sm mt-1">
                      {inputError}
                    </span>
                  )}
                  <button
                    className="bg-primary text-primary-foreground rounded px-4 py-2 mt-2 hover:bg-primary/90"
                    onClick={handleSave}
                    type="button"
                  >
                    Save API Key
                  </button>
                  <button
                    className="bg-destructive text-destructive-foreground rounded px-4 py-2 mt-2 hover:bg-destructive/90"
                    onClick={handleReset}
                    type="button"
                  >
                    Reset
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
