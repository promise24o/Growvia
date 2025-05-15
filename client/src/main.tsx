import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

// Main application render
createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <App />
    </QueryClientProvider>
  </ThemeProvider>
);
