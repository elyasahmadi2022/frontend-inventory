"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
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
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  flattenSelectOptions,
  HighlightedText,
  normalizeSelectOptions,
  SearchIcon,
  selectOptionCheckboxClass,
  selectOptionDescriptionClass,
  selectOptionIconClass,
  selectOptionRowClass,
  selectOptionRowFocusedClass,
  selectOptionRowSelectedClass,
  type SelectOption,
  type SelectOptions,
} from "@/components/common/select-field";
import { LoaderMini } from "@/components/common/loader-mini";
import { useI18n } from "@/lib/i18n";

export type MultiSelectFieldProps = {
  className?: string;
  clearable?: boolean;
  closeOnSelect?: boolean;
  contentClassName?: string;
  defaultOpen?: boolean;
  defaultValue?: string[];
  description?: string;
  disabled?: boolean;
  emptyText?: string;
  error?: string;
  label?: string;
  loading?: boolean;
  maxHeight?: number;
  maxSummaryItems?: number;
  name?: string;
  onChange?: (value: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onSearchChange?: (value: string) => void;
  onValueChange?: (value: string[]) => void;
  open?: boolean;
  options: SelectOptions;
  placeholder?: string;
  renderOption?: (option: SelectOption) => ReactNode;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  tone?: FormControlTone;
  value?: string[];
};

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: (event: MouseEvent<HTMLSpanElement>) => void;
}) {
  const { t } = useI18n();
  return (
    <span className="inline-flex max-w-32 items-center gap-1 rounded-none border border-primary-500/20 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-500/10 dark:text-primary-500">
      <span className="truncate">{label}</span>
      <span
        role="button"
        tabIndex={-1}
        onClick={onRemove}
        aria-label={t("common.select.removeOption", { option: label })}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-none transition hover:bg-primary-100 dark:hover:bg-primary-500/15"
      >
        <CloseIcon />
      </span>
    </span>
  );
}

export function MultiSelectField({
  className,
  clearable = true,
  closeOnSelect = false,
  contentClassName,
  defaultOpen = false,
  defaultValue = [],
  description,
  disabled,
  emptyText,
  error,
  label,
  loading = false,
  maxHeight = 300,
  maxSummaryItems = 3,
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
  searchable = true,
  searchPlaceholder,
  searchValue,
  tone = "dark",
  value,
}: MultiSelectFieldProps) {
  const { t } = useI18n();
  const resolvedEmptyText = emptyText ?? t("common.select.noResults");
  const resolvedPlaceholder = placeholder ?? t("common.select.multiPlaceholder");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("common.select.searchPlaceholder");
  const generatedId = useId();
  const triggerId = `multi-select-${generatedId}`;
  const listboxId = `${triggerId}-listbox`;
  const descriptionId = description ? `${triggerId}-description` : undefined;
  const errorId = error ? `${triggerId}-error` : undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalQuery, setInternalQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedValues = value ?? internalValue;
  const open = controlledOpen ?? internalOpen;
  const query = searchValue ?? internalQuery;
  const styles = fieldToneClasses[tone];
  const groups = useMemo(() => normalizeSelectOptions(options), [options]);
  const allOptions = useMemo(() => flattenSelectOptions(groups), [groups]);

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
  const selectedOptions = allOptions.filter((option) =>
    selectedValues.includes(option.value),
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
    optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  function commitValue(nextValue: string[]) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    onChange?.(nextValue);
  }

  function toggleOption(optionValue: string) {
    commitValue(
      selectedValues.includes(optionValue)
        ? selectedValues.filter((item) => item !== optionValue)
        : [...selectedValues, optionValue],
    );
    if (closeOnSelect) {
      setOpen(false);
      setQuery("");
    }
  }

  function clearAll(event?: MouseEvent<HTMLElement>) {
    event?.stopPropagation();
    commitValue([]);
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
      if (option && !option.disabled) toggleOption(option.value);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

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
        <Popover.Trigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled}
            aria-describedby={error ? errorId : descriptionId}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={joinClasses(
              baseControlClass,
              "group flex items-center justify-between gap-2 py-1.5 text-left",
              styles.control,
              error && "border-red-400/70",
              open && "border-primary-500 ring-2 ring-primary-500/15",
              className,
            )}
          >
            <span
              className={joinClasses(
                "flex min-w-0 flex-1 flex-wrap gap-1",
                !selectedOptions.length && styles.placeholder,
              )}
            >
              {selectedOptions.length ? (
                <>
                  {selectedOptions.slice(0, maxSummaryItems).map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      onRemove={(event) => {
                        event.stopPropagation();
                        toggleOption(option.value);
                      }}
                    />
                  ))}
                  {selectedOptions.length > maxSummaryItems ? (
                    <span className="self-center text-xs opacity-60">
                      +{selectedOptions.length - maxSummaryItems}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="truncate">{resolvedPlaceholder}</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-1 opacity-60">
              {clearable && selectedOptions.length && !disabled ? (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={clearAll}
                aria-label={t("common.select.clearAll")}
                  className="grid h-6 w-6 place-items-center rounded-none transition hover:bg-black/10 hover:opacity-100"
                >
                  <CloseIcon />
                </span>
              ) : null}
              <ChevronIcon open={open} />
            </span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={5}
            collisionPadding={12}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            className={joinClasses(
              "z-[1100] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-none border p-1 shadow-2xl",
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
              aria-multiselectable="true"
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
                      const selected = selectedValues.includes(option.value);
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
                          onClick={() => toggleOption(option.value)}
                          className={joinClasses(
                            selectOptionRowClass,
                            "text-start",
                            focused && selectOptionRowFocusedClass,
                            selected &&
                              !focused &&
                              selectOptionRowSelectedClass,
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={joinClasses(
                              selectOptionCheckboxClass,
                              selected &&
                                "border-primary-500 bg-primary-500 text-white",
                            )}
                          >
                            {selected ? <CheckIcon /> : null}
                          </span>
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
                                <span className="block truncate">
                                  <HighlightedText
                                    text={option.label}
                                    query={query}
                                  />
                                </span>
                                {option.description ? (
                                  <span className={selectOptionDescriptionClass}>
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

            {selectedValues.length ? (
              <div className="mt-1 flex items-center justify-between border-t border-current/10 px-3 py-2">
                <span className="text-xs opacity-60">
                  {t("common.select.selectedCount", { count: selectedValues.length })}
                </span>
                <button
                  type="button"
                  onClick={() => clearAll()}
                  className="text-xs font-semibold text-red-400 transition hover:underline"
                >
                  {t("common.select.clearAll")}
                </button>
              </div>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {name
        ? selectedValues.map((selectedValue) => (
            <input
              key={selectedValue}
              type="hidden"
              name={name}
              value={selectedValue}
              readOnly
            />
          ))
        : null}
    </FieldFrame>
  );
}
