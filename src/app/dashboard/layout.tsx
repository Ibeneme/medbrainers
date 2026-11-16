"use client";

import { Suspense } from "react";
import ReduxProvider from "@/components/providers/redux-provider";
import { ThemeProvider } from "@/contexts/theme-context";
import DashboardLayout from "@/components/layouts/dashboard_layout";
import { DashboardI18nProvider } from "@/i18n/dashboard-provider";
import { ToastProvider } from "@/contexts/toast-context";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <DashboardI18nProvider>
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <DashboardLayout>{children}</DashboardLayout>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </DashboardI18nProvider>
    </ReduxProvider>
  );
}