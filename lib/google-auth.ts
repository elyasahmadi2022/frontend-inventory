/** Google OAuth Web client ID (public). Must match Backend GOOGLE_CLIENT_ID. */
export function getGoogleClientId(): string | null {
  const value = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return value ? value : null;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getGoogleClientId());
}
