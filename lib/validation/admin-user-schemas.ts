import { z } from "zod";
import type { TranslateFn } from "@/lib/validation/auth-schemas";

const multilingualNamePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;
const multilingualUsernamePattern = /^[\p{L}\p{M}\p{N}._-]+$/u;

export function createAdminUserSchema(t: TranslateFn) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(1, t("admin.users.validation.fullNameRequired"))
        .min(2, t("admin.users.validation.fullNameMin"))
        .regex(
          multilingualNamePattern,
          t("admin.users.validation.fullNamePattern"),
        ),
      username: z
        .string()
        .trim()
        .min(1, t("admin.users.validation.usernameRequired"))
        .min(3, t("admin.users.validation.usernameMin"))
        .max(50, t("admin.users.validation.usernameMax"))
        .regex(
          multilingualUsernamePattern,
          t("admin.users.validation.usernamePattern"),
        ),
      email: z
        .string()
        .trim()
        .min(1, t("admin.users.validation.emailRequired"))
        .email(t("validation.email")),
      roleName: z.enum(["admin", "manager", "staff"], {
        error: t("admin.users.validation.roleRequired"),
      }),
      password: z
        .string()
        .min(1, t("admin.users.validation.passwordRequired"))
        .min(8, t("admin.users.validation.passwordMin")),
      confirmPassword: z
        .string()
        .min(1, t("admin.users.validation.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("admin.users.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type AdminUserFormValues = z.infer<
  ReturnType<typeof createAdminUserSchema>
>;

export const adminUserDefaultValues: AdminUserFormValues = {
  fullName: "",
  username: "",
  email: "",
  roleName: "staff",
  password: "",
  confirmPassword: "",
};
