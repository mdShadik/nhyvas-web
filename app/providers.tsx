"use client";

import "@/i18n";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { queryClient as sharedQueryClient } from "@/services/queryClient";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Toaster } from "@/components/ui/toaster";
import { NotificationManager } from "@/components/notifications/NotificationManager";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => sharedQueryClient);
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <NotificationManager />
            {children}
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
