"use client";

import ReduxProvider from "@/components/providers/redux-provider";
import { ThemeProvider } from "@/contexts/theme-context";
import DashboardLayout from "@/components/layouts/dashboard_layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ThemeProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ThemeProvider>
    </ReduxProvider>
  );
}
