"use client";

import { useGoogleLogin, useGoogleOAuth } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useI18n } from "@/lib/i18n";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

type GoogleSignInButtonProps = {
  loading?: boolean;
  mode?: "login" | "register";
  onBeforeLogin?: () => boolean;
  onSuccess: (payload: { accessToken: string }) => void | Promise<void>;
  onError?: () => void;
};

function GoogleSignInButtonInner({
  loading = false,
  mode = "login",
  onBeforeLogin,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { t } = useI18n();
  const { scriptLoadedSuccessfully } = useGoogleOAuth();

  const login = useGoogleLogin({
    flow: "implicit",
    scope: "openid email profile",
    onSuccess: (response) => {
      if (!response.access_token) return;
      void onSuccess({ accessToken: response.access_token });
    },
    onError: () => onError?.(),
    onNonOAuthError: () => onError?.(),
  });

  const label = loading
    ? t("auth.googleSigningIn")
    : !scriptLoadedSuccessfully
      ? t("auth.googleLoading")
      : mode === "register"
        ? t("auth.googleSignUp")
        : t("auth.googleSignIn");

  function handleClick() {
    if (loading) return;
    if (onBeforeLogin && !onBeforeLogin()) return;
    if (!scriptLoadedSuccessfully) {
      onError?.();
      return;
    }
    login();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-busy={loading || !scriptLoadedSuccessfully}
      className="btn-secondary w-full cursor-pointer gap-2.5"
    >
      <FcGoogle className="size-5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const { t } = useI18n();

  if (!isGoogleAuthConfigured()) {
    return (
      <div className="border border-dashed border-light-border bg-light-bg px-4 py-3 text-center text-xs text-light-muted dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
        {t("auth.googleNotConfigured")}
      </div>
    );
  }

  return <GoogleSignInButtonInner {...props} />;
}
