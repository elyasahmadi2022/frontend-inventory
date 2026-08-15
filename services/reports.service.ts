import { ApiError, apiRequest } from "@/lib/api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  status: number;
  data?: T;
};

export type PropertyReportStatus =
  | "pending"
  | "reviewed"
  | "dismissed"
  | "actioned";

export type PropertyReportRow = {
  id: number;
  userId: number;
  propertyId: number;
  reason: string;
  description?: string | null;
  status: PropertyReportStatus;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  property?: {
    id: number;
    title: string;
    listingStatus?: string;
    status?: string;
  };
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function createPropertyReport(
  propertyId: number,
  input: { reason: string; description?: string },
): Promise<PropertyReportRow> {
  const response = await apiRequest<ApiEnvelope<{ report: PropertyReportRow }>>(
    `/api/v1/reports/${propertyId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!response.data?.report) {
    throw new ApiError(response.message || "Could not submit report.", {
      status: response.status ?? 500,
    });
  }

  return response.data.report;
}

export async function countPropertyReportsByUser(userId: number): Promise<number> {
  let page = 1;
  let count = 0;

  while (page <= 10) {
    const payload = await fetchPropertyReports({ page, pageSize: 50 });
    count += payload.reports.filter((report) => report.userId === userId).length;
    if (page >= payload.pagination.totalPages) break;
    page += 1;
  }

  return count;
}

export async function fetchPropertyReports(options?: {
  page?: number;
  pageSize?: number;
}): Promise<{ reports: PropertyReportRow[]; pagination: Pagination }> {
  const qs = new URLSearchParams();
  if (options?.page) qs.set("page", String(options.page));
  if (options?.pageSize) qs.set("pageSize", String(options.pageSize));

  const path = qs.toString()
    ? `/api/v1/reports?${qs.toString()}`
    : "/api/v1/reports";

  const response = await apiRequest<
    ApiEnvelope<{ reports: PropertyReportRow[]; pagination: Pagination }>
  >(path, { method: "GET" });

  return {
    reports: response.data?.reports ?? [],
    pagination:
      response.data?.pagination ?? {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
      },
  };
}

export async function updatePropertyReportStatus(
  reportId: number,
  status: PropertyReportStatus,
): Promise<PropertyReportRow> {
  const response = await apiRequest<ApiEnvelope<{ report: PropertyReportRow }>>(
    `/api/v1/reports/${reportId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.data?.report) {
    throw new ApiError(response.message || "Could not update report.", {
      status: response.status ?? 500,
    });
  }

  return response.data.report;
}
