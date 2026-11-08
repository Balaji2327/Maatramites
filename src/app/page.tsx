"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, getActiveRole } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    const role = getActiveRole();
    if (token) {
      router.replace(role === "alumni" ? "/alumni/dashboard" : "/student/dashboard");
    } else {
      router.replace("/student/dashboard"); // Default directly to student dashboard for instant access
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs text-slate-500 font-mono">
      Loading Maatram Platform...
    </div>
  );
}
