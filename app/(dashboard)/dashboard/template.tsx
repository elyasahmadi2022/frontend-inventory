import { PageEntrance } from "@/components/motion/page-entrance";

export default function DashboardTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PageEntrance className="min-h-0 w-full flex-1">{children}</PageEntrance>
  );
}
