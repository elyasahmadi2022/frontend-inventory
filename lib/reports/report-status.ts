import type { PropertyReportStatus } from "@/services/reports.service";

export function reportStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "reviewed") return "Reviewed";
  if (normalized === "dismissed") return "Dismissed";
  if (normalized === "actioned") return "Actioned";
  return status;
}

export function reportStatusVariant(
  status: string,
): "success" | "warning" | "error" | "neutral" {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "warning";
  if (normalized === "actioned") return "success";
  if (normalized === "dismissed") return "neutral";
  return "neutral";
}

export const REPORT_STATUS_OPTIONS: {
  value: PropertyReportStatus;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "actioned", label: "Actioned" },
];
