import MemberSession from "@/components/MemberSession";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <MemberSession requiredRole="student">{children}</MemberSession>;
}
