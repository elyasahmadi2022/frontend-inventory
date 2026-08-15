"use client";

import { FormModal } from "@/components/common/form-modal";

export const DEFAULT_ASK_VERIFY_MESSAGE =
  "Please verify your email address to keep your account active. Unverified accounts may be suspended or closed. Log in, open the verification page, and request a code to confirm your email.";

type AdminAskVerifyModalProps = {
  open: boolean;
  userName: string;
  message: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onMessageChange: (value: string) => void;
};

export function AdminAskVerifyModal({
  open,
  userName,
  message,
  submitting = false,
  onClose,
  onSubmit,
  onMessageChange,
}: AdminAskVerifyModalProps) {
  return (
    <FormModal
      open={open}
      title={`Ask ${userName} to verify`}
      description="We will notify the user in their account and by email. They must log in and request a verification code themselves."
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      submitLabel="Send verification notice"
    >
      <div className="sm:col-span-2">
        <label
          htmlFor="ask-verify-message"
          className="mb-1.5 block text-sm font-medium text-light-text dark:text-dark-text"
        >
          Message to user
        </label>
        <textarea
          id="ask-verify-message"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          rows={4}
          maxLength={500}
          className="w-full border border-light-border bg-light-bg px-3 py-2.5 text-sm text-light-text outline-none transition focus:border-primary-500 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
          placeholder={DEFAULT_ASK_VERIFY_MESSAGE}
        />
      </div>
    </FormModal>
  );
}
