"use client";

import { gooeyToast } from "goey-toast";
import { useEffect, useMemo, useState } from "react";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { TextareaField } from "@/components/common/textarea-field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useReturnAdminSaleProductsMutation } from "@/lib/query/hooks";
import type { AccountRow } from "@/services/accounts.service";
import type { SaleRow } from "@/services/sales.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  sale: SaleRow | null;
  onClose: () => void;
};

export function AdminSaleReturnModal({ accounts, open, sale, onClose }: Props) {
  const { t } = useI18n();
  const mutation = useReturnAdminSaleProductsMutation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [refundAccountId, setRefundAccountId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !sale) return;
    const next: Record<string, number> = {};
    for (const line of sale.lines ?? []) next[line.id] = 0;
    setQuantities(next);
    setRefundAccountId("");
    setNotes("");
  }, [open, sale]);

  const accountOptions = useMemo<SelectOption[]>(
    () =>
      accounts
        .filter(
          (account) =>
            ["cash", "bank", "sarafi", "daskhil"].includes(account.type) &&
            (!account.currencyCode || account.currencyCode === sale?.currencyCode),
        )
        .map((account) => ({
          value: account.id,
          label: `${account.code} - ${account.name}`,
        })),
    [accounts, sale?.currencyCode],
  );

  const handleSubmit = async () => {
    if (!sale) return;
    const lines = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([lineId, quantity]) => ({ lineId, quantity }));
    if (lines.length === 0) {
      gooeyToast.error(t("admin.sales.return.errorTitle"), {
        description: t("admin.sales.return.validation.lineRequired"),
      });
      return;
    }

    try {
      await mutation.mutateAsync({
        id: sale.id,
        input: {
          lines,
          refundAccountId: refundAccountId || undefined,
          notes: notes.trim() || undefined,
        },
      });
      gooeyToast.success(t("admin.sales.return.successTitle"), {
        description: t("admin.sales.return.successDescription", { number: sale.number }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.sales.return.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.sales.return.errorFallback"),
      });
    }
  };

  return (
    <FormModal
      open={open}
      title={t("admin.sales.return.title")}
      description={
        sale ? t("admin.sales.return.description", { number: sale.number }) : undefined
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={mutation.isPending}
      submitLabel={t("admin.sales.return.submit")}
      submittingLabel={t("admin.sales.return.submitting")}
      cancelLabel={t("admin.sales.return.cancel")}
      closeLabel={t("admin.sales.return.close")}
      panelClassName="max-w-2xl"
      contentClassName="grid grid-cols-2 gap-2"
    >
        {(sale?.lines ?? []).map((line) => (
            <InputField
              containerClassName="col-span-2"
              key={line.id}
              id={`sale-return-${line.id}`}
              label={`${line.product ? `${line.product.sku} - ${line.product.name}` : line.description} (${t("admin.sales.column.quantity")}: ${Number(line.quantity)})`}
              type="number"
              min={0}
              max={Number(line.quantity)}
              step="0.001"
              value={quantities[line.id] ?? 0}
              onChange={(event) =>
                setQuantities((prev) => ({
                  ...prev,
                  [line.id]: Number(event.target.value) || 0,
                }))
              }
              tone="light"
            />
        ))}
       <div className="col-span-2">
       <SelectField
          label={t("admin.sales.return.refundAccount")}
          options={accountOptions}
          value={refundAccountId}
          onValueChange={setRefundAccountId}
          tone="light"
          clearable
        />
       </div>
        <TextareaField
          containerClassName="col-span-2"
          id="sale-return-notes"
          label={t("admin.sales.return.notes")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          tone="light"
        />
    </FormModal>
  );
}
