import { resolveUploadAssetUrl } from "@/lib/asset-url";

/**
 * Curated dashboard hero images — used until the owner uploads a cover/profile.
 * Swap these URLs when branded assets are ready.
 */
export const DASHBOARD_DEFAULT_COVER_IMAGE =
  "https://res.cloudinary.com/davztqmx7/image/upload/v1777183944/real-estate/defaults/default-cover.jpg";

export const DASHBOARD_DEFAULT_PROFILE_IMAGE =
  "https://res.cloudinary.com/davztqmx7/image/upload/v1777183945/real-estate/defaults/default-profile.png";

export function resolveDashboardCoverUrl(
  storedPath?: string | null,
): string {
  return (
    resolveUploadAssetUrl(storedPath, "cover") ?? DASHBOARD_DEFAULT_COVER_IMAGE
  );
}

export function resolveDashboardProfileUrl(
  storedPath?: string | null,
): string {
  return (
    resolveUploadAssetUrl(storedPath, "profile") ??
    DASHBOARD_DEFAULT_PROFILE_IMAGE
  );
}

/** Distinct palette for property-type distribution chart. */
export const PROPERTY_TYPE_CHART_COLORS = [
  "#0066ff", // primary — house
  "#0d9488", // teal — apartment
  "#d97706", // amber — land
  "#7c3aed", // violet — commercial
  "#e11d48", // rose — other
] as const;
