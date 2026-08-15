import { getApiBaseUrl } from "@/lib/api";

const DEFAULT_PROFILE_URL = "https://res.cloudinary.com/davztqmx7/image/upload/v1777183945/real-estate/defaults/default-profile.png";
const DEFAULT_COVER_URL = "https://res.cloudinary.com/davztqmx7/image/upload/v1777183944/real-estate/defaults/default-cover.jpg";

/**
 * Resolves an image URL from the API response.
 * - Cloudinary URLs (https://) are returned as-is.
 * - null/undefined returns the appropriate default Cloudinary URL.
 */
export function resolveUploadAssetUrl(
  storedPath: string | null | undefined,
  type: "profile" | "cover" | "other" = "other",
): string | null {
  if (storedPath == null || typeof storedPath !== "string" || !storedPath.trim()) {
    if (type === "profile") return DEFAULT_PROFILE_URL;
    if (type === "cover") return DEFAULT_COVER_URL;
    return null;
  }
  const value = storedPath.trim();
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }
  if (value.startsWith("/") || value.startsWith("uploads/")) {
    const base = getApiBaseUrl().replace(/\/+$/, "");
    const path = `/${value.replace(/^\/+/, "")}`;
    return base ? `${base}${path}` : path;
  }
  return value;
}
