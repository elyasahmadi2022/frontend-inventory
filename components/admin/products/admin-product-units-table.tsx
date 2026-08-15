"use client";

import { InputField } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  createUnit,
  fetchUnits,
  updateUnit,
  type SaveUnitInput,
  type UnitRow,
} from "@/services/products.service";
import { gooeyToast } from "goey-toast";
import { Edit3, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function UnitEditor({
  unit,
  open,
  onCancel,
  onSaved,
}: {
  unit?: UnitRow | null;
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState(unit?.code ?? "");
  const [name, setName] = useState(unit?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode(unit?.code ?? "");
    setName(unit?.name ?? "");
  }, [open, unit]);

  async function handleSubmit() {
    if (!code.trim() || !name.trim()) {
      gooeyToast.error(t("admin.settings.units.detailsRequiredTitle"), {
        description: t("admin.settings.units.detailsRequiredDescription"),
      });
      return;
    }

    const input: SaveUnitInput = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
    };

    setSaving(true);
    try {
      if (unit) {
        await updateUnit(unit.id, input);
      } else {
        await createUnit(input);
      }
      gooeyToast.success(
        unit
          ? t("admin.settings.units.updatedTitle")
          : t("admin.settings.units.createdTitle"),
        { description: t("admin.settings.units.savedDescription") },
      );
      onSaved();
    } catch (error) {
      gooeyToast.error(t("admin.settings.units.saveFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.settings.units.saveFailedFallback"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      title={
        unit
          ? t("admin.settings.unit.editTitle", { code: unit.code })
          : t("admin.settings.unit.addTitle")
      }
      description={t("admin.settings.unit.modalDescription")}
      onClose={onCancel}
      onSubmit={() => void handleSubmit()}
      submitting={saving}
      submitLabel={
        unit ? t("admin.settings.unit.update") : t("admin.settings.unit.create")
      }
    >
      <InputField
        label={t("admin.settings.units.colCode")}
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        tone="light"
        placeholder={t("admin.settings.unit.codePlaceholder")}
        className="w-full min-w-32"
      />
      <InputField
        label={t("admin.settings.units.colName")}
        value={name}
        onChange={(event) => setName(event.target.value)}
        tone="light"
        placeholder={t("admin.settings.unit.namePlaceholder")}
        className="w-full min-w-48"
      />
    </FormModal>
  );
}

export function AdminProductUnitsTable({
  onUnitsChanged,
}: {
  onUnitsChanged: () => void;
}) {
  const { t } = useI18n();
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUnit, setEditingUnit] = useState<UnitRow | null | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUnits(await fetchUnits());
    } catch (error) {
      gooeyToast.error(t("admin.settings.units.loadFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.settings.units.loadFailedFallback"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-2">
      <UnitEditor
        open={editingUnit !== undefined}
        unit={editingUnit}
        onCancel={() => setEditingUnit(undefined)}
        onSaved={() => {
          setEditingUnit(undefined);
          void load();
          onUnitsChanged();
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-light-text dark:text-dark-text">
            {t("admin.settings.units.pageTitle")}
          </h2>
          <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
            {t("admin.settings.units.pageDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingUnit(null)}
          className="btn-primary inline-flex shrink-0 items-center gap-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("admin.settings.units.new")}
        </button>
      </div>
      <section className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs">
        <div className="grid grid-cols-[0.8fr_1.4fr_1fr] gap-3 border-b border-light-border bg-light-bg px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted dark:border-dark-border dark:bg-dark-bg">
          <span>{t("admin.settings.units.colCode")}</span>
          <span>{t("admin.settings.units.colName")}</span>
          <span className="text-right">
            {t("admin.settings.units.colOperation")}
          </span>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-light-border/30 dark:bg-dark-border/30" />
        ) : units.length > 0 ? (
          units.map((unit) => (
            <div
              key={unit.id}
              className="grid grid-cols-[0.8fr_1.4fr_1fr] items-center gap-3 border-b border-light-border px-4 py-3 text-sm last:border-b-0 dark:border-dark-border"
            >
              <span className="font-semibold text-light-text dark:text-dark-text">
                {unit.code}
              </span>
              <span className="text-light-text dark:text-dark-text">
                {unit.name}
              </span>
              <span className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(unit)}
                  className="inline-flex items-center gap-1.5 border border-light-border bg-light-bg px-2.5 py-1.5 text-xs font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500"
                >
                  <Edit3 className="size-3.5" aria-hidden="true" />
                  {t("admin.settings.common.update")}
                </button>
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {t("admin.settings.units.empty")}
          </div>
        )}
      </section>
    </div>
  );
}
