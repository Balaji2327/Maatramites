"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LockClosedIcon,
  AtSymbolIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { setAuthToken, saveUser, setActiveRole, clearAuthToken, studentApi } from "../lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Guarantee fields are empty on arrival
  useEffect(() => {
    setIdentifier("");
    setPassword("");
    setOtp(["", "", "", "", "", ""]);
    setRequires2FA(false);
    setErrorMessage("");
    setInfoMessage("");
    clearAuthToken();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    setErrorMessage("");
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digitsOnly[i] || "";
      }
      setOtp(newOtp);
      const nextFocus = Math.min(digitsOnly.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const singleDigit = digitsOnly.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);

    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Please enter both your credentials and password.");
      return;
    }

    const enteredOtp = otp.join("");
    if (requires2FA && enteredOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    const cleanInput = identifier.trim().toLowerCase();

    try {
      // 1. Authenticate against Backend /auth/login (Supabase Auth)
      const res = await studentApi.login({
        email: cleanInput,
        password: password.trim(),
        otp: requires2FA ? enteredOtp : undefined,
      });

      if (res.requires2FA) {
        setRequires2FA(true);
        setErrorMessage("");
        setInfoMessage("Two-factor authentication required. Enter the 6-digit code from your authenticator app.");
        setIsLoading(false);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
        return;
      }

      if (!res.success && res.message) {
        setErrorMessage(res.message);
        setIsLoading(false);
        return;
      }

      if (res.success && res.user) {
        const u = res.user;
        const meta = u.user_metadata || {};
        const isAlumni =
          meta.role === "alumni" ||
          cleanInput.includes("alumni") ||
          cleanInput.startsWith("alu") ||
          cleanInput.startsWith("mf-alu");

        const detectedRole: "student" | "alumni" = isAlumni ? "alumni" : "student";

        const userProfile = {
          id: u.id,
          name: meta.full_name || meta.name || (isAlumni ? "Maatram Alumni" : "Scholar"),
          fullName: meta.full_name || meta.name || (isAlumni ? "Maatram Alumni" : "Scholar"),
          email: u.email || cleanInput,
          role: detectedRole,
          rollNumber: meta.roll_number || meta.rollNumber || (isAlumni ? "MF-ALUM-2019-018" : "MF-SCH-2024-042"),
          phone: meta.phone || meta.mobile_number || u.phone || "+91 94432 10987",
          dob: meta.dob || "1998-09-22",
          gender: meta.gender || "Male",
          whatsapp: meta.whatsapp || "+91 94432 10987",
          currentCity: meta.current_city || "Chennai, Tamil Nadu",
          company: meta.company || "Zoho Corporation",
          designation: meta.designation || "Senior Software Engineer",
          experienceYears: meta.experience_years || "5 Years",
          industryDomain: meta.industry_domain || "Product Software & Cloud Infrastructure",
          linkedin: meta.linkedin || "linkedin.com/in/alumni-maatram",
          college: meta.grad_college || meta.college || "Sri Venkateswara College of Engineering",
          degree: meta.grad_degree || meta.degree || "B.E. Computer Science & Engineering",
          gradBatch: meta.grad_batch || "Class of 2019",
        };

        if (res.session?.access_token) {
          setAuthToken(res.session.access_token);
        } else {
          setAuthToken(`maatram-token-${u.id}`);
        }

        saveUser(userProfile);
        setActiveRole(detectedRole);
        setIsLoading(false);
        router.push(detectedRole === "alumni" ? "/alumni/dashboard" : "/student/dashboard");
        return;
      }
    } catch (apiErr: any) {
      console.warn("Backend auth failed or network error, checking credentials locally:", apiErr);
      if (apiErr?.message) {
        setErrorMessage(apiErr.message);
        setIsLoading(false);
        return;
      }
    }

    // 2. Direct local fallback for seamless dev experience
    const isAlumni =
      cleanInput.includes("alumni") ||
      cleanInput.startsWith("alu") ||
      cleanInput.startsWith("mf-alu") ||
      cleanInput === "sundar@zoho.com" ||
      cleanInput.includes("zoho");

    const detectedRole: "student" | "alumni" = isAlumni ? "alumni" : "student";

    const mockUser = isAlumni
      ? {
        id: "alu-2021-008",
        name: "Sundararaman M",
        fullName: "Sundararaman M",
        email: cleanInput.includes("@") ? cleanInput : "sundararaman.m@alumni.maatramedu.org",
        role: "alumni",
        rollNumber: "MF-ALUM-2019-018",
        phone: "+91 94432 10987",
        dob: "1998-09-22",
        gender: "Male",
        whatsapp: "+91 94432 10987",
        currentCity: "Chennai, Tamil Nadu",
        company: "Zoho Corporation",
        designation: "Senior Software Engineer",
        experienceYears: "5 Years",
        industryDomain: "Product Software & Cloud Infrastructure",
        linkedin: "linkedin.com/in/sundararaman-maatram",
        college: "Sri Venkateswara College of Engineering",
        degree: "B.E Computer Science & Engineering",
        gradBatch: "Class of 2019",
      }
      : {
        id: "stu-2024-042",
        name: "Kavitha R",
        fullName: "Kavitha R",
        email: cleanInput.includes("@") ? cleanInput : "kavitha.r@student.svce.ac.in",
        role: "student",
        rollNumber: "MF-SCH-2024-042",
        college: "Sri Venkateswara College of Engineering",
        degree: "B.Tech Information Technology (2nd Year)",
      };

    setAuthToken(`mock-token-${Date.now()}`);
    saveUser(mockUser);
    setActiveRole(detectedRole);
    setIsLoading(false);
    router.push(detectedRole === "alumni" ? "/alumni/dashboard" : "/student/dashboard");
  };

  // Quick 1-click demo login helper
  const handleQuickDemoLogin = (type: "student" | "alumni") => {
    setErrorMessage("");
    const isAlumni = type === "alumni";
    const demoEmail = isAlumni ? "alumni@maatram.com" : "student@maatram.com";
    const demoPass = "password123";

    setIdentifier(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);

    setTimeout(() => {
      const mockUser = isAlumni
        ? {
          id: "alu-2021-008",
          name: "Sundararaman M",
          email: "sundar@zoho.com",
          role: "alumni",
          rollNumber: "MF-ALU-2021-008",
          college: "Sri Venkateswara College of Engineering",
          company: "Zoho Corporation",
          degree: "B.E Computer Science (Batch of 2021)",
        }
        : {
          id: "stu-2024-042",
          name: "Kavitha R",
          email: "kavitha.r@student.svce.ac.in",
          role: "student",
          rollNumber: "MF-SCH-2024-042",
          college: "Sri Venkateswara College of Engineering",
          degree: "B.Tech Information Technology (2nd Year)",
        };

      setAuthToken(`mock-token-${Date.now()}`);
      saveUser(mockUser);
      setActiveRole(type);
      router.push(isAlumni ? "/alumni/dashboard" : "/student/dashboard");
    }, 400);
  };

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 text-slate-900 px-4 py-10 sm:py-16 font-primary selection:bg-[#F7BC0F]">

      {/* Main Card */}
      <div className="w-full max-w-[29rem] rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-10">
        <header className="mb-7 flex items-center gap-3 border-b border-slate-200 pb-5">
          <span aria-hidden="true" className="h-6 w-1.5 rounded-full bg-[#F7BC0F]" />
          <Link href="/" className="font-heading text-sm font-bold tracking-wide text-slate-700">Maatram Foundation</Link>
        </header>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight text-left">
          Student & Alumni Sign In
        </h1>
        <p className="font-primary text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 text-left">
          Access your student volunteer tasks, academic progress, and alumni network portal.
        </p>

        {/* Info & Error Messages */}
        {infoMessage && !errorMessage && (
          <div className="mt-4 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-center text-xs text-amber-900 font-medium animate-in fade-in">
            {infoMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-600 font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Unified Login Form for Both Students & Alumni */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4" autoComplete="off">
          {!requires2FA ? (
            <>
              {/* User Identifier (Email / Roll No / Mobile) */}
              <div>
                <label className="block text-xs font-heading font-bold text-slate-800 tracking-wide">
                  Registered Email Address or Roll Number
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <AtSymbolIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    suppressHydrationWarning
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="maatramites.tech"
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/40 transition font-primary"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-heading font-bold text-slate-800 tracking-wide">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    suppressHydrationWarning
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/40 transition font-primary"
                  />
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                suppressHydrationWarning
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F7BC0F] hover:bg-[#e5ad0c] active:scale-[0.99] text-slate-950 font-heading font-black text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#F7BC0F]/30 hover:shadow-lg hover:shadow-[#F7BC0F]/40 transition-all duration-200 cursor-pointer mt-5 border border-[#e5ad0c] disabled:opacity-70"
              >
                <span>{isLoading ? "Authenticating..." : "Sign In to Portal"}</span>
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            </>
          ) : (
            /* 2FA OTP Digits Form */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-3">
                  Enter the 6-digit verification code from Google Authenticator or Microsoft Authenticator.
                </p>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => (
                  <input
                    suppressHydrationWarning
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-heading font-extrabold text-xl sm:text-2xl rounded-xl border-2 transition-all outline-none ${digit
                      ? "border-[#F7BC0F] bg-amber-50/40 text-slate-900 shadow-sm"
                      : "border-slate-200 bg-slate-50/80 text-slate-900 focus:border-[#F7BC0F] focus:bg-white focus:ring-4 focus:ring-[#F7BC0F]/20"
                      }`}
                  />
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#F7BC0F] hover:bg-[#e5ad0c] active:scale-[0.99] text-slate-950 font-heading font-black text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#F7BC0F]/30 hover:shadow-lg hover:shadow-[#F7BC0F]/40 transition-all duration-200 cursor-pointer border border-[#e5ad0c] disabled:opacity-70"
                >
                  <span>{isLoading ? "Verifying..." : "Verify Code & Sign In"}</span>
                  <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>

                <button

                  suppressHydrationWarning
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setOtp(["", "", "", "", "", ""]);
                    setErrorMessage("");
                    setInfoMessage("");
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>Back to login credentials</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
