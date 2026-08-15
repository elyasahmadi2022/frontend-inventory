import type { ReactNode } from "react";
import { formatAdminNumber } from "@/components/admin/shared/admin-money-display";
import type { SelectOption } from "@/components/common/select-field";
import type { AccountRow } from "@/services/accounts.service";

function balanceToneClass(balance: number) {
  return balance > 0
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300";
}

export function getAssetAccountBalance(
  account: AccountRow,
  currencyCode: string,
) {
  const matchingBalance = (account.balances ?? []).find(
    (balance) => balance.currencyCode === currencyCode,
  );
  return Number(matchingBalance?.balance ?? 0);
}

export function buildAssetAccountOptions(
  accounts: AccountRow[],
  currencyCode: string,
  language: string,
) {
  return accounts
    .filter(
      (account) =>
        account.isActive &&
        ["cash", "bank", "sarafi", "daskhil"].includes(account.type) &&
        (!account.currencyCode || account.currencyCode === currencyCode),
    )
    .map((account) => {
      const balance = getAssetAccountBalance(account, currencyCode);
      const formattedBalance = formatAdminNumber(balance, language);
      return {
        value: account.id,
        label: `${account.code} - ${account.name} (${formattedBalance} ${currencyCode})`,
        description: account.currencyCode ?? currencyCode,
        searchText: `${account.code} ${account.name} ${account.currencyCode ?? currencyCode} ${formattedBalance}`,
      } satisfies SelectOption;
    });
}

export function renderAssetAccountOption(
  option: SelectOption,
  accountById: Map<string, AccountRow>,
  currencyCode: string,
  language: string,
): ReactNode {
  const account = accountById.get(option.value);
  const balance = account ? getAssetAccountBalance(account, currencyCode) : 0;
  const formattedBalance = formatAdminNumber(balance, language);

  return (
    <span className="flex min-w-0 items-center justify-between gap-3">
      <span className="min-w-0">
        <span className="block truncate">{account ? `${account.code} - ${account.name}` : option.label}</span>
        <span className="block text-xs text-light-muted dark:text-dark-muted">
          {account?.currencyCode ?? currencyCode}
        </span>
      </span>
      <span
        dir="ltr"
        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold [unicode-bidi:isolate] ${balanceToneClass(balance)}`}
      >
        {formattedBalance} {currencyCode}
      </span>
    </span>
  );
}
