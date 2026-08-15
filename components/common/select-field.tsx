"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Popover } from "radix-ui";
import {
  baseControlClass,
  FieldFrame,
  fieldToneClasses,
  joinClasses,
  type FormControlTone,
} from "@/components/common/form-control";
import {
  interactiveListDescriptionClass as selectOptionDescriptionClass,
  interactiveListIconClass as selectOptionIconClass,
  interactiveListRowSelectedClass as selectOptionRowSelectedClass,
  interactiveSelectOptionRowClass as selectOptionRowClass,
} from "@/components/common/interactive-list-styles";
import { LoaderMini } from "@/components/common/loader-mini";
import { useI18n } from "@/lib/i18n";

export type SelectOption = {
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  searchText?: string;
  value: string;
};

export type SelectOptionGroup = {
  label: string;
  options: SelectOption[];
};

export type SelectOptions = SelectOption[] | SelectOptionGroup[];

export type SelectFieldProps = {
  className?: string;
  clearable?: boolean;
  contentClassName?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  description?: string;
  disabled?: boolean;
  emptyText?: string;
  error?: string;
  label?: string;
  loading?: boolean;
  maxHeight?: number;
  name?: string;
  onChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onSearchChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  open?: boolean;
  options: SelectOptions;
  placeholder?: string;
  renderOption?: (option: SelectOption) => ReactNode;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  tone?: FormControlTone;
  value?: string;
};

function containsPersianOrPashtoText(value?: string | null): boolean {
  if (!value) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value);
}

function optionTextClass(text?: string | null): string | undefined {
  return containsPersianOrPashtoText(text)
    ? "[font-family:var(--font-locale)]"
    : undefined;
}

function isGroupedOptions(
  options: SelectOptions,
): options is SelectOptionGroup[] {
  return options.length > 0 && "options" in options[0];
}

export function normalizeSelectOptions(
  options: SelectOptions,
): SelectOptionGroup[] {
  return isGroupedOptions(options) ? options : [{ label: "", options }];
}

export function flattenSelectOptions(
  groups: SelectOptionGroup[],
): SelectOption[] {
  return groups.flatMap((group) => group.options);
}

/** Full-row primary hover — re-exported for consumers. */
export {
  interactiveListCheckboxClass as selectOptionCheckboxClass,
  interactiveListDescriptionClass as selectOptionDescriptionClass,
  interactiveListIconClass as selectOptionIconClass,
  interactiveListRowSelectedClass as selectOptionRowSelectedClass,
  interactiveSelectOptionRadixItemClass as selectOptionRadixItemClass,
  interactiveSelectOptionRowClass as selectOptionRowClass,
} from "@/components/common/interactive-list-styles";

export const selectOptionRowFocusedClass =
  "bg-primary-500 text-white font-normal";

export function HighlightedText({
  query,
  text,
}: {
  query: string;
  text: string;
}) {
  const normalized = query.trim().toLocaleLowerCase();
  const index = text.toLocaleLowerCase().indexOf(normalized);
  if (!normalized || index < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary-100 px-0.5 text-current group-hover:bg-white/25 group-hover:text-inherit dark:bg-primary-500/20">
        {text.slice(index, index + normalized.length)}
      </mark>
      {text.slice(index + normalized.length)}
    </>
  );
}

