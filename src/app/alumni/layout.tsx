import MemberSession from "@/components/MemberSession";

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  return <MemberSession requiredRole="alumni">{children}</MemberSession>;
}
