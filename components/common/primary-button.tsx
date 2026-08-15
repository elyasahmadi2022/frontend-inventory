import Link from "next/link";

type PrimaryButtonProps = {
  href: string;
  label: string;
};

export function PrimaryButton({ href, label }: PrimaryButtonProps) {
  return (
    <Link href={href} className="btn-primary">
      {label}
    </Link>
  );
}
