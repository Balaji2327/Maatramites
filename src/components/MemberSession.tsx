"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getAuthToken, studentApi, clearAuthToken } from "../lib/api";

export default function MemberSession({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    async function verify() {
      const result = getAuthToken() && await studentApi.memberSession();
      if (!active) return;
      if (result && result.success) setReady(true);
      else {
        clearAuthToken();
        window.location.replace("/login");
      }
    }
    void verify();
    return () => { active = false; };
  }, []);
  return ready ? <>{children}</> : <p className="p-6">Checking membership...</p>;
}
