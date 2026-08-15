"use client";
import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
type AdminPlaceholderPageProps = {
  title: string;
  section?: string;
  description?: string;
  children?: ReactNode;
};

export function AdminPlaceholderPage({
  title,
  section,
  description = "This section is planned for a future release. Navigation is wired so you can review the full admin information architecture.",
  children,
}: AdminPlaceholderPageProps) {
  return (
    <div className="space-y-0">
      <AdminPageHeader
        eyebrow={section ?? "Admin console"}
        title={title}
        description={description}
       
      />
      <div className="p-4 sm:p-5">
        <div className="border border-dashed border-light-border bg-light-surface p-8 text-center dark:border-dark-border dark:bg-dark-surface sm:p-10">
          <p className="text-sm font-medium text-light-text dark:text-dark-text">
            Coming soon
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{description}</p>
          {children}
        </div>
      </div>

     
      
    </div>
  );
}
