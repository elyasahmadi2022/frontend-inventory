import { PageEntrance } from "@/components/motion/page-entrance";

export default function PublicTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PageEntrance>{children}</PageEntrance>;
}
