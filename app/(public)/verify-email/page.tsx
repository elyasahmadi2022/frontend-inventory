"use client";

import { LoaderMini } from "@/components/common/loader-mini";
import { ApiError } from "@/lib/api";
import { appRoutes } from "@/routes/app-routes";
import {
  requestPublicEmailVerificationOtp,
  verifyPublicEmailWithOtp,
} from "@/services/auth.service";
import { gooeyToast } from "goey-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 15 * 60;

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function CheckIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function PublicVerifyEmailContent() {
  const searchParams = useSearchParams();
  const normalizedEmail = useMemo(
    () => (searchParams.get("email") ?? "").trim().toLowerCase(),
    [searchParams],
  );
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [secondsLeft, setSecondsLeft] = useState(
    normalizedEmail ? OTP_TTL_SECONDS : 0,
  );
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");
  const canResend = secondsLeft <= 0;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0 || verified) return;
    const id = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft, verified]);

  function updateDigits(nextDigits: string[], focusIndex?: number) {
    setDigits(nextDigits);
    if (focusIndex != null) {
      window.requestAnimationFrame(() => inputRefs.current[focusIndex]?.focus());
    }
  }

  function handleDigitChange(index: number, value: string) {
    const numeric = value.replace(/\D/g, "");
    if (!numeric) {
      const next = [...digits];
      next[index] = "";
      updateDigits(next);
      return;
    }

    const next = [...digits];
    const chars = numeric.slice(0, OTP_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      next[index + offset] = char;
    });
    const nextFocus = Math.min(index + chars.length, OTP_LENGTH - 1);
    updateDigits(next, nextFocus);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      updateDigits(next, index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? "");
    updateDigits(next, Math.min(pasted.length, OTP_LENGTH - 1));
  }

  async function handleSendCode() {
    if (!normalizedEmail) {
      gooeyToast.success("Email Missing", {
        description: "Open the verification link from registration or login again.",
      })

      return;
    }

    setSending(true);
    try {
      await requestPublicEmailVerificationOtp(normalizedEmail);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      setSecondsLeft(OTP_TTL_SECONDS);
      inputRefs.current[0]?.focus();
      gooeyToast.success("Code Send", {
        description: `Check ${normalizedEmail} for a new code.`
      })

    } catch (error) {

      gooeyToast.error("Could not send code", {
        description: error instanceof ApiError ? error.message : "Please try again.",
      })

    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (!normalizedEmail || code.length !== OTP_LENGTH) {
      gooeyToast.error("Verification Code", {
        description: `Enter the ${OTP_LENGTH}-digit code from your email.`,
      })

      return;
    }

    setVerifying(true);
    try {
      await verifyPublicEmailWithOtp({
        email: normalizedEmail,
        code,
      });
      setVerified(true);
      gooeyToast.success("Email verified", {
        description: "You can now log in to your account.",
      })

    } catch (error) {
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();

      gooeyToast.error( "Verification failed",{
        description:
          error instanceof ApiError ? error.message : "Please try again.",
      } )

    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="auth-login-scene relative min-h-screen overflow-hidden bg-light-bg dark:bg-dark-bg">
      <div className="auth-login-grid pointer-events-none absolute inset-0" />
      <div className="auth-login-wash pointer-events-none absolute inset-0" />
      <div className="page-shell flex min-h-screen items-center justify-center py-10">
        
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-email-title"
          className="relative w-full max-w-xl overflow-hidden border border-light-border bg-light-surface shadow-2xl dark:border-dark-border dark:bg-dark-surface"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-primary-500" />
          <div className="border-b border-light-border bg-light-bg/70 px-6 py-5 dark:border-dark-border dark:bg-dark-bg/70 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              
              <span className="border border-primary-500/25 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                Secure OTP
              </span>
            </div>
          </div>

          {verified ? (
            <div className="p-6 text-center sm:p-8">
              <div className="mx-auto grid size-14 place-items-center border border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckIcon />
              </div>
              <h1
                id="verify-email-title"
                className="mt-5 text-2xl font-semibold text-light-text dark:text-dark-text"
              >
                Email verified
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Your account is active now. Continue to login.
              </p>
              <Link href={appRoutes.login} className="btn-primary mt-6 inline-flex">
                Go to login
              </Link>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500">
                Verify email
              </p>
              <h1
                id="verify-email-title"
                className="mt-2 text-3xl font-semibold tracking-tight text-light-text dark:text-dark-text"
              >
                Enter verification code
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                We sent a {OTP_LENGTH}-digit code to{" "}
                <span className="font-semibold text-light-text dark:text-dark-text">
                  {normalizedEmail || "your email"}
                </span>
                . Enter it below to activate your account.
              </p>

              {!normalizedEmail ? (
                <div className="mt-5 border border-amber-400/30 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                  The verification link is missing an email address. Please go
                  back to register or login and try again.
                </div>
              ) : null}

              <div className="mt-7">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Verification code
                </label>
                <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-3">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => {
                        inputRefs.current[index] = node;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      value={digit}
                      maxLength={1}
                      onChange={(event) =>
                        handleDigitChange(index, event.target.value)
                      }
                      onKeyDown={(event) => handleKeyDown(index, event)}
                      onPaste={handlePaste}
                      aria-label={`Verification digit ${index + 1}`}
                      className="h-12 w-full border border-light-border bg-light-bg text-center text-xl font-semibold text-light-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text sm:h-14"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-light-border bg-light-bg p-3 text-sm dark:border-dark-border dark:bg-dark-bg">
                <div>
                  <p className="font-semibold text-light-text dark:text-dark-text">
                    Code expires in {formatTimer(secondsLeft)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Didn&apos;t receive it? You can request a new code after the timer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSendCode()}
                  disabled={!canResend || sending || !normalizedEmail}
                  className="inline-flex min-h-10 items-center justify-center gap-2 border border-light-border bg-light-surface px-4 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:hover:text-primary-500"
                >
                  {sending ? (
                    <>
                      <LoaderMini size={16} color="currentColor" />
                      <span>Sending</span>
                    </>
                  ) : (
                    "Resend code"
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleVerify()}
                disabled={
                  verifying || code.length !== OTP_LENGTH || !normalizedEmail
                }
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-none border border-primary-500 bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-primary-600 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <LoaderMini size={16} color="currentColor" />
                    <span>Verifying</span>
                  </>
                ) : (
                  "Verify and continue"
                )}
              </button>

              <p className="mt-5 text-center text-sm text-light-muted dark:text-dark-muted">
                Already verified?{" "}
                <Link
                  href={appRoutes.login}
                  className="font-semibold text-primary-600 hover:underline dark:text-primary-500"
                >
                  Log in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PublicVerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-login-scene relative min-h-screen overflow-hidden bg-light-bg dark:bg-dark-bg">
          <div className="page-shell flex min-h-screen items-center justify-center py-10">
            <div className="w-full max-w-xl border border-light-border bg-light-surface p-8 dark:border-dark-border dark:bg-dark-surface">
              <LoaderMini size={22} color="currentColor" />
            </div>
          </div>
        </main>
      }
    >
      <PublicVerifyEmailContent />
    </Suspense>
  );
}
