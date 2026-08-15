import { z } from "zod";
import type { TranslationKey } from "@/lib/i18n";

export type TranslateFn = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export function createLoginSchema(t: TranslateFn) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("login.emailRequired")),
    password: z.string().min(1, t("login.passwordRequired")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createForgotPasswordSchema(t: TranslateFn) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("forgotPassword.emailRequired"))
      .email(t("validation.email")),
  });
}

export type ForgotPasswordFormValues = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;

export function createResetPasswordSchema(t: TranslateFn) {
  return z
    .object({
      password: z
        .string()
        .min(1, t("resetPassword.passwordRequired"))
        .min(8, t("resetPassword.weakPasswordDescription")),
      confirmPassword: z
        .string()
        .min(1, t("resetPassword.confirmRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("resetPassword.mismatchDescription"),
      path: ["confirmPassword"],
    });
}

export type ResetPasswordFormValues = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;

export function createUserRegisterSchema(t: TranslateFn) {
  return z
    .object({
      name: z.string().trim().min(1, t("register.nameRequired")),
      email: z
        .string()
        .trim()
        .min(1, t("register.emailRequired"))
        .email(t("validation.email")),
      password: z
        .string()
        .min(1, t("register.passwordRequired"))
        .min(8, t("resetPassword.weakPasswordDescription")),
      confirmPassword: z.string().min(1, t("register.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("register.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type UserRegisterFormValues = z.infer<
  ReturnType<typeof createUserRegisterSchema>
>;

export const userRegisterStepFields = {
  0: ["name", "email"] as const,
  1: ["password", "confirmPassword"] as const,
};

export const userRegisterDefaultValues: UserRegisterFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function createRegisterSchema(t: TranslateFn) {
  return z
    .object({
      name: z.string().trim().min(1, t("register.nameRequired")),
      email: z
        .string()
        .trim()
        .min(1, t("register.emailRequired"))
        .email(t("validation.email")),
      phone: z.string().trim().min(1, t("register.phoneRequired")),
      bio: z.string().refine((value) => {
        const length = value.trim().length;
        return length === 0 || (length >= 50 && length <= 100);
      }, t("register.bioInvalid")),
      jawazNumber: z.string().trim().min(1, t("register.jawazNumberRequired")),
      jawazImages: z
        .array(z.instanceof(File))
        .refine(
          (files) => files.length >= 2 && files.length <= 3,
          t("register.jawazImagesRequired"),
        ),
      profilePhoto: z.instanceof(File).nullable(),
      coverPhoto: z.instanceof(File).nullable(),
      password: z
        .string()
        .min(1, t("register.passwordRequired"))
        .min(8, t("resetPassword.weakPasswordDescription")),
      confirmPassword: z.string().min(1, t("register.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("register.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export const registerStepFields = {
  0: ["name", "email", "phone", "bio"] as const,
  1: ["jawazNumber", "jawazImages"] as const,
  2: ["password", "confirmPassword"] as const,
};

export const registerDefaultValues: RegisterFormValues = {
  name: "",
  email: "",
  phone: "",
  bio: "",
  jawazNumber: "",
  jawazImages: [],
  profilePhoto: null,
  coverPhoto: null,
  password: "",
  confirmPassword: "",
};
