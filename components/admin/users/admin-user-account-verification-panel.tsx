"use client";
import { gooeyToast } from "goey-toast";

import clsx from "clsx";
import { CheckCircle2, MailCheck, ShieldCheck, UserCheck } from "lucide-react";
import { useState } from "react";
import { AdminDetailSection } from "@/components/admin/admin-detail-layout";
import { LoaderMini } from "@/components/common/loader-mini";
import StatusPill from "@/components/common/status-pill";
import { ApiError } from "@/lib/api";
import { useUpdateAdminUserEmailVerificationMutation } from "@/lib/query/hooks";
import type { AdminUserDetail } from "@/services/admin-users.service";

const VERIFICATION_STEPS = [
  {
    id: "account",
    label: "Review account details",
    description: "Confirm the name, email, and address information look legitimate.",
    icon: UserCheck,
  },
  {
    id: "email",
    label: "Confirm email ownership",
    description: "Contact the user if needed, then proceed only when the email is trustworthy.",
    icon: MailCheck,
  },
  {
    id: "decision",
    label: "Mark account as verified",
    description: "Verified users can access protected marketplace features that require a trusted account.",
    icon: ShieldCheck,
  },
] as const;

type AdminUserAccountVerificationPanelProps = {
  user: AdminUserDetail;
  onUpdated: (user: AdminUserDetail) => void;
};

export function isRegularUserAccount(user: AdminUserDetail): boolean {
  return (
    !user.isDeleted &&
    user.role.toLowerCase() === "user" &&
    !user.ownerDetail
  );
}

export function AdminUserAccountVerificationPanel({
  user,
  onUpdated,
}: AdminUserAccountVerificationPanelProps) {
  const updateVerification = useUpdateAdminUserEmailVerificationMutation();
  const [submitting, setSubmitting] = useState<"verified" | "unverified" | null>(
    null,
  );
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const allStepsComplete = completedSteps.length >= VERIFICATION_STEPS.length;
  const verified = user.isEmailVerified;

  function toggleStep(stepId: string) {
    setCompletedSteps((current) =>
      current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId],
    );
  }

  async function submit(action: "verified" | "unverified") {
    setSubmitting(action);
    try {
      const updated = await updateVerification.mutateAsync({
        id: user.id,
        action,
      });
      onUpdated(updated);
      setCompletedSteps([]);
      gooeyToast.success(action === "verified" ? "Account verified" : "Verification revoked", {
        description: action === "verified"
            ? `${user.name} is now marked as email verified.`
            : `${user.name} is marked as email unverified.`,
      })
    } catch (error) {
      gooeyToast.error("Verification update failed", {
        description: error instanceof ApiError ? error.message : "Could not update verification.",
      })
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <AdminDetailSection
      title="Account verification"
      description="Regular users are verified manually by confirming their email and account details."
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label={verified ? "Verified" : "Pending verification"}
          variant={verified ? "success" : "warning"}
        />
        <StatusPill label="Regular user" variant="neutral" />
      </div>

      <ol className="mt-5 space-y-3">
        {VERIFICATION_STEPS.map((step, index) => {
          const done = completedSteps.includes(step.id);
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className={clsx(
                "border p-4 transition dark:border-dark-border",
                done
                  ? "border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10"
                  : "border-light-border bg-light-bg dark:bg-dark-bg",
              )}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={clsx(
                    "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25",
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-light-border bg-light-surface text-muted dark:border-dark-border dark:bg-dark-surface",
                  )}
                  aria-pressed={done}
                  aria-label={`Mark step ${index + 1} complete`}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-primary-600 dark:text-primary-500" />
                    <p className="font-medium text-light-text dark:text-dark-text">
                      {step.label}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{step.description}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        {!verified ? (
          <button
            type="button"
            disabled={!allStepsComplete || submitting !== null}
            onClick={() => void submit("verified")}
            className="inline-flex items-center gap-1.5 border border-primary-500/30 bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting === "verified" ? (
              <LoaderMini size={16} color="currentColor" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            <span>{submitting === "verified" ? "Verifying" : "Verify account"}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => void submit("unverified")}
            className="inline-flex items-center gap-1.5 border border-light-border bg-light-bg px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-amber-500 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
          >
            {submitting === "unverified" ? (
              <>
                <LoaderMini size={16} color="currentColor" />
                <span>Updating</span>
              </>
            ) : (
              "Revoke verification"
            )}
          </button>
        )}
      </div>

      {!verified && !allStepsComplete ? (
        <p className="mt-3 text-xs text-muted">
          Complete all checklist steps before verifying this account.
        </p>
      ) : null}
    </AdminDetailSection>
  );
}
