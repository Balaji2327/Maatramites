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

      if (res.success && res.user && res.memberRole && res.session?.access_token) {
        const u = res.user;
        const meta = u.user_metadata || {};
        const isAlumni = res.memberRole === "alumni";

        const detectedRole: "student" | "alumni" = isAlumni ? "alumni" : "student";

        const userProfile = !isAlumni ? {
          id: u.id, email: u.email, role: detectedRole, name: meta.scholar_fullName || meta.full_name || "",
          fullName: meta.scholar_fullName || meta.full_name || "", rollNumber: meta.scholar_rollNumber || meta.roll_number || "",
          college: meta.scholar_collegeName || meta.college_name || "", degree: meta.scholar_degreeBranch || meta.degree_branch || "",
          phone: meta.scholar_mobileNumber || meta.phone || u.phone || "",
        } : {
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

        setAuthToken(res.session.access_token);
        saveUser(userProfile);
        setActiveRole(detectedRole);
        setIsLoading(false);
        router.push(detectedRole === "alumni" ? "/alumni/dashboard" : "/student/dashboard");
        return;
      }
      setErrorMessage("Could not verify your membership.");
    } catch {
      setErrorMessage("Could not reach the sign-in service. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-black/5 text-black px-4 py-10 sm:py-16 font-primary selection:bg-brand">

      {/* Main Card */}
      <div className="w-full max-w-[29rem] rounded-xl border border-black/15 bg-white p-6 shadow-sm sm:p-10">
        <header className="mb-7 flex items-center gap-3 border-b border-black/15 pb-5">
          <span aria-hidden="true" className="h-6 w-1.5 rounded-full bg-brand" />
          <Link href="/" className="font-heading text-sm font-bold tracking-wide text-black">Maatram Foundation</Link>
        </header>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight text-left">
          Student & Alumni Sign In
        </h1>
        <p className="font-primary text-xs sm:text-sm text-black leading-relaxed mt-2 text-left">
          Maatram students and alumni can sign in with their existing credentials.
        </p>

        {/* Info & Error Messages */}
        {infoMessage && !errorMessage && (
          <div className="mt-4 p-2.5 bg-brand/15 border border-brand/60 rounded-md text-center text-xs text-black font-medium animate-in fade-in">
            {infoMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-2.5 bg-brand/15 border border-brand/60 rounded-md text-center text-xs text-black font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Unified Login Form for Both Students & Alumni */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4" autoComplete="off">
          {!requires2FA ? (
            <>
              {/* User Identifier (Email / Roll No / Mobile) */}
              <div>
                <label className="block text-xs font-heading font-bold text-black tracking-wide">
                  Registered email or application ID
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <AtSymbolIcon className="w-4 h-4 text-black/65" />
                  </div>
                  <input
                    suppressHydrationWarning
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="Email or application ID"
                    className="w-full bg-black/5 border border-black/15 rounded-md pl-10 pr-4 py-3 text-black placeholder-black/65 text-xs sm:text-sm focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/40 transition font-primary"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-heading font-bold text-black tracking-wide">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-black/65 hover:text-black hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-4 h-4 text-black/65" />
                  </div>
                  <input
                    suppressHydrationWarning
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full bg-black/5 border border-black/15 rounded-md pl-10 pr-10 py-3 text-black placeholder-black/65 text-xs sm:text-sm focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/40 transition font-primary"
                  />
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/65 hover:text-black cursor-pointer"
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
                className="w-full bg-brand hover:brightness-95 text-black font-heading font-bold text-sm sm:text-base py-3.5 px-6 rounded-md flex items-center justify-center gap-2 shadow-sm hover:shadow-sm transition-all duration-200 cursor-pointer mt-5 border border-brand disabled:opacity-70"
              >
                <span>{isLoading ? "Authenticating..." : "Sign In to Portal"}</span>
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            </>
          ) : (
            /* 2FA OTP Digits Form */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center">
                <p className="text-xs text-black mb-3">
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
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-heading font-bold text-xl sm:text-2xl rounded-md border-2 transition-all outline-none ${digit
                      ? "border-brand bg-brand/15 text-black "
                      : "border-black/15 bg-black/5 text-black focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/20"
                      }`}
                  />
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand hover:brightness-95 text-black font-heading font-bold text-sm sm:text-base py-3.5 px-6 rounded-md flex items-center justify-center gap-2 shadow-sm hover:shadow-sm transition-all duration-200 cursor-pointer border border-brand disabled:opacity-70"
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
                  className="w-full py-2.5 px-4 text-xs font-semibold text-black hover:text-black transition flex items-center justify-center gap-1.5 cursor-pointer"
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
