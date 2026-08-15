"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Mail, Shield, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { FormInputField } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCreateAdminUserMutation } from "@/lib/query/hooks";
import {
  adminUserDefaultValues,
  createAdminUserSchema,
  type AdminUserFormValues,
} from "@/lib/validation/admin-user-schemas";

type AdminCreateUserModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminCreateUserModal({
  open,
  onClose,
}: AdminCreateUserModalProps) {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const createUserMutation = useCreateAdminUserMutation();
  const schema = useMemo(() => createAdminUserSchema(t), [t]);

  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: adminUserDefaultValues,
    mode: "onTouched",
  });

  const roleName = form.watch("roleName");

  useEffect(() => {
    if (!open) return;
    form.reset(adminUserDefaultValues);
    setShowPassword(false);
  }, [form, open]);

  const roleOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: "admin",
        label: t("admin.users.role.admin"),
        description: t("admin.users.role.adminDescription"),
        icon: <Shield className="size-4" />,
      },
      {
        value: "manager",
        label: t("admin.users.role.manager"),
        description: t("admin.users.role.managerDescription"),
        icon: <Shield className="size-4" />,
      },
      {
        value: "staff",
        label: t("admin.users.role.staff"),
        description: t("admin.users.role.staffDescription"),
        icon: <User className="size-4" />,
      },
    ],
    [t],
  );

  const closeModal = () => {
    if (createUserMutation.isPending) return;
    onClose();
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      const created = await createUserMutation.mutateAsync({
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        roleNames: [values.roleName],
      });

      gooeyToast.success(t("admin.users.create.successTitle"), {
        description: t("admin.users.create.successDescription", {
          name: created.name,
        }),
      });
      onClose();
      form.reset(adminUserDefaultValues);
    } catch (error) {
      gooeyToast.error(t("admin.users.create.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.users.create.errorFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={t("admin.users.create.title")}
      description={t("admin.users.create.description")}
      submitLabel={t("admin.users.create.submit")}
      submittingLabel={t("admin.users.create.submitting")}
      cancelLabel={t("admin.users.create.cancel")}
      closeLabel={t("admin.users.create.close")}
      submitting={createUserMutation.isPending}
      onClose={closeModal}
      onSubmit={() => void submit()}
      panelClassName=""
      contentClassName=""
    >
      <FormInputField
        control={form.control}
        name="fullName"
        id="admin-create-user-full-name"
        label={t("admin.users.create.fullName")}
        placeholder={t("admin.users.create.fullNamePlaceholder")}
        autoComplete="name"
        startIcon={<User className="size-4" />}
        tone="light"
        containerClassName="sm:col-span-2"
      />
      <FormInputField
        control={form.control}
        name="username"
        id="admin-create-user-username"
        label={t("admin.users.username")}
        placeholder={t("admin.users.create.usernamePlaceholder")}
        autoComplete="username"
        startIcon={<User className="size-4" />}
        tone="light"
        containerClassName="mb-0"
      />


      <Controller
        control={form.control}
        name="roleName"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.users.column.role")}
            options={roleOptions}
            value={field.value}
            onValueChange={field.onChange}
            error={fieldState.error?.message}
            tone="light"
            searchable={false}
            clearable={false}
            contentClassName="z-[1200]"
          />
        )}
      />
      <FormInputField
        control={form.control}
        name="email"
        id="admin-create-user-email"
        type="email"
        label={t("admin.users.column.email")}
        placeholder={t("admin.users.create.emailPlaceholder")}
        autoComplete="email"
        startIcon={<Mail className="size-4" />}
        tone="light"
        containerClassName="col-span-2"
      />


      <FormInputField
        control={form.control}
        name="password"
        id="admin-create-user-password"
        type={showPassword ? "text" : "password"}
        label={t("admin.users.create.password")}
        placeholder={t("admin.users.create.passwordPlaceholder")}
        autoComplete="new-password"
        startIcon={<KeyRound className="size-4" />}
        tone="light"
      />

      <FormInputField
        control={form.control}
        name="confirmPassword"
        id="admin-create-user-confirm-password"
        type={showPassword ? "text" : "password"}
        label={t("admin.users.create.confirmPassword")}
        placeholder={t("admin.users.create.confirmPasswordPlaceholder")}
        autoComplete="new-password"
        startIcon={<KeyRound className="size-4" />}
        endIcon={
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={
              showPassword
                ? t("admin.users.create.hidePassword")
                : t("admin.users.create.showPassword")
            }
            className="grid h-8 w-8 place-items-center text-light-muted transition hover:bg-primary-50 hover:text-primary-600 dark:text-dark-muted dark:hover:bg-primary-500/10"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        }
        tone="light"
      />
    </FormModal>
  );
}
