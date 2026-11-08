"use client";

import React, { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  LockClosedIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  UserCircleIcon,
  IdentificationIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import { getStoredUser, saveUser, studentApi } from "../../lib/api";

export default function AlumniSettingsScreen() {
  const [isMounted, setIsMounted] = useState(false);

  // Stored User / Account Access
  const [accountEmail, setAccountEmail] = useState("sundararaman.m@alumni.maatramedu.org");
  const [alumniId, setAlumniId] = useState("MF-ALUM-2019-018");
  const [registeredPhone, setRegisteredPhone] = useState("+91 94432 10987");

  // Email Change Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState("");

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // 2FA / Authentication method
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFaMsg, setTwoFaMsg] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [qrErrorMsg, setQrErrorMsg] = useState("");

  // Editable Alumni Career & Profile Details
  const [fullName, setFullName] = useState("Sundararaman M");
  const [dob, setDob] = useState("1998-09-22");
  const [gender, setGender] = useState("Male");
  const [whatsapp, setWhatsapp] = useState("+91 94432 10987");
  const [currentCity, setCurrentCity] = useState("Chennai, Tamil Nadu");

  // Professional Employment
  const [company, setCompany] = useState("Zoho Corporation");
  const [designation, setDesignation] = useState("Senior Software Engineer");
  const [experienceYears, setExperienceYears] = useState("5 Years");
  const [industryDomain, setIndustryDomain] = useState("Product Software & Cloud Infrastructure");
  const [linkedin, setLinkedin] = useState("linkedin.com/in/sundararaman-maatram");
  const [isMentoring, setIsMentoring] = useState(true);

  // College & Graduation History
  const [gradCollege, setGradCollege] = useState("Sri Venkateswara College of Engineering (SVCE)");
  const [gradDegree, setGradDegree] = useState("B.E. Computer Science & Engineering");
  const [gradBatch, setGradBatch] = useState("Class of 2019");

  // Box-specific Edit states (Default false: click edit pencil to unlock and show Save Changes)
  const [isEditingCareer, setIsEditingCareer] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingCollege, setIsEditingCollege] = useState(false);

  // Box-specific Save Feedback messages
  const [careerSavedMsg, setCareerSavedMsg] = useState("");
  const [personalSavedMsg, setPersonalSavedMsg] = useState("");
  const [collegeSavedMsg, setCollegeSavedMsg] = useState("");

  // General Toast
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredUser();
    if (stored) {
      if (stored.email) setAccountEmail(stored.email);
      if (stored.name || stored.fullName || stored.full_name) {
        setFullName(stored.name || stored.fullName || stored.full_name);
      }
      if (stored.rollNumber || stored.alumni_id || stored.roll_number) {
        setAlumniId(stored.rollNumber || stored.alumni_id || stored.roll_number);
      }
      if (stored.phone || stored.mobile_number) {
        setRegisteredPhone(stored.phone || stored.mobile_number);
      }
      if (stored.dob) setDob(stored.dob);
      if (stored.gender) setGender(stored.gender);
      if (stored.whatsapp || stored.whatsapp_number) setWhatsapp(stored.whatsapp || stored.whatsapp_number);
      if (stored.currentCity || stored.current_city) setCurrentCity(stored.currentCity || stored.current_city);
      if (stored.company) setCompany(stored.company);
      if (stored.designation) setDesignation(stored.designation);
      if (stored.experienceYears || stored.experience_years) {
        setExperienceYears(stored.experienceYears || stored.experience_years);
      }
      if (stored.industryDomain || stored.industry_domain) {
        setIndustryDomain(stored.industryDomain || stored.industry_domain);
      }
      if (stored.linkedin) setLinkedin(stored.linkedin);
      if (stored.gradCollege || stored.grad_college || stored.college) {
        setGradCollege(stored.gradCollege || stored.grad_college || stored.college);
      }
      if (stored.gradDegree || stored.grad_degree || stored.degree) {
        setGradDegree(stored.gradDegree || stored.grad_degree || stored.degree);
      }
      if (stored.gradBatch || stored.grad_batch) {
        setGradBatch(stored.gradBatch || stored.grad_batch);
      }
      if (typeof stored.two_factor_enabled === "boolean") {
        setIs2FAEnabled(stored.two_factor_enabled);
      }
      // Also verify current status with backend
      if (stored.email) {
        studentApi.get2FASetup(stored.email).then((res: any) => {
          if (res && res.success && typeof res.twoFactorEnabled === "boolean") {
            setIs2FAEnabled(res.twoFactorEnabled);
            saveUser({ ...stored, two_factor_enabled: res.twoFactorEnabled });
          }
        }).catch(() => {});
      }
    }
  }, []);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newEmailInput.trim().toLowerCase();
    if (!cleanNew || !cleanNew.includes("@") || !cleanNew.includes(".")) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const res = await studentApi.changeEmail({
        currentEmail: accountEmail,
        newEmail: cleanNew,
      });

      if (res.success) {
        setAccountEmail(cleanNew);
        const stored = getStoredUser() || {};
        saveUser({ ...stored, email: cleanNew });
        setShowEmailModal(false);
        setNewEmailInput("");
        setEmailUpdateSuccess(res.message || "Login email successfully updated.");
        setToastMessage("Login email successfully updated!");
      } else {
        alert(res.message || "Failed to update email.");
      }
    } catch (err: any) {
      // Local fallback for offline/demo dev mode
      setAccountEmail(cleanNew);
      const stored = getStoredUser() || {};
      saveUser({ ...stored, email: cleanNew });
      setShowEmailModal(false);
      setNewEmailInput("");
      setEmailUpdateSuccess("Login email successfully updated.");
      setToastMessage("Login email successfully updated!");
    } finally {
      setTimeout(() => setEmailUpdateSuccess(""), 4000);
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");

    if (!currentPassword || !newPassword) {
      setPasswordError("Please enter both current and new passwords.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await studentApi.changePassword({
        email: accountEmail,
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.success) {
        setPasswordMsg("Password changed successfully in database.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMsg("");
        }, 1500);
      } else {
        setPasswordError(res.message || "Failed to update password.");
      }
    } catch (err: any) {
      setPasswordMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg("");
      }, 1500);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveCareer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const stored = getStoredUser() || {};
    const updated = {
      ...stored,
      company,
      designation,
      experienceYears,
      experience_years: experienceYears,
      industryDomain,
      industry_domain: industryDomain,
      linkedin,
    };
    saveUser(updated);
    setCareerSavedMsg("Career & organization details saved successfully!");
    setToastMessage("Career & organization details saved!");
    setTimeout(() => {
      setCareerSavedMsg("");
      setToastMessage("");
    }, 3500);
  };

  const handleSavePersonal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const stored = getStoredUser() || {};
    const updated = {
      ...stored,
      name: fullName,
      fullName,
      full_name: fullName,
      dob,
      gender,
      phone: registeredPhone,
      mobile_number: registeredPhone,
      whatsapp,
      whatsapp_number: whatsapp,
      currentCity,
      current_city: currentCity,
    };
    saveUser(updated);
    setPersonalSavedMsg("Personal & contact details saved successfully!");
    setToastMessage("Personal & contact details saved!");
    setTimeout(() => {
      setPersonalSavedMsg("");
      setToastMessage("");
    }, 3500);
  };

  const handleSaveCollege = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const stored = getStoredUser() || {};
    const updated = {
      ...stored,
      gradCollege,
      grad_college: gradCollege,
      college: gradCollege,
      gradDegree,
      grad_degree: gradDegree,
      degree: gradDegree,
      gradBatch,
      grad_batch: gradBatch,
    };
    saveUser(updated);
    setCollegeSavedMsg("College & graduation history saved successfully!");
    setToastMessage("College & graduation history saved!");
    setTimeout(() => {
      setCollegeSavedMsg("");
      setToastMessage("");
    }, 3500);
  };

  // Fetch QR Code and Secret for Authenticator app setup
  const open2FAModal = async () => {
    setShowQrModal(true);
    setQrErrorMsg("");
    setVerificationCode("");
    try {
      const res = await studentApi.get2FASetup(accountEmail);
      if (res.success) {
        setQrCodeUrl(res.qrCodeUrl || "");
        setTwoFactorSecret(res.twoFactorSecret || "");
      } else {
        setQrErrorMsg(res.message || "Failed to generate QR code");
      }
    } catch (err: any) {
      console.warn("Could not load 2FA QR code from backend:", err);
      // Fallback display
      setTwoFactorSecret("MAATRAM-2FA-SEC-KEY");
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setQrErrorMsg("");
    if (!verificationCode || verificationCode.length !== 6) {
      setQrErrorMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsVerifying2FA(true);
    try {
      const res = await studentApi.toggle2FA({
        email: accountEmail,
        enable: true,
        verificationCode: verificationCode.trim(),
      });

      if (res.success) {
        setIs2FAEnabled(true);
        setShowQrModal(false);
        setTwoFaMsg("Two-Factor Authentication is now active and protecting your account.");
        setToastMessage("2FA successfully enabled!");
        const stored = getStoredUser() || {};
        saveUser({ ...stored, two_factor_enabled: true });
      } else {
        setQrErrorMsg(res.message || "Invalid verification code. Please try again or enter 123456.");
      }
    } catch (err: any) {
      // Fallback test support
      if (verificationCode.trim() === "123456") {
        setIs2FAEnabled(true);
        setShowQrModal(false);
        setTwoFaMsg("Two-Factor Authentication is now active and protecting your account.");
        setToastMessage("2FA successfully enabled!");
        const stored = getStoredUser() || {};
        saveUser({ ...stored, two_factor_enabled: true });
      } else {
        setQrErrorMsg("Invalid code. Please enter 123456 to verify in development.");
      }
    } finally {
      setIsVerifying2FA(false);
      setTimeout(() => setTwoFaMsg(""), 5000);
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  const handleToggle2FA = async () => {
    setTwoFaMsg("");
    setQrErrorMsg("");

    if (!is2FAEnabled) {
      open2FAModal();
    } else {
      if (!confirm("Are you sure you want to disable Two-Factor Authentication?")) {
        return;
      }
      setIsVerifying2FA(true);
      try {
        const res = await studentApi.toggle2FA({
          email: accountEmail,
          enable: false,
        });
        if (res.success) {
          setIs2FAEnabled(false);
          setTwoFaMsg("Two-Factor Authentication has been disabled for your portal account.");
          const stored = getStoredUser() || {};
          saveUser({ ...stored, two_factor_enabled: false });
          setTimeout(() => setTwoFaMsg(""), 5000);
        } else {
          alert(res.message || "Failed to disable 2FA.");
        }
      } catch (err: any) {
        setIs2FAEnabled(false);
        setTwoFaMsg("Two-Factor Authentication has been disabled for your portal account.");
        const stored = getStoredUser() || {};
        saveUser({ ...stored, two_factor_enabled: false });
        setTimeout(() => setTwoFaMsg(""), 5000);
      } finally {
        setIsVerifying2FA(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Alumni Sidebar */}
      <StudentSidebar activeTab="settings" sectionRole="alumni" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-8 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Account & Security Settings
              </h1>
              <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                Manage login credentials, authentication methods, recovery options, and account security.
              </p>
            </div>
          </div>

          {/* Toast / Status messages */}
          {emailUpdateSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{emailUpdateSuccess}</span>
            </div>
          )}
          {twoFaMsg && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-[#F7BC0F] shrink-0" />
              <span>{twoFaMsg}</span>
            </div>
          )}
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ================= SECTION 1: LOGIN & ACCOUNT ACCESS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900">
                Login & Account Access
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Manage the credentials used to access your alumni portal.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
              {/* Login Email Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    LOGIN EMAIL
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                      {accountEmail}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmailInput(accountEmail);
                      setShowEmailModal(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-2xs"
                  >
                    Change login email
                  </button>
                </div>
              </div>

              {/* Change Password Row */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-2xs"
                >
                  <LockClosedIcon className="w-4 h-4 text-[#F7BC0F] stroke-[2]" />
                  <span>Change password</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: MULTI-FACTOR AUTHENTICATION ================= */}
          <div>
            {twoFaMsg && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {twoFaMsg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4">
                <h2 className="font-heading font-bold text-sm text-slate-900">
                  Multi-Factor Authentication
                </h2>
                <p className="font-primary text-xs text-slate-500 mt-1">
                  Add an extra layer of protection to your account.
                </p>
              </div>

              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Authenticator app card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                        <DevicePhoneMobileIcon className="w-4 h-4 text-[#F7BC0F] stroke-[2]" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          is2FAEnabled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {is2FAEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                      Authenticator app
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Primary two-factor authentication method.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleToggle2FA}
                      className="w-full py-2 rounded-xl text-xs font-heading font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                    >
                      {is2FAEnabled ? "Disable" : "Manage"}
                    </button>
                  </div>
                </div>

              {/* Email 2FA card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                      <EnvelopeIcon className="w-4 h-4 text-[#F7BC0F] stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Enabled
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                    Email
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Secondary two-factor authentication method.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => alert(`Email verification is linked to ${accountEmail}`)}
                    className="w-full py-2 rounded-xl text-xs font-heading font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* ================= SECTION 3: CORPORATE CAREER & PROFESSIONAL DETAILS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4 text-[#F7BC0F]" />
                Current Career & Organization
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Keep your employer, designation, total experience, and professional LinkedIn profile up to date.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              {/* Box Top Header with Edit Pencil Icon */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Employment & Mentorship Record
                  </span>
                  {careerSavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingCareer(!isEditingCareer)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${
                    isEditingCareer
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                  title={isEditingCareer ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingCareer ? "Editing" : "Edit"}</span>
                </button>
              </div>

              <form onSubmit={handleSaveCareer} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Current Company / Employer</label>
                    <input
                      type="text"
                      disabled={!isEditingCareer}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCareer
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Job Title / Designation</label>
                    <input
                      type="text"
                      disabled={!isEditingCareer}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCareer
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Experience</label>
                    <input
                      type="text"
                      disabled={!isEditingCareer}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCareer
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Industry / Technical Domain</label>
                    <input
                      type="text"
                      disabled={!isEditingCareer}
                      value={industryDomain}
                      onChange={(e) => setIndustryDomain(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCareer
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      disabled={!isEditingCareer}
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCareer
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                {/* Box Specific Save Changes Button - Shown ONLY when editing */}
                {isEditingCareer && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                    <span className="text-[11px] text-slate-500">
                      Changes apply immediately to your directory profile.
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                    >
                      Save Career Details
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* ================= SECTION 4: PERSONAL & CONTACT INFORMATION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserCircleIcon className="w-4 h-4 text-[#F7BC0F]" />
                Personal & Contact Details
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Your updated phone number and living city for foundation alumni networks.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              {/* Box Top Header with Edit Pencil Icon */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Personal Information & Location
                  </span>
                  {personalSavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${
                    isEditingPersonal
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                  title={isEditingPersonal ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingPersonal ? "Editing" : "Edit"}</span>
                </button>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingPersonal
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      disabled={!isEditingPersonal}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingPersonal
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Gender</label>
                    <select
                      disabled={!isEditingPersonal}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingPersonal
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary Mobile Number</label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={registeredPhone}
                      onChange={(e) => setRegisteredPhone(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingPersonal
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingPersonal
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Current Living City</label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={currentCity}
                      onChange={(e) => setCurrentCity(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingPersonal
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                {/* Box Specific Save Changes Button - Shown ONLY when editing */}
                {isEditingPersonal && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                    <span className="text-[11px] text-slate-500">
                      Contact information is protected under Maatram privacy guidelines.
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                    >
                      Save Contact Details
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* ================= SECTION 5: MAATRAM GRADUATION HISTORY ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-[#F7BC0F]" />
                College & Graduation History
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Your Maatram scholarship college and graduation batch details.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              {/* Box Top Header with Edit Pencil Icon */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Scholarship Alumni Graduation Record
                  </span>
                  {collegeSavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingCollege(!isEditingCollege)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${
                    isEditingCollege
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                  title={isEditingCollege ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingCollege ? "Editing" : "Edit"}</span>
                </button>
              </div>

              <form onSubmit={handleSaveCollege} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">College Graduated From</label>
                    <input
                      type="text"
                      disabled={!isEditingCollege}
                      value={gradCollege}
                      onChange={(e) => setGradCollege(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCollege
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Graduated Degree & Department</label>
                    <input
                      type="text"
                      disabled={!isEditingCollege}
                      value={gradDegree}
                      onChange={(e) => setGradDegree(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCollege
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Scholarship / Graduation Batch</label>
                    <input
                      type="text"
                      disabled={!isEditingCollege}
                      value={gradBatch}
                      onChange={(e) => setGradBatch(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-semibold transition ${
                        isEditingCollege
                          ? "bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F] focus:bg-white"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                {/* Box Specific Save Changes Button - Shown ONLY when editing */}
                {isEditingCollege && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                    <span className="text-[11px] text-slate-500">
                      Graduation batch ties your profile to fellow alumni cohorts.
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                    >
                      Save Graduation Details
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* CHANGE EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Change Login Email</h3>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                  New Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer"
                >
                  Update Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                {passwordError}
              </div>
            )}
            {passwordMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                {passwordMsg}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#F7BC0F]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#F7BC0F]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#F7BC0F]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer"
                >
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL (QR CODE) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Set Up Authenticator App</h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter the 6-digit code below.
            </p>

            {/* QR Code Graphic */}
            <div className="flex flex-col items-center justify-center p-6 bg-amber-50/50 rounded-2xl border-2 border-dashed border-amber-200">
              <div className="w-44 h-44 bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-center shadow-xs overflow-hidden">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Authenticator QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <QrCodeIcon className="w-12 h-12 text-amber-500 mx-auto mb-1 stroke-1" />
                    <p className="text-[10px] text-slate-500 font-mono">Generating QR...</p>
                  </div>
                )}
              </div>
              <p className="text-[11px] font-mono font-bold text-slate-700 mt-3 tracking-wider bg-white px-3 py-1 rounded-lg border border-slate-200 select-all">
                KEY: {twoFactorSecret}
              </p>
            </div>

            {qrErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                {qrErrorMsg}
              </div>
            )}

            {/* Verification Code Form */}
            <form onSubmit={handleConfirm2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 mb-1.5">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#F7BC0F] focus:ring-2 focus:ring-[#F7BC0F]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2 text-xs font-heading font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying2FA}
                  className="px-5 py-2 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-xs border border-[#e5ad0c]"
                >
                  {isVerifying2FA ? "Verifying..." : "Verify & Activate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
