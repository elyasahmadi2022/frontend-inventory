"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

export function AdminUsersReportsIndexContent({
  embedded = false,
}: { embedded?: boolean } = {}) {
  return (
    <div className={embedded ? "space-y-4" : "space-y-0"}>
      {!embedded ? (
        <AdminPageHeader
          eyebrow="Users"
          title="Property reports"
          description="Listing reports submitted by users. Open a user record to see reports filed by that account."
        />
      ) : null}

      <div className="border border-light-border bg-light-surface p-5 text-sm text-light-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-muted">
        User activity and audit reports will connect to the store reporting API
        here. For now, use the main Reports module for accounting, inventory,
        sales, purchase, and transfer reports.
      </div>
    </div>
  );
}
