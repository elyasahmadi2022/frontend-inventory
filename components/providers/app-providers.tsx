"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { BackendStatusOverlay } from "@/components/system/backend-status-overlay";
import { AuthProvider } from "@/context/AuthContext";
import { getGoogleClientId } from "@/lib/google-auth";
import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const googleClientId = getGoogleClientId();

  const providers = (
    <QueryProvider>
      <AuthProvider>
        <BackendStatusOverlay />
        {children}
      </AuthProvider>
    </QueryProvider>
  );

  if (!googleClientId) {
    return providers;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>{providers}</GoogleOAuthProvider>
  );
}
