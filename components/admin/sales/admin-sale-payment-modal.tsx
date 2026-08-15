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
import { useReceiveAdminSalePaymentMutation } from "@/lib/query/hooks";
import type { AccountRow } from "@/services/accounts.service";
import type { SaleRow } from "@/services/sales.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  sale: SaleRow | null;
  onClose: () => void;
};

export function AdminSalePaymentModal({
  accounts,
  open,
  sale,
  onClose,
}: Props) {
  const { language, t } = useI18n();
  const mutation = useReceiveAdminSalePaymentMutation();
  const balance = Math.max(
    Number(sale?.total ?? 0) - Number(sale?.paidTotal ?? 0),
    0,
  );
  const [amount, setAmount] = useState(balance);
  const [receiptAccountId, setReceiptAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalDateString);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !sale) return;
    const frame = requestAnimationFrame(() => {
      setAmount(Math.max(Number(sale.total) - Number(sale.paidTotal), 0));
      setReceiptAccountId("");
      setPaymentDate(getLocalDateString());
      setNotes("");
    });
    return () => cancelAnimationFrame(frame);
  }, [open, sale]);

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const saleCurrencyCode = sale?.currencyCode;
  const accountOptions = useMemo<SelectOption[]>(
    () =>
      saleCurrencyCode
        ? buildAssetAccountOptions(accounts, saleCurrencyCode, language)
        : [],
    [accounts, language, saleCurrencyCode],
  );

  const handleSubmit = async () => {
    if (!sale) return;
    if (!(amount > 0)) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description: t("admin.sales.pay.validation.amountRequired"),
      });
      return;
    }
    if (amount > balance) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description: t("admin.sales.pay.validation.amountTooHigh"),
      });
      return;
    }
    if (!receiptAccountId) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description: t("admin.sales.pay.validation.accountRequired"),
      });
      return;
    }

    try {
      await mutation.mutateAsync({
        id: sale.id,
        input: {
          amount,
          receiptAccountId,
          paymentDate,
          notes: notes.trim() || undefined,
        },
      });
      gooeyToast.success(t("admin.sales.pay.successTitle"), {
        description: t("admin.sales.pay.successDescription", {
          number: sale.number,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.sales.pay.errorFallback"),
      });
    }
  };

  return (
    <FormModal
      open={open}
      title={t("admin.sales.pay.title")}
      description={
        sale
          ? t("admin.sales.pay.description", {
              number: sale.number,
              currency: sale.currencyCode,
            })
          : undefined
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={mutation.isPending}
      submitLabel={t("admin.sales.pay.submit")}
      submittingLabel={t("admin.sales.pay.submitting")}
      cancelLabel={t("admin.sales.pay.cancel")}
      closeLabel={t("admin.sales.pay.close")}
    >
      <p className="col-span-2 text-sm font-semibold text-green-700 dark:text-green-400">
        {t("admin.sales.pay.balance")}: {balance.toLocaleString()}{" "}
        {sale?.currencyCode}
      </p>
      <InputField
        containerClassName="col-span-2"
        id="sale-pay-amount"
        label={t("admin.sales.pay.amount")}
        type="number"
        min={0}
        step="0.01"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value) || 0)}
        tone="light"
      />
      <div className="col-span-2">
        <SelectField
          label={t("admin.sales.pay.account")}
          options={accountOptions}
          value={receiptAccountId}
          onValueChange={setReceiptAccountId}
          renderOption={(option) =>
            sale?.currencyCode
              ? renderAssetAccountOption(
                  option,
                  accountById,
                  sale.currencyCode,
                  language,
                )
              : option.label
          }
          tone="light"
        />
      </div>
      <DatePickerField
        containerClassName="col-span-2"
        id="sale-pay-date"
        label={t("admin.sales.pay.date")}
        value={paymentDate}
        onChange={setPaymentDate}
        tone="light"
      />
      <TextareaField
        containerClassName="col-span-2"
        id="sale-pay-notes"
        label={t("admin.sales.pay.notes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        tone="light"
      />
    </FormModal>
  );
}
