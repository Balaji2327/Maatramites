"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AtSymbolIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { studentApi } from "../lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Step 1: "email" (enter email to receive OTP)
  // Step 2: "reset" (enter OTP + new password)
  // Step 3: "success" (password updated in database)
  const [step, setStep] = useState<"email" | "reset" | "success">("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Request 6-digit OTP to user's registered email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Please enter a valid registered email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await studentApi.forgotPasswordSendOtp({ email: cleanEmail });
      if (res.success) {
        setStep("reset");
        setInfoMessage(res.message || `A 6-digit verification code has been sent to ${cleanEmail}.`);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } else {
        setErrorMessage(res.message || "Could not find an account with that email address.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Server error while requesting password reset OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP inputs helper
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

  // Step 2: Verify OTP and save new password directly to Supabase Auth database
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const enteredOtp = otp.join("").trim();
    if (enteredOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await studentApi.forgotPasswordReset({
        email: email.trim().toLowerCase(),
        otp: enteredOtp,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setStep("success");
      } else {
        setErrorMessage(res.message || "Failed to reset password. Please check your verification code.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Server error while resetting password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-primary selection:bg-[#F7BC0F] selection:text-black relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#F7BC0F]/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-slate-200/60 relative z-10 transition-all duration-300">
        {/* Brand Logo */}
        <div className="flex flex-col items-center justify-center mb-4">
          <Link href="/login" className="group transition-transform active:scale-95 cursor-pointer focus:outline-none" title="Maatram Foundation">
            <Image
              src="/assets/images/logo.png"
              alt="Maatram Foundation"
              width={160}
              height={80}
              priority
              className="h-14 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </Link>
        </div>

        {/* Step Indicator Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            {step === "success" ? (
              <CheckCircleIcon className="w-6 h-6 text-emerald-600 stroke-2" />
            ) : (
              <KeyIcon className="w-6 h-6 text-[#F7BC0F] stroke-2" />
            )}
          </div>

          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {step === "email" && "Reset Your Password"}
            {step === "reset" && "Verify & Set New Password"}
            {step === "success" && "Password Reset Complete!"}
          </h1>

          <p className="font-primary text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5">
            {step === "email" && "Enter your registered email address to receive a 6-digit verification code."}
            {step === "reset" && `Enter the 6-digit code sent to ${email} and choose your new password.`}
            {step === "success" && "Your password has been securely updated in the database. You can now sign in."}
          </p>
        </div>

        {/* Notifications */}
        {infoMessage && !errorMessage && (
          <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-center text-xs text-amber-900 font-medium animate-in fade-in">
            {infoMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-600 font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: Enter Registered Email */}
        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-heading font-bold text-slate-800 tracking-wide">
                Registered Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <AtSymbolIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="student@maatram.com or alumni@maatram.com"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/40 transition font-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F7BC0F] hover:bg-[#e5ad0c] active:scale-[0.99] text-slate-950 font-heading font-black text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#F7BC0F]/30 hover:shadow-lg hover:shadow-[#F7BC0F]/40 transition-all duration-200 cursor-pointer mt-5 border border-[#e5ad0c] disabled:opacity-70"
            >
              <span>{isLoading ? "Sending Verification Code..." : "Send Verification Code"}</span>
              <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>

            <div className="text-center pt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4" autoComplete="off">
            {/* 6-digit OTP Inputs */}
            <div>
              <label className="block text-xs font-heading font-bold text-slate-800 tracking-wide text-center mb-2">
                6-Digit Verification Code
              </label>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => (
                  <input
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
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-heading font-extrabold text-xl sm:text-2xl rounded-xl border-2 transition-all outline-none ${
                      digit
                        ? "border-[#F7BC0F] bg-amber-50/40 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-slate-50/80 text-slate-900 focus:border-[#F7BC0F] focus:bg-white focus:ring-4 focus:ring-[#F7BC0F]/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-heading font-bold text-slate-800 tracking-wide">
                New Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/40 transition font-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-heading font-bold text-slate-800 tracking-wide">
                Confirm New Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/40 transition font-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F7BC0F] hover:bg-[#e5ad0c] active:scale-[0.99] text-slate-950 font-heading font-black text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#F7BC0F]/30 hover:shadow-lg hover:shadow-[#F7BC0F]/40 transition-all duration-200 cursor-pointer mt-5 border border-[#e5ad0c] disabled:opacity-70"
            >
              <span>{isLoading ? "Saving to Database..." : "Save New Password"}</span>
              <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                  setErrorMessage("");
                  setInfoMessage("");
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Change email</span>
              </button>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isLoading}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline transition cursor-pointer"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === "success" && (
          <div className="mt-6 space-y-5 animate-in fade-in text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-medium">
              Your password has been successfully updated in Supabase Authentication. You can now use your new password to sign in.
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full bg-[#F7BC0F] hover:bg-[#e5ad0c] active:scale-[0.99] text-slate-950 font-heading font-black text-sm sm:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#F7BC0F]/30 hover:shadow-lg hover:shadow-[#F7BC0F]/40 transition-all duration-200 cursor-pointer border border-[#e5ad0c]"
            >
              <span>Proceed to Sign In</span>
              <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
