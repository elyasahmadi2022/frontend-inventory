import {
  baseControlClass,
  fieldToneClasses,
  joinClasses,
  type FormControlTone,
} from "@/components/common/form-control";

/** Form controls that follow the active site theme (light + dark). */
export const ADMIN_SETTINGS_FIELD_TONE: FormControlTone = "light";

const fieldStyles = fieldToneClasses[ADMIN_SETTINGS_FIELD_TONE];

export const adminSettingsTextareaClass = joinClasses(
  baseControlClass,
  fieldStyles.control,
  "min-h-24 resize-y py-2",
);

export const adminSettingsNativeInputClass = joinClasses(
  baseControlClass,
  fieldStyles.control,
);
