"use client";

import { gooeyToast } from "goey-toast";
import { useEffect, useMemo, useState } from "react";
import {
  buildAssetAccountOptions,
  renderAssetAccountOption,
} from "@/components/admin/shared/asset-account-options";
import { FormModal } from "@/components/common/form-modal";
import { DatePickerField } from "@/components/common/date-picker-field";
import { InputField } from "@/components/common/input-field";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { TextareaField } from "@/components/common/textarea-field";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import { usePayAdminPurchaseMutation } from "@/lib/query/hooks";
import type { AccountRow } from "@/services/accounts.service";
import type { PurchaseRow } from "@/services/purchases.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  purchase: PurchaseRow | null;
  onClose: () => void;
};

export function AdminPurchasePaymentModal({
  accounts,
  open,
  purchase,
  onClose,
}: Props) {
  const { language, t } = useI18n();
  const mutation = usePayAdminPurchaseMutation();
  const balance = Math.max(
    Number(purchase?.total ?? 0) - Number(purchase?.paidTotal ?? 0),
    0,
  );
  const [amount, setAmount] = useState(balance);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalDateString);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !purchase) return;
    const frame = requestAnimationFrame(() => {
      setAmount(
        Math.max(Number(purchase.total) - Number(purchase.paidTotal), 0),
      );
      setPaymentAccountId("");
      setPaymentDate(getLocalDateString());
      setNotes("");
    });
    return () => cancelAnimationFrame(frame);
  }, [open, purchase]);

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const purchaseCurrencyCode = purchase?.currencyCode;
  const accountOptions = useMemo<SelectOption[]>(
    () =>
      purchaseCurrencyCode
        ? buildAssetAccountOptions(accounts, purchaseCurrencyCode, language)
        : [],
    [accounts, language, purchaseCurrencyCode],
  );

  const handleSubmit = async () => {
    if (!purchase) return;
    if (!(amount > 0)) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description: t("admin.purchases.pay.validation.amountRequired"),
      });
      return;
    }
    if (amount > balance) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description: t("admin.purchases.pay.validation.amountTooHigh"),
      });
      return;
    }
    if (!paymentAccountId) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description: t("admin.purchases.pay.validation.accountRequired"),
      });
      return;
    }

    try {
      await mutation.mutateAsync({
        id: purchase.id,
        input: {
          amount,
          paymentAccountId,
          paymentDate,
          notes: notes.trim() || undefined,
        },
      });
      gooeyToast.success(t("admin.purchases.pay.successTitle"), {
        description: t("admin.purchases.pay.successDescription", {
          number: purchase.number,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.purchases.pay.errorFallback"),
      });
    }
  };

  return (
    <FormModal
      open={open}
      title={t("admin.purchases.pay.title")}
      description={
        purchase
          ? t("admin.purchases.pay.description", {
              number: purchase.number,
              currency: purchase.currencyCode,
            })
          : undefined
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={mutation.isPending}
      submitLabel={t("admin.purchases.pay.submit")}
      submittingLabel={t("admin.purchases.pay.submitting")}
      cancelLabel={t("admin.purchases.pay.cancel")}
      closeLabel={t("admin.purchases.pay.close")}
    >
      <p className="text-sm col-span-2 font-semibold text-green-700">
        {t("admin.purchases.pay.balance")}: {balance.toLocaleString()}{" "}
        {purchase?.currencyCode}
      </p>
      <InputField
        containerClassName="col-span-2"
        id="purchase-pay-amount"
        label={t("admin.purchases.pay.amount")}
        type="number"
        min={0}
        step="0.01"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value) || 0)}
        tone="light"
      />
      <div className="col-span-2">
        <SelectField
          label={t("admin.purchases.pay.account")}
          options={accountOptions}
          value={paymentAccountId}
          onValueChange={setPaymentAccountId}
          renderOption={(option) =>
            purchase?.currencyCode
              ? renderAssetAccountOption(
                  option,
                  accountById,
                  purchase.currencyCode,
                  language,
                )
              : option.label
          }
          tone="light"
        />
      </div>
      <DatePickerField
        containerClassName="col-span-2"
        id="purchase-pay-date"
        label={t("admin.purchases.pay.date")}
        value={paymentDate}
        onChange={setPaymentDate}
        tone="light"
      />
      <TextareaField
        containerClassName="col-span-2"
        id="purchase-pay-notes"
        label={t("admin.purchases.pay.notes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        tone="light"
      />
    </FormModal>
  );
}
