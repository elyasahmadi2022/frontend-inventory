"use client";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LayoutProvider } from "@/context/LayoutContext";
export default function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth allowedRoles={["manager", "user"]}>
      <section className="mx-auto w-full">
        <LayoutProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </LayoutProvider>
      </section>
    </RequireAuth>
  );
}
