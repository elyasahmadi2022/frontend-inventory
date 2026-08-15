"use client";

import { useMemo, useState } from "react";
import { gooeyToast } from "goey-toast";
import { DatePickerField } from "@/components/common/date-picker-field";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import { SelectField } from "@/components/common/select-field";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import { useRecordAdminFundingMutation } from "@/lib/query/hooks";
import type { AccountRow, CurrencyCode } from "@/services/accounts.service";
import type { CurrencyRow } from "@/services/currencies.service";

type Props = {
  accounts: AccountRow[];
  currencies: CurrencyRow[];
  open: boolean;
  onClose: () => void;
};
const today = getLocalDateString();

export function AdminRecordFundingModal({
  accounts,
  currencies,
  open,
  onClose,
}: Props) {
  const { t } = useI18n();
  const mutation = useRecordAdminFundingMutation();
  const initialCurrency =
    currencies.find((item) => item.isActive) ?? currencies[0];
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(
    (initialCurrency?.code ?? "AFN") as CurrencyCode,
  );
  const [assetAccountId, setAssetAccountId] = useState("");
  const [equityAccountId, setEquityAccountId] = useState("");
  const [fundingDate, setFundingDate] = useState(today);
  const [amount, setAmount] = useState(0);
  const [kind, setKind] = useState("contribution");
  const [description, setDescription] = useState("");
  const activeCurrencies = useMemo(
    () => currencies.filter((item) => item.isActive),
    [currencies],
  );
  const assetOptions = useMemo(
    () =>
      accounts
        .filter(
          (a) =>
            a.isActive &&
            a.category === "asset" &&
            ["cash", "bank", "sarafi", "daskhil"].includes(a.type) &&
            a.currencyCode === currencyCode,
        )
        .map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` })),
    [accounts, currencyCode],
  );
  const equityOptions = useMemo(
    () =>
      accounts
        .filter(
          (a) =>
            a.isActive &&
            a.category === "equity" &&
            a.type === "equity" &&
            a.currencyCode === currencyCode,
        )
        .map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` })),
    [accounts, currencyCode],
  );

  const submit = async () => {
    if (!assetAccountId || !equityAccountId || amount <= 0) {
      gooeyToast.error(t("admin.accounts.funding.validation"));
      return;
    }
    try {
      const journal = await mutation.mutateAsync({
        fundingDate,
        description:
          description.trim() ||
          t(
            kind === "opening"
              ? "admin.accounts.funding.openingDescription"
              : "admin.accounts.funding.contributionDescription",
          ),
        assetAccountId,
        equityAccountId,
        currencyCode,
        amount,
        isOpeningBalance: kind === "opening",
      });
      gooeyToast.success(t("admin.accounts.funding.success"), {
        description: journal.number,
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.accounts.funding.error"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.accounts.funding.errorFallback"),
      });
    }
  };

  return (
    <FormModal
      open={open}
      title={t("admin.accounts.funding.title")}
      description={t("admin.accounts.funding.description")}
      submitLabel={t("admin.accounts.funding.submit")}
      submittingLabel={t("admin.accounts.funding.submitting")}
      cancelLabel={t("admin.accounts.expense.cancel")}
      closeLabel={t("admin.accounts.expense.close")}
      submitting={mutation.isPending}
      onClose={onClose}
      onSubmit={() => void submit()}
    >
      <SelectField
        label={t("admin.accounts.funding.kind")}
        value={kind}
        onValueChange={setKind}
        clearable={false}
        tone="light"
        options={[
          {
            value: "contribution",
            label: t("admin.accounts.funding.contribution"),
          },
          { value: "opening", label: t("admin.accounts.funding.opening") },
        ]}
      />
      <DatePickerField
        label={t("admin.accounts.funding.date")}
        value={fundingDate}
        onChange={setFundingDate}
        tone="light"
      />
      <SelectField
        label={t("admin.accounts.funding.currency")}
        value={currencyCode}
        onValueChange={(value) => {
          const code = value as CurrencyCode;
          setCurrencyCode(code);
          setAssetAccountId("");
          setEquityAccountId("");
        }}
        clearable={false}
        tone="light"
        options={activeCurrencies.map((item) => ({
          value: item.code,
          label: `${item.code} - ${item.name}`,
        }))}
      />
      <SelectField
        label={t("admin.accounts.funding.assetAccount")}
        value={assetAccountId}
        onValueChange={setAssetAccountId}
        clearable={false}
        searchable
        tone="light"
        options={assetOptions}
      />
      <SelectField
        label={t("admin.accounts.funding.equityAccount")}
        value={equityAccountId}
        onValueChange={setEquityAccountId}
        clearable={false}
        searchable
        tone="light"
        options={equityOptions}
      />
      <InputField
        label={t("admin.accounts.funding.amount")}
        type="number"
        min={0.01}
        step="any"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        tone="light"
      />
      <InputField
        label={t("admin.accounts.funding.notes")}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        tone="light"
      />
    </FormModal>
  );
}
