export function parseAdminRouteId(
  idParam: string | string[] | undefined,
): number {
  const raw =
    typeof idParam === "string"
      ? idParam
      : Array.isArray(idParam)
        ? idParam[0] ?? ""
        : "";
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : NaN;
}

export function isValidAdminRouteId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

export function parseAdminRouteStringId(
  idParam: string | string[] | undefined,
): string {
  const raw =
    typeof idParam === "string"
      ? idParam
      : Array.isArray(idParam)
        ? idParam[0] ?? ""
        : "";
  return raw.trim();
}

export function isValidAdminRouteStringId(id: string): boolean {
  return id.length > 0;
}