export function ChevronIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={joinClasses("transition-transform", open && "rotate-180")}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function SelectField({
  className,
  clearable = true,
  contentClassName,
  defaultOpen = false,
  defaultValue = "",
  description,
  disabled,
  emptyText,
  error,
  label,
  loading = false,
  maxHeight = 300,
  name,
  onChange,
  onOpenChange,
  onSearchChange,
  onValueChange,
  open: controlledOpen,
  options,
  placeholder,
  renderOption,
  required,
  searchable = false,
  searchPlaceholder,
  searchValue,
  tone = "dark",
  value,
}: SelectFieldProps) {
  const { t } = useI18n();
  const resolvedEmptyText = emptyText ?? t("common.select.noResults");
  const resolvedPlaceholder = placeholder ?? t("common.select.placeholder");
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t("common.select.searchPlaceholder");
  const generatedId = useId();
  const triggerId = `select-${generatedId}`;
  const listboxId = `${triggerId}-listbox`;
  const descriptionId = description ? `${triggerId}-description` : undefined;
  const errorId = error ? `${triggerId}-error` : undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalQuery, setInternalQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedValue = value ?? internalValue;
  const open = controlledOpen ?? internalOpen;
  const query = searchValue ?? internalQuery;
  const groups = useMemo(() => normalizeSelectOptions(options), [options]);
  const flatOptions = useMemo(() => flattenSelectOptions(groups), [groups]);
  const selectedOption = flatOptions.find(
    (option) => option.value === selectedValue,
  );
  const styles = fieldToneClasses[tone];
  const describedBy = error ? errorId : descriptionId;

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return groups;
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter((option) =>
          `${option.label} ${option.description ?? ""} ${option.searchText ?? ""}`
            .toLocaleLowerCase()
            .includes(normalized),
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query]);

  const filteredOptions = useMemo(
    () => flattenSelectOptions(filteredGroups),
    [filteredGroups],
  );

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(nextOpen);
      if (nextOpen) setFocusedIndex(-1);
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  const setQuery = useCallback(
    (nextQuery: string) => {
      if (searchValue === undefined) setInternalQuery(nextQuery);
      onSearchChange?.(nextQuery);
    },
    [onSearchChange, searchValue],
  );

  useEffect(() => {
    if (!open || !searchable) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);

  useEffect(() => {
    if (!open || !searchable || focusedIndex < 0) return;
    optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex, open, searchable]);

  function commitValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    onChange?.(nextValue);
    setOpen(false);
    setQuery("");
  }

  function clearValue() {
    commitValue("");
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((current) =>
        Math.min(current + 1, filteredOptions.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[focusedIndex];
      if (option && !option.disabled) commitValue(option.value);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const triggerClass = joinClasses(
    baseControlClass,
    "group flex items-center justify-between gap-2 text-left",
    styles.control,
    error && "border-red-400/70",
    open && "border-primary-500 ring-2 ring-primary-500/15",
    className,
  );

  return (
    <FieldFrame
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      label={label}
      labelFor={triggerId}
      required={required}
      tone={tone}
    >
      <Popover.Root modal={false} open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Popover.Trigger asChild>
            <button
              id={triggerId}
              type="button"
              disabled={disabled}
              aria-describedby={describedBy}
              aria-controls={listboxId}
              aria-haspopup="listbox"
              aria-expanded={open}
              className={triggerClass}
            >
              <span
                className={joinClasses(
                  "flex min-w-0 flex-1 items-center gap-2",
                  !selectedOption && styles.placeholder,
                )}
              >
                {selectedOption?.icon ? (
                  <span className="shrink-0" aria-hidden="true">
                    {selectedOption.icon}
                  </span>
                ) : null}
                <span
                  dir="auto"
                  className={joinClasses(
                    "truncate [unicode-bidi:plaintext]",
                    optionTextClass(selectedOption?.label),
                  )}
                >
                  {selectedOption?.label ?? resolvedPlaceholder}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 opacity-60">
                {clearable && selectedOption && !disabled ? (
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={t("common.select.clearSelection")}
                    onClick={(event) => {
                      event.stopPropagation();
                      clearValue();
                    }}
                    className="grid h-6 w-6 place-items-center rounded-none transition hover:bg-black/10 hover:opacity-100"
                  >
                    <CloseIcon />
                  </span>
                ) : null}
                <ChevronIcon open={open} />
              </span>
            </button>
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={5}
            collisionPadding={12}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            className={joinClasses(
              "z-1100 w-(--radix-popover-trigger-width) overflow-hidden rounded-none border p-1 ",
              styles.panel,
              contentClassName,
            )}
          >
            {searchable ? (
              <div className="mb-1 flex items-center gap-2 border-b border-current/10 px-2 py-1">
                <span className="shrink-0 opacity-50">
                  <SearchIcon />
                </span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setFocusedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={resolvedSearchPlaceholder}
                  autoComplete="off"
                  role="combobox"
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-expanded={open}
                  className="min-h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-none opacity-50 transition hover:bg-black/10 hover:opacity-100"
                  >
                    <CloseIcon />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div
              id={listboxId}
              role="listbox"
              aria-label={label ?? placeholder}
              style={{ maxHeight }}
              className="overflow-y-auto"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm opacity-60">
                  <LoaderMini size={16} color="currentColor" />
                  Loading
                </div>
              ) : filteredOptions.length ? (
                filteredGroups.map((group, groupIndex) => (
                  <div key={`${group.label}-${groupIndex}`}>
                    {group.label ? (
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-50">
                        {group.label}
                      </p>
                    ) : null}
                    {group.options.map((option) => {
                      const optionIndex = filteredOptions.findIndex(
                        (item) => item.value === option.value,
                      );
                      const selected = option.value === selectedValue;
                      const focused = optionIndex === focusedIndex;
                      return (
                        <button
                          key={option.value}
                          ref={(node) => {
                            optionRefs.current[optionIndex] = node;
                          }}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={option.disabled}
                          onMouseEnter={() => setFocusedIndex(optionIndex)}
                          onClick={() => commitValue(option.value)}
                          className={joinClasses(
                            selectOptionRowClass,
                            "text-left",
                            focused && selectOptionRowFocusedClass,
                            selected &&
                              !focused &&
                              selectOptionRowSelectedClass,
                          )}
                        >
                          {option.icon ? (
                            <span
                              className={selectOptionIconClass}
                              aria-hidden="true"
                            >
                              {option.icon}
                            </span>
                          ) : null}
                          <span className="min-w-0 flex-1">
                            {renderOption ? (
                              renderOption(option)
                            ) : (
                              <>
                                <span
                                  dir="auto"
                                  className={joinClasses(
                                    "block truncate [unicode-bidi:plaintext]",
                                    optionTextClass(option.label),
                                  )}
                                >
                                  {searchable ? (
                                    <HighlightedText
                                      text={option.label}
                                      query={query}
                                    />
                                  ) : (
                                    option.label
                                  )}
                                </span>
                                {option.description ? (
                                  <span
                                    dir="auto"
                                    className={joinClasses(
                                      selectOptionDescriptionClass,
                                      "[unicode-bidi:plaintext]",
                                      optionTextClass(option.description),
                                    )}
                                  >
                                    {option.description}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </span>
                          {selected ? (
                            <span className="ml-auto shrink-0">
                              <CheckIcon />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                    {groupIndex < filteredGroups.length - 1 && group.label ? (
                      <div className="mx-2 my-1 h-px bg-current/10" />
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium">{resolvedEmptyText}</p>
                  {query ? (
                    <p className="mt-1 text-xs opacity-55">
                      {t("common.select.noMatch", { query })}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {name ? (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          readOnly
          required={required}
        />
      ) : null}
    </FieldFrame>
  );
}
