# Store Management Frontend

Next.js and React administration interface for sales, purchases, inventory,
partners, accounts, transfers, payments, and financial reports.

## Requirements

- Node.js 20 or newer
- npm
- The backend API running locally or at a reachable URL

## Local installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the environment file:

   ```bash
   cp .env.example .env.local
   ```

3. For local development, keep `NEXT_PUBLIC_API_URL` empty and set:

   ```env
   API_PROXY_TARGET=http://localhost:4000
   ```

   Next.js will proxy browser requests under `/api` to the backend. For a
   separately hosted API, set `NEXT_PUBLIC_API_URL` to its public address.

4. Start the frontend:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` and sign in with an administrator seeded by the
   backend.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Check the frontend source |
| `npm run format:check` | Check formatting |

## How the application works

The frontend collects and validates user input, calls the backend API, and
displays the resulting documents and accounting reports. The backend remains
the authority for stock, balances, exchange rates, journal posting, and access
permissions. Do not reproduce final accounting calculations only in the UI.

The main workflow is:

1. Define currencies, accounts, product units, products, inventory locations,
   and partners.
2. Record purchases to receive stock and create vendor payables.
3. Record sales to issue stock and create revenue, receivables, and cost of
   goods sold.
4. Record later customer receipts and vendor payments against their documents.
5. Transfer money between compatible cash or bank accounts.
6. Use Reports to inspect journals, ledgers, income, the balance sheet, and
   balances by currency.

## Debit and credit in simple terms

Debit and credit mean the left and right sides of a journal; neither word means
good, bad, incoming, or outgoing by itself.

| Account category | Debit usually | Credit usually |
| --- | --- | --- |
| Asset: cash, bank, inventory, receivable | Increases it | Decreases it |
| Liability: payable | Decreases it | Increases it |
| Equity | Decreases it | Increases it |
| Revenue | Decreases/reverses it | Increases it |
| Expense and cost of goods sold | Increases it | Decreases/reverses it |

Examples:

- Buy inventory on credit: debit Inventory, credit Accounts Payable.
- Pay the vendor: debit Accounts Payable, credit Cash/Bank.
- Sell to a customer on credit: debit Accounts Receivable, credit Revenue.
- Receive the customer's payment: debit Cash/Bank, credit Accounts Receivable.
- Record the cost of a sale: debit Cost of Goods Sold, credit Inventory.
- Return a purchase: credit Inventory and debit Payable; if already paid, also
  record the vendor refund through the selected money account.
- Return a sale: debit/reverse Revenue, credit Receivable or refund cash, debit
  Inventory, and credit/reverse Cost of Goods Sold.

## How balances are calculated

For debit-normal accounts such as assets and expenses:

```text
balance = opening balance + debits - credits
```

For credit-normal accounts such as liabilities, equity, and revenue:

```text
balance = opening balance + credits - debits
```

In the General Ledger:

- **Opening** is the balance before the selected From date. It is a summary,
  not a journal transaction.
- Each middle row is a posted journal line within the selected period.
- **Closing** is opening plus the period activity. Its Debit and Credit columns
  are the period totals, while Balance is the final running balance.

For the example inventory account, the calculation is:

```text
0 opening + 472 debits - 48 credits = 424 closing
```

## Multiple currencies

Each line preserves its actual currency. USD, AFN, and PKR are displayed and
totaled separately; they must not be added as if they were the same unit.
Exchange rates are captured when a transaction crosses currencies. A product
can use one inventory/price currency while the invoice or bill uses another.

The balance sheet uses a currency adjustment when one side of a journal is in a
different currency—for example USD inventory financed by an AFN payable. This
keeps native currency positions separate while presenting a complete equation.

## Returns and audit history

Returns do not delete the original sale or purchase. They create a reversing
journal and an inventory `return_in` or `return_out` movement. The Reports
Journal tab marks these entries as Sales return or Purchase return so users can
follow the complete history.

## Source structure

- `app` — Next.js routes and page entry points
- `components/admin` — admin screens, tables, forms, modals, invoices, and reports
- `components/common` — shared inputs, tables, menus, date pickers, and currency UI
- `services` — typed API request functions and response models
- `lib/query` — TanStack Query hooks and cache keys
- `lib/i18n.ts` and `messages` — English, Persian, and Pashto localization

When adding visible text, add translation keys for all supported languages.
When changing a mutation, invalidate or update the related query caches so the
new balance or transaction appears without requiring a page refresh.
