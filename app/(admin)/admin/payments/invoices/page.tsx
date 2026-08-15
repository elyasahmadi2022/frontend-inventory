import { StoreModulePage } from "@/components/layout/store-module-page";

export default function AdminPaymentsInvoicesPage() {
  return (
    <StoreModulePage
      title="Payment Documents"
      description="This section will show sale and purchase payment documents once the payment table UI is connected."
      items={[
        "Sales receipts",
        "Purchase payments",
        "Outstanding balances",
        "Payment audit trail",
      ]}
    />
  );
}
