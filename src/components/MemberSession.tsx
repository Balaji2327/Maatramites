"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getAuthToken, studentApi, clearAuthToken, setActiveRole } from "../lib/api";

export default function MemberSession({ children, requiredRole }: { children: ReactNode; requiredRole?: "student" | "alumni" }) {
  const [role, setRole] = useState<"student" | "alumni" | null>(null);
  useEffect(() => {
    let active = true;
    async function verify() {
      const result = getAuthToken() && await studentApi.memberSession();
      if (!active) return;
      if (result && result.success && (result.memberRole === "student" || result.memberRole === "alumni")) {
        setActiveRole(result.memberRole);
        if (requiredRole && requiredRole !== result.memberRole) {
          window.location.replace(`/${result.memberRole}/dashboard`);
          return;
        }
        setRole(result.memberRole);
      } else {
        clearAuthToken();
        window.location.replace("/login");
      }
    }
    void verify();
    return () => { active = false; };
  }, [requiredRole]);
  return role && (!requiredRole || role === requiredRole) ? <>{children}</> : <p className="p-6">Checking membership...</p>;
}
