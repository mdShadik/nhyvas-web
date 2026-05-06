"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { queryClient as sharedQueryClient } from "@/services/queryClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => sharedQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

