"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { InputField, type InputFieldProps } from "@/components/common/input-field";

type FormInputFieldProps<T extends FieldValues> = Omit<
  InputFieldProps,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "ref"
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

export function FormInputField<T extends FieldValues>({
  control,
  name,
  ...props
}: FormInputFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <InputField
          {...props}
          {...field}
          value={field.value ?? ""}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
