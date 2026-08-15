"use client";

import { gooeyToast } from "goey-toast";
import { useEffect, useMemo, useState } from "react";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { TextareaField } from "@/components/common/textarea-field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useReturnAdminPurchaseProductsMutation } from "@/lib/query/hooks";
import type { AccountRow } from "@/services/accounts.service";
import type { PurchaseRow } from "@/services/purchases.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  purchase: PurchaseRow | null;
  onClose: () => void;
};

export function AdminPurchaseReturnModal({
  accounts,
  open,
  purchase,
  onClose,
}: Props) {
  const { t } = useI18n();
  const mutation = useReturnAdminPurchaseProductsMutation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [refundAccountId, setRefundAccountId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !purchase) return;
    const next: Record<string, number> = {};
    for (const line of purchase.lines ?? []) next[line.id] = 0;
    // Reset the modal draft whenever a different purchase is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuantities(next);
    setRefundAccountId("");
    setNotes("");
  }, [open, purchase]);

  const accountOptions = useMemo<SelectOption[]>(
    () =>
      accounts
        .filter(
          (account) =>
            ["cash", "bank", "sarafi", "daskhil"].includes(account.type) &&
            (!account.currencyCode || account.currencyCode === purchase?.currencyCode),
        )
        .map((account) => ({
          value: account.id,
          label: `${account.code} - ${account.name}`,
        })),
    [accounts, purchase?.currencyCode],
  );

  const returnSettlement = useMemo(() => {
    if (!purchase) return { amount: 0, requiresRefund: false };
    const lineValue = (purchase.lines ?? []).reduce((sum, line) => {
      const quantity = Math.min(
        Math.max(quantities[line.id] ?? 0, 0),
        Number(line.quantity),
      );
      if (quantity <= 0 || Number(line.quantity) <= 0) return sum;
      return sum + Number(line.lineTotal) * (quantity / Number(line.quantity));
    }, 0);
    const tax =
      Number(purchase.subtotal) > 0
        ? Number(purchase.taxTotal) * (lineValue / Number(purchase.subtotal))
        : 0;
    const amount = Math.round((lineValue + tax) * 100) / 100;
    const unpaidBalance = Math.max(
      Number(purchase.total) - Number(purchase.paidTotal),
      0,
    );
    return { amount, requiresRefund: amount > unpaidBalance + 0.005 };
  }, [purchase, quantities]);

  const handleSubmit = async () => {
    if (!purchase) return;
    const lines = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([lineId, quantity]) => ({ lineId, quantity }));
    if (lines.length === 0) {
      gooeyToast.error(t("admin.purchases.return.errorTitle"), {
        description: t("admin.purchases.return.validation.lineRequired"),
      });
      return;
    }

    try {
      await mutation.mutateAsync({
        id: purchase.id,
        input: {
          lines,
          refundAccountId:
            returnSettlement.requiresRefund && refundAccountId
              ? refundAccountId
              : undefined,
          notes: notes.trim() || undefined,
        },
      });
      gooeyToast.success(t("admin.purchases.return.successTitle"), {
        description: t("admin.purchases.return.successDescription", {
          number: purchase.number,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.purchases.return.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.purchases.return.errorFallback"),
      });
    }
  };

  return (
    <FormModal
      open={open}
      title={t("admin.purchases.return.title")}
      description={
        purchase
          ? t("admin.purchases.return.description", { number: purchase.number })
          : undefined
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={mutation.isPending}
      submitLabel={t("admin.purchases.return.submit")}
      submittingLabel={t("admin.purchases.return.submitting")}
      cancelLabel={t("admin.purchases.return.cancel")}
      closeLabel={t("admin.purchases.return.close")}
      panelClassName="max-w-2xl"
    >
        {(purchase?.lines ?? []).map((line) => (
            <InputField
              key={line.id}
              containerClassName="col-span-2"
              id={`purchase-return-${line.id}`}
              label={`${line.product ? `${line.product.sku} - ${line.product.name}` : line.description} (${t("admin.purchases.column.quantity")}: ${Number(line.quantity)})`}
              type="number"
              min={0}
              max={Number(line.quantity)}
              step="0.001"
              value={quantities[line.id] ?? 0}
              onChange={(event) => {
                const entered = Number(event.target.value);
                const quantity = Number.isFinite(entered)
                  ? Math.min(Math.max(entered, 0), Number(line.quantity))
                  : 0;
                setQuantities((prev) => ({ ...prev, [line.id]: quantity }));
              }}
              tone="light"
            />
        ))}
        {returnSettlement.requiresRefund ? (
          <div className="col-span-2">
            <SelectField
              label={t("admin.purchases.return.refundAccount")}
              options={accountOptions}
              value={refundAccountId}
              onValueChange={setRefundAccountId}
              tone="light"
              clearable
            />
          </div>
        ) : returnSettlement.amount > 0 ? (
          <p className="col-span-2 text-sm text-light-muted dark:text-dark-muted">
            {t("admin.purchases.return.noRefundAccountNeeded")}
          </p>
        ) : null}
        <TextareaField
        containerClassName="col-span-2"
          id="purchase-return-notes"
          label={t("admin.purchases.return.notes")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          tone="light"
        />
    </FormModal>
  );
}
