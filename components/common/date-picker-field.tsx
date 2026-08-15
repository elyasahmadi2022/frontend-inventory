"use client";

import { useId, useState, type ChangeEvent } from "react";
import { CalendarDays, X } from "lucide-react";
import { Popover } from "radix-ui";
import {
  DayFlag,
  SelectionState,
  UI,
  type DropdownProps,
  type Matcher,
} from "react-day-picker";
import { DayPicker as GregorianDayPicker } from "react-day-picker";
import { DayPicker as HijriDayPicker } from "@daypicker/hijri";
import { DayPicker as PersianDayPicker } from "@daypicker/persian";
import {
  baseControlClass,
  FieldFrame,
  fieldToneClasses,
  joinClasses,
  type FormControlTone,
} from "@/components/common/form-control";
import { SelectField } from "@/components/common/select-field";
import { useCalendarPreference } from "@/hooks/use-calendar-preference";
import {
  formatAfghanSolarHijriCaption,
  formatAfghanSolarHijriMonth,
  formatAppDate,
  parseIsoDate,
  toIsoDate,
} from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";

type DatePickerFieldProps = {
  className?: string;
  clearable?: boolean;
  containerClassName?: string;
  contentClassName?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  label?: string;
  max?: string;
  min?: string;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  tone?: FormControlTone;
  value?: string;
};

const dayPickerClassNames = {
  [UI.Root]: "relative p-3 text-sm",
  [UI.Months]: "flex flex-col",
  [UI.Month]: "space-y-3 pt-11",
  [UI.MonthCaption]:
    "absolute inset-x-3 top-3 flex min-h-9 items-center justify-start pe-20 text-sm font-semibold text-light-text dark:text-dark-text",
  [UI.CaptionLabel]: "truncate text-sm font-semibold",
  [UI.Dropdowns]: "grid w-[calc(100%-5rem)] min-w-0 grid-cols-[minmax(9.5rem,1fr)_6.75rem] gap-2",
  [UI.DropdownRoot]: "min-w-0",
  [UI.Dropdown]: "hidden",
  [UI.Nav]: "absolute end-3 top-3 flex h-9 items-center justify-end gap-1",
  [UI.PreviousMonthButton]:
    "inline-flex size-9 items-center justify-center border border-light-border bg-light-bg text-light-text transition hover:border-primary-500/40 hover:bg-primary-500/10 disabled:pointer-events-none disabled:opacity-35 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text",
  [UI.NextMonthButton]:
    "inline-flex size-9 items-center justify-center border border-light-border bg-light-bg text-light-text transition hover:border-primary-500/40 hover:bg-primary-500/10 disabled:pointer-events-none disabled:opacity-35 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text",
  [UI.Chevron]: "size-4",
  [UI.MonthGrid]: "w-full border-collapse",
  [UI.Weekdays]: "grid grid-cols-7",
  [UI.Weekday]:
    "flex h-8 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em] text-light-muted dark:text-dark-muted",
  [UI.Week]: "grid grid-cols-7",
  [UI.Day]: "relative p-0 text-center",
  [UI.DayButton]:
    "inline-flex size-9 items-center justify-center border border-transparent text-sm text-light-text transition hover:border-primary-500/25 hover:bg-primary-500/10 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-dark-text dark:hover:text-primary-300",
  [DayFlag.today]:
    "font-bold text-primary-700 dark:text-primary-300 [&>button]:border-primary-500/50",
  [DayFlag.outside]: "opacity-35",
  [DayFlag.disabled]: "pointer-events-none opacity-30",
  [SelectionState.selected]:
    "[&>button]:bg-primary-500 [&>button]:text-white [&>button]:hover:bg-primary-600 [&>button]:hover:text-white",
};

function DatePickerDropdown({
  options = [],
  value,
  onChange,
  "aria-label": ariaLabel,
  disabled,
}: DropdownProps) {
  return (
    <SelectField
      clearable={false}
      disabled={disabled}
      tone="light"
      value={value == null ? "" : String(value)}
      options={options.map((option) => ({
        value: String(option.value),
        label: option.label,
        disabled: option.disabled,
      }))}
      placeholder={ariaLabel}
      onValueChange={(nextValue) => {
        onChange?.({
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        } as ChangeEvent<HTMLSelectElement>);
      }}
      className="h-9 min-h-9 px-2.5 text-xs font-semibold [min-height:2.25rem]"
      contentClassName="z-[1400]"
    />
  );
}

