export function formatCurrency(amount:number): string {
    return new Intl.NumberFormat("en-US", {
        style:  "currency",
        currency: "AFN",
        maximumFractionDigits: 0,
    }).format(amount)
}