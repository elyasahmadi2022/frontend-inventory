import type { SVGProps } from "react";

type CurrencyFlagIconProps = SVGProps<SVGSVGElement> & {
  currency: string;
};

export function CurrencyFlagIcon({ currency, ...props }: CurrencyFlagIconProps) {
  const common = {
    viewBox: "0 0 24 16",
    role: "img",
    "aria-label": currency,
    ...props,
  };

  if (currency === "USD") {
    return (
      <svg {...common}>
        <rect width="24" height="16" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12, 14].map((y) => <rect key={y} y={y} width="24" height="1" fill="#b22234" />)}
        <rect width="10" height="8" fill="#3c3b6e" />
        <circle cx="2" cy="2" r=".6" fill="#fff" /><circle cx="5" cy="2" r=".6" fill="#fff" /><circle cx="8" cy="2" r=".6" fill="#fff" />
        <circle cx="3.5" cy="5" r=".6" fill="#fff" /><circle cx="6.5" cy="5" r=".6" fill="#fff" />
      </svg>
    );
  }

  if (currency === "PKR") {
    return (
      <svg {...common}>
        <rect width="24" height="16" fill="#01411c" />
        <rect width="6" height="16" fill="#fff" />
        <circle cx="15" cy="8" r="4" fill="#fff" />
        <circle cx="16.5" cy="7" r="3.5" fill="#01411c" />
        <path d="m18 4 .5 1.3 1.4.1-1.1.9.4 1.4-1.2-.8-1.2.8.4-1.4-1.1-.9 1.4-.1z" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect width="8" height="16" fill="#000" />
      <rect x="8" width="8" height="16" fill="#d32011" />
      <rect x="16" width="8" height="16" fill="#007a36" />
      <circle cx="12" cy="8" r="2.4" fill="none" stroke="#fff" strokeWidth=".7" />
    </svg>
  );
}