export function DatePickerField({
  className,
  clearable = true,
  containerClassName,
  contentClassName,
  description,
  disabled,
  error,
  id,
  label,
  max,
  min,
  name,
  onChange,
  placeholder = "Select date",
  required,
  tone = "dark",
  value,
}: DatePickerFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `date-picker-${generatedId}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = error ? errorId : descriptionId;
  const { language } = useI18n();
  const { calendarType } = useCalendarPreference();
  const [isOpen, setIsOpen] = useState(false);
  const styles = fieldToneClasses[tone];
  const selectedDate = parseIsoDate(value);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  const disabledDays: Matcher[] = [];
  if (minDate) disabledDays.push({ before: minDate });
  if (maxDate) disabledDays.push({ after: maxDate });
  const afghanSolarHijriFormatters = {
    formatCaption: (
      date: Date,
      options?: Parameters<typeof formatAfghanSolarHijriCaption>[2],
      dateLib?: Parameters<typeof formatAfghanSolarHijriCaption>[3],
    ) =>
      formatAfghanSolarHijriCaption(date, language, options, dateLib),
    formatMonthDropdown: (
      date: Date,
      dateLib?: Parameters<typeof formatAfghanSolarHijriMonth>[2],
    ) =>
      formatAfghanSolarHijriMonth(date, language, dateLib),
  };
  const commonPickerProps = {
    captionLayout: "dropdown" as const,
    navLayout: "after" as const,
    reverseYears: true,
    fixedWeeks: true,
    showOutsideDays: true,
    selected: selectedDate,
    defaultMonth: selectedDate,
    disabled: disabledDays.length > 0 ? disabledDays : undefined,
    classNames: dayPickerClassNames,
    components: { Dropdown: DatePickerDropdown },
    onSelect: (date: Date | undefined) => {
      if (!date) return;
      onChange?.(toIsoDate(date));
      setIsOpen(false);
    },
  };
  const pickerStyle =
    calendarType === "hijri_shamsi"
      ? {
          fontFamily:
            "var(--font-iranyekan), ui-sans-serif, system-ui, sans-serif",
        }
      : undefined;

  const triggerClass = joinClasses(
    baseControlClass,
    "group flex items-center justify-between gap-2 text-left",
    styles.control,
    error && "border-red-400/70",
    disabled && "cursor-not-allowed opacity-60",
    className,
  );

  return (
    <FieldFrame
      className={containerClassName}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      label={label}
      labelFor={inputId}
      required={required}
      tone={tone}
    >
      <Popover.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            id={inputId}
            type="button"
            disabled={disabled}
            aria-describedby={describedBy}
            className={triggerClass}
          >
            <span
              className={joinClasses(
                "min-w-0 flex-1 truncate",
                !selectedDate && styles.placeholder,
              )}
            >
              {selectedDate
                ? formatAppDate(selectedDate, calendarType, language)
                : placeholder}
            </span>
            <span className="flex shrink-0 items-center gap-1 opacity-70">
              {clearable && value && !disabled ? (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Clear date"
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange?.("");
                  }}
                  className="grid size-6 place-items-center transition hover:bg-black/10"
                >
                  <X className="size-3.5" />
                </span>
              ) : null}
              <CalendarDays className="size-4" strokeWidth={1.75} />
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className={joinClasses(
              "z-[1300] w-[min(24rem,calc(100vw-2rem))] overflow-hidden border border-light-border bg-light-surface shadow-lg dark:border-dark-border dark:bg-dark-surface",
              contentClassName,
            )}
          >
            {calendarType === "hijri_shamsi" ? (
              <PersianDayPicker
                mode="single"
                {...commonPickerProps}
                formatters={afghanSolarHijriFormatters}
                style={pickerStyle}
              />
            ) : calendarType === "hijri_qamari" ? (
              <HijriDayPicker
                mode="single"
                {...commonPickerProps}
              />
            ) : (
              <GregorianDayPicker
                mode="single"
                {...commonPickerProps}
              />
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          readOnly
          required={required}
        />
      ) : null}
    </FieldFrame>
  );
}
