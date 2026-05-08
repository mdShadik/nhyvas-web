"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { queryClient as sharedQueryClient } from "@/services/queryClient";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Toaster } from "@/components/ui/toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => sharedQueryClient);
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
