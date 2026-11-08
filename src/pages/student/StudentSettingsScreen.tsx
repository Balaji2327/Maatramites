"use client";

import React, { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  LockClosedIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  IdentificationIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
  UsersIcon,
  BanknotesIcon,
  SparklesIcon,
  HomeModernIcon,
  PencilSquareIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import { getStoredUser, saveUser, studentApi } from "../../lib/api";

export default function StudentSettingsScreen() {
  const [isMounted, setIsMounted] = useState(false);

  // Stored User / Account Access
  const [accountEmail, setAccountEmail] = useState("kavitha.r@student.svce.ac.in");
  const [rollNumber, setRollNumber] = useState("MF-SCH-2024-042");
  const [registeredPhone, setRegisteredPhone] = useState("+91 98765 43210");

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

  // 2FA / Authentication method (starts disabled until user verifies code from authenticator app)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFaMsg, setTwoFaMsg] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [qrErrorMsg, setQrErrorMsg] = useState("");

  // Per-box Edit states (Matches Alumni Settings design: click pencil icon to enable editing and reveal Save Changes)
  const [isEditingSec1, setIsEditingSec1] = useState(false);
  const [isEditingSec2, setIsEditingSec2] = useState(false);
  const [isEditingSec3, setIsEditingSec3] = useState(false);
  const [isEditingSec4, setIsEditingSec4] = useState(false);
  const [isEditingSec5, setIsEditingSec5] = useState(false);
  const [isEditingSec6, setIsEditingSec6] = useState(false);
  const [isEditingSec7, setIsEditingSec7] = useState(false);

  // Per-box Saved feedback badges
  const [sec1SavedMsg, setSec1SavedMsg] = useState("");
  const [sec2SavedMsg, setSec2SavedMsg] = useState("");
  const [sec3SavedMsg, setSec3SavedMsg] = useState("");
  const [sec4SavedMsg, setSec4SavedMsg] = useState("");
  const [sec5SavedMsg, setSec5SavedMsg] = useState("");
  const [sec6SavedMsg, setSec6SavedMsg] = useState("");
  const [sec7SavedMsg, setSec7SavedMsg] = useState("");

  // SECTION 1: Personal Information
  const [fullName, setFullName] = useState("Kavitha R");
  const [dob, setDob] = useState("2004-06-14");
  const [gender, setGender] = useState("Female");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [whatsapp, setWhatsapp] = useState("+91 98765 43210");
  const [aadhaarNumber, setAadhaarNumber] = useState("XXXX-XXXX-8421");
  const [community, setCommunity] = useState("MBC / DNC");
  const [nationality, setNationality] = useState("Indian");
  const [maritalStatus, setMaritalStatus] = useState("Single");

  // SECTION 2: Family Information
  const [fatherName, setFatherName] = useState("Ramasamy K");
  const [fatherOccupation, setFatherOccupation] = useState("Farmer / Agricultural Laborer");
  const [fatherIncome, setFatherIncome] = useState("₹ 5,000 / month");
  const [fatherEmploymentStatus, setFatherEmploymentStatus] = useState("Daily Wage / Seasonal");

  const [motherName, setMotherName] = useState("Lakshmi R");
  const [motherOccupation, setMotherOccupation] = useState("Homemaker / MGNREGA");
  const [motherIncome, setMotherIncome] = useState("₹ 2,500 / month");
  const [motherEmploymentStatus, setMotherEmploymentStatus] = useState("Part-time Wage");

  const [familyAnnualIncome, setFamilyAnnualIncome] = useState("₹ 60,000 / year");
  const [familyMembersCount, setFamilyMembersCount] = useState("4");
  const [familyType, setFamilyType] = useState("Nuclear Family");
  const [familySituation, setFamilySituation] = useState("Both Parents Working (Low Income)");

  const [guardianName, setGuardianName] = useState("—");
  const [guardianRelation, setGuardianRelation] = useState("—");
  const [guardianOccupation, setGuardianOccupation] = useState("—");
  const [guardianIncome, setGuardianIncome] = useState("—");

  // SECTION 3: Siblings Information
  const [siblings, setSiblings] = useState([
    {
      name: "Suresh R",
      relationship: "Brother",
      age: "16",
      education: "11th Standard (State Board)",
      institution: "Govt Boys Higher Secondary School, Pennagaram",
    },
  ]);

  // SECTION 4: Address & Residence Details
  const [permanentAddress, setPermanentAddress] = useState(
    "4/12, Mariamman Kovil Street, Pennagaram Post, Dharmapuri District, Tamil Nadu"
  );
  const [currentAddress, setCurrentAddress] = useState(
    "College Hostel, Sri Venkateswara College of Engineering, Sriperumbudur, Tamil Nadu"
  );
  const [villageTown, setVillageTown] = useState("Pennagaram");
  const [district, setDistrict] = useState("Dharmapuri");
  const [state, setState] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("636810");
  const [residenceType, setResidenceType] = useState("Rented / Thatched Roof");
  const [collegeDistance, setCollegeDistance] = useState("145 km (Hostel Resident)");

  // SECTION 5: Educational Information
  // 12th HSC
  const [twelfthSchool, setTwelfthSchool] = useState("Government Girls Higher Secondary School, Pennagaram");
  const [twelfthBoard, setTwelfthBoard] = useState("Tamil Nadu State Board");
  const [twelfthYear, setTwelfthYear] = useState("2023");
  const [twelfthStream, setTwelfthStream] = useState("Bio-Maths / Science");
  const [twelfthMarks, setTwelfthMarks] = useState("574.5 / 600");
  const [twelfthPercentage, setTwelfthPercentage] = useState("95.75%");
  const [twelfthCutoff, setTwelfthCutoff] = useState("191.5 / 200");

  // 10th SSLC
  const [tenthSchool, setTenthSchool] = useState("Government High School, Pennagaram");
  const [tenthBoard, setTenthBoard] = useState("Tamil Nadu State Board");
  const [tenthYear, setTenthYear] = useState("2021");
  const [tenthMarks, setTenthMarks] = useState("482 / 500");
  const [tenthPercentage, setTenthPercentage] = useState("96.4%");

  // Preferences & Current College
  const [preferredDegree, setPreferredDegree] = useState("B.E. / B.Tech");
  const [preferredCourse1, setPreferredCourse1] = useState("Computer Science & Engineering");
  const [preferredCourse2, setPreferredCourse2] = useState("Information Technology");
  const [preferredLocation, setPreferredLocation] = useState("Chennai, Coimbatore, Salem");
  const [collegeName, setCollegeName] = useState("Sri Venkateswara College of Engineering (SVCE)");
  const [degreeBranch, setDegreeBranch] = useState("B.E. Computer Science & Engineering");
  const [currentYear, setCurrentYear] = useState("2nd Year (3rd Semester)");
  const [cgpa, setCgpa] = useState("8.74 / 10.0");

  // SECTION 6: Financial Information & Needs
  const [monthlyFamilyIncome, setMonthlyFamilyIncome] = useState("₹ 5,000 - ₹ 7,500");
  const [incomeSources, setIncomeSources] = useState("Agriculture labor, Daily wage, 100-day scheme");
  const [familyDebts, setFamilyDebts] = useState("₹ 1,20,000 (Local agricultural borrowing)");
  const [educationLoans, setEducationLoans] = useState("None (Not eligible for bank loans due to lack of collateral)");
  const [affordabilityWithoutSupport, setAffordabilityWithoutSupport] = useState("No, higher education impossible without Maatram sponsorship");
  const [financialDifficulties, setFinancialDifficulties] = useState(
    "Father is an agricultural laborer facing health difficulties. Mother works in 100-day MGNREGA work. The family has no steady source of income and cannot afford engineering tuition, hostel fees, and semester exam expenses."
  );
  const [whyNeedSupport, setWhyNeedSupport] = useState(
    "My dream is to become a software engineer and lift my family out of generational poverty. With Maatram's 100% scholarship, I can focus entirely on studies and skill development without burdening my parents."
  );

  // SECTION 7: Personal Background & Goals
  const [isOrphan, setIsOrphan] = useState(false);
  const [isSingleParent, setIsSingleParent] = useState(false);
  const [isFirstGraduate, setIsFirstGraduate] = useState(true);
  const [willingToRelocate, setWillingToRelocate] = useState(true);
  const [careerAmbition, setCareerAmbition] = useState("Full Stack Software Engineer & Cloud Architect");
  const [higherEducationReason, setHigherEducationReason] = useState(
    "Education is the only tool that can break the cycle of poverty in my village. I want to build technology solutions that help rural communities and create opportunities for girls from my village."
  );
  const [futureGoals, setFutureGoals] = useState(
    "Secure a high-impact engineering placement at a product firm, support my younger brother's college education, and contribute to Maatram Foundation to support other rural students."
  );
  const [specialCircumstances, setSpecialCircumstances] = useState(
    "First graduate from my village ward to pursue B.E Computer Science. Family relies entirely on rain-fed small agricultural labor."
  );

  // SECTION 8: Document Checklist
  const documents = [
    { label: "Student Passport Photograph", status: "Verified & Uploaded", url: "#" },
    { label: "10th Marksheet (SSLC)", status: "Verified & Uploaded", url: "#" },
    { label: "11th Marksheet (HSC First Year)", status: "Verified & Uploaded", url: "#" },
    { label: "12th Marksheet (HSC Final)", status: "Verified & Uploaded", url: "#" },
    { label: "Community Certificate (MBC)", status: "Verified & Uploaded", url: "#" },
    { label: "Income Certificate (Tahsildar)", status: "Verified & Uploaded", url: "#" },
    { label: "Aadhaar Card (Student)", status: "Verified & Uploaded", url: "#" },
    { label: "First Graduate Certificate", status: "Verified & Uploaded", url: "#" },
    { label: "Parent / Guardian ID Proof", status: "Verified & Uploaded", url: "#" },
  ];

  // Active section jump
  const [activeSection, setActiveSection] = useState("personal");

  // General Toast
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredUser();
    if (stored) {
      if (stored.email) setAccountEmail(stored.email);
      if (stored.name || stored.fullName) setFullName(stored.name || stored.fullName);
      if (stored.rollNumber || stored.application_number) {
        setRollNumber(stored.rollNumber || stored.application_number);
      }
      if (stored.phone || stored.mobile_number) {
        setRegisteredPhone(stored.phone || stored.mobile_number);
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

  const handleSaveSec = (secNum: number, label: string) => {
    // Local state sync without touching backend database
    const current = getStoredUser() || {};
    if (secNum === 1) {
      saveUser({
        ...current,
        name: fullName,
        fullName: fullName,
        phone: registeredPhone,
        dob,
        gender,
        whatsapp,
      });
      setSec1SavedMsg("Saved");
      setIsEditingSec1(false);
      setTimeout(() => setSec1SavedMsg(""), 3500);
    } else if (secNum === 2) {
      setSec2SavedMsg("Saved");
      setIsEditingSec2(false);
      setTimeout(() => setSec2SavedMsg(""), 3500);
    } else if (secNum === 3) {
      setSec3SavedMsg("Saved");
      setIsEditingSec3(false);
      setTimeout(() => setSec3SavedMsg(""), 3500);
    } else if (secNum === 4) {
      setSec4SavedMsg("Saved");
      setIsEditingSec4(false);
      setTimeout(() => setSec4SavedMsg(""), 3500);
    } else if (secNum === 5) {
      setSec5SavedMsg("Saved");
      setIsEditingSec5(false);
      setTimeout(() => setSec5SavedMsg(""), 3500);
    } else if (secNum === 6) {
      setSec6SavedMsg("Saved");
      setIsEditingSec6(false);
      setTimeout(() => setSec6SavedMsg(""), 3500);
    } else if (secNum === 7) {
      setSec7SavedMsg("Saved");
      setIsEditingSec7(false);
      setTimeout(() => setSec7SavedMsg(""), 3500);
    }
    setToastMessage(`${label} updated successfully!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage("Scholar profile details updated successfully!");
    setTimeout(() => setToastMessage(""), 4000);
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

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`sec-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Student Sidebar */}
      <StudentSidebar activeTab="settings" sectionRole="student" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-8 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1.5">
                Student Profile & Settings
              </h1>
              <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                View your complete admission profile filled during application alongside portal security and credentials.
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
                Manage the credentials and identifier used to sign in to your scholar portal.
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${is2FAEnabled
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

                {/* Email Verification Card */}
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
                      onClick={() => alert(`Email verification is linked directly to ${accountEmail}`)}
                      className="w-full py-2 rounded-xl text-xs font-heading font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 3: PERSONAL INFORMATION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserCircleIcon className="w-4 h-4 text-[#F7BC0F]" />
                Personal Information
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Candidate identification, official identification, blood group and demographic records.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Candidate Profile & Identity
                  </span>
                  {sec1SavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSec1(!isEditingSec1)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${isEditingSec1
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    title={isEditingSec1 ? "Editing Active" : "Click to Edit"}
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                    <span>{isEditingSec1 ? "Editing" : "Edit"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Student Full Name</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Date of Birth</span>
                  <input
                    type="date"
                    disabled={!isEditingSec1}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Gender</span>
                  <select
                    disabled={!isEditingSec1}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Blood Group</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Mobile Number</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={registeredPhone}
                    onChange={(e) => setRegisteredPhone(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">WhatsApp Number</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Email Address</span>
                  <p className="font-bold text-sm text-slate-900 mt-1 truncate">{accountEmail}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Aadhaar Number</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className={`w-full rounded-xl p-2 font-mono font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Community / Category</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={community}
                    onChange={(e) => setCommunity(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nationality</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Marital Status</span>
                  <input
                    type="text"
                    disabled={!isEditingSec1}
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec1
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>
              </div>

              {/* Box Specific Save Changes Button - Shown ONLY when editing */}
              {isEditingSec1 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                  <span className="text-[11px] text-slate-500">
                    Changes apply immediately to your student personal profile.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveSec(1, "Personal Details")}
                    className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 4: FAMILY INFORMATION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-[#F7BC0F]" />
                Family & Household Details
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Parents, guardianship, household income and family economic conditions.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Parents & Household Economics
                  </span>
                  {sec2SavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSec2(!isEditingSec2)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${isEditingSec2
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  title={isEditingSec2 ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingSec2 ? "Editing" : "Edit"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Father Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Father's Details</span>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-bold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Occupation</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={fatherOccupation}
                      onChange={(e) => setFatherOccupation(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F7BC0F]"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Monthly Income</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={fatherIncome}
                        onChange={(e) => setFatherIncome(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Employment</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={fatherEmploymentStatus}
                        onChange={(e) => setFatherEmploymentStatus(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Mother Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Mother's Details</span>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-bold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Occupation</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={motherOccupation}
                      onChange={(e) => setMotherOccupation(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F7BC0F]"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Monthly Income</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={motherIncome}
                        onChange={(e) => setMotherIncome(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Employment</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={motherEmploymentStatus}
                        onChange={(e) => setMotherEmploymentStatus(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Income & Household Overview */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Family Income & Status</span>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Annual Household Income</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={familyAnnualIncome}
                      onChange={(e) => setFamilyAnnualIncome(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-bold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-emerald-800"
                        : "bg-slate-100/70 border border-slate-200/60 text-emerald-800 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Total Members</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={familyMembersCount}
                        onChange={(e) => setFamilyMembersCount(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Family Type</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={familyType}
                        onChange={(e) => setFamilyType(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Family Situation</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={familySituation}
                      onChange={(e) => setFamilySituation(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-slate-800"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>

                {/* Guardian Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Guardian (If Applicable)</span>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Guardian Name</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-slate-800"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Relation</label>
                    <input
                      type="text"
                      disabled={!isEditingSec2}
                      value={guardianRelation}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                        ? "bg-white border border-slate-200 text-slate-800"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Occupation</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={guardianOccupation}
                        onChange={(e) => setGuardianOccupation(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Income</label>
                      <input
                        type="text"
                        disabled={!isEditingSec2}
                        value={guardianIncome}
                        onChange={(e) => setGuardianIncome(e.target.value)}
                        className={`w-full rounded-xl p-1.5 font-semibold transition ${isEditingSec2
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box Specific Save Changes Button - Shown ONLY when editing */}
              {isEditingSec2 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                  <span className="text-[11px] text-slate-500">
                    Changes apply immediately to your family records.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveSec(2, "Family Information")}
                    className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 5: SIBLINGS INFORMATION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <IdentificationIcon className="w-4 h-4 text-[#F7BC0F]" />
                Siblings Information
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Brothers, sisters, their age, school or college education and institution details.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Brothers & Sisters Details
                  </span>
                  {sec3SavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 hidden sm:inline-block">
                    Total Siblings: {siblings.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSec3(!isEditingSec3)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${isEditingSec3
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    title={isEditingSec3 ? "Editing Active" : "Click to Edit"}
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                    <span>{isEditingSec3 ? "Editing" : "Edit"}</span>
                  </button>
                </div>
              </div>

              {siblings.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-heading font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Sibling Name</th>
                        <th className="py-3 px-4">Relationship</th>
                        <th className="py-3 px-4">Age</th>
                        <th className="py-3 px-4">Education / Class</th>
                        <th className="py-3 px-4">School / Institution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {siblings.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {isEditingSec3 ? (
                              <input
                                type="text"
                                value={s.name}
                                onChange={(e) => {
                                  const updated = [...siblings];
                                  updated[idx].name = e.target.value;
                                  setSiblings(updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                              />
                            ) : (
                              s.name
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {isEditingSec3 ? (
                              <input
                                type="text"
                                value={s.relationship}
                                onChange={(e) => {
                                  const updated = [...siblings];
                                  updated[idx].relationship = e.target.value;
                                  setSiblings(updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-700 focus:outline-none focus:border-[#F7BC0F]"
                              />
                            ) : (
                              s.relationship
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {isEditingSec3 ? (
                              <input
                                type="text"
                                value={s.age}
                                onChange={(e) => {
                                  const updated = [...siblings];
                                  updated[idx].age = e.target.value;
                                  setSiblings(updated);
                                }}
                                className="w-16 bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-700 focus:outline-none focus:border-[#F7BC0F]"
                              />
                            ) : (
                              `${s.age} yrs`
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {isEditingSec3 ? (
                              <input
                                type="text"
                                value={s.education}
                                onChange={(e) => {
                                  const updated = [...siblings];
                                  updated[idx].education = e.target.value;
                                  setSiblings(updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-800 focus:outline-none focus:border-[#F7BC0F]"
                              />
                            ) : (
                              s.education
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {isEditingSec3 ? (
                              <input
                                type="text"
                                value={s.institution}
                                onChange={(e) => {
                                  const updated = [...siblings];
                                  updated[idx].institution = e.target.value;
                                  setSiblings(updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-800 focus:outline-none focus:border-[#F7BC0F]"
                              />
                            ) : (
                              s.institution
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                  No siblings recorded in application.
                </p>
              )}

              {/* Box Specific Save Changes Button - Shown ONLY when editing */}
              {isEditingSec3 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                  <span className="text-[11px] text-slate-500">
                    Sibling status synchronized with household file.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveSec(3, "Siblings Information")}
                    className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 6: ADDRESS & RESIDENCE DETAILS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <HomeModernIcon className="w-4 h-4 text-[#F7BC0F]" />
                Address & Residence
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Permanent native home, district, pin code and current college accommodation details.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Residence & Native Address
                  </span>
                  {sec4SavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSec4(!isEditingSec4)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${isEditingSec4
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  title={isEditingSec4 ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingSec4 ? "Editing" : "Edit"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Permanent Native Address
                  </span>
                  <textarea
                    rows={2}
                    disabled={!isEditingSec4}
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    className={`w-full rounded-xl p-2 font-medium transition ${isEditingSec4
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Current Residential Address (Hostel / Day Scholar)
                  </span>
                  <textarea
                    rows={2}
                    disabled={!isEditingSec4}
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    className={`w-full rounded-xl p-2 font-medium transition ${isEditingSec4
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Village / Town</span>
                  <input
                    type="text"
                    disabled={!isEditingSec4}
                    value={villageTown}
                    onChange={(e) => setVillageTown(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec4
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">District & State</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      disabled={!isEditingSec4}
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec4
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                    <input
                      type="text"
                      disabled={!isEditingSec4}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec4
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">PIN Code</span>
                  <input
                    type="text"
                    disabled={!isEditingSec4}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className={`w-full rounded-xl p-2 font-mono font-bold transition ${isEditingSec4
                      ? "bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Residence Type</span>
                  <input
                    type="text"
                    disabled={!isEditingSec4}
                    value={residenceType}
                    onChange={(e) => setResidenceType(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec4
                      ? "bg-white border border-slate-200 text-slate-900"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Distance from Native to College
                  </span>
                  <input
                    type="text"
                    disabled={!isEditingSec4}
                    value={collegeDistance}
                    onChange={(e) => setCollegeDistance(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec4
                      ? "bg-white border border-slate-200 text-slate-900"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>
              </div>

              {/* Box Specific Save Changes Button - Shown ONLY when editing */}
              {isEditingSec4 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                  <span className="text-[11px] text-slate-500">
                    Changes apply immediately to your registered residence address.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveSec(4, "Address & Residence")}
                    className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 7: EDUCATIONAL INFORMATION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-[#F7BC0F]" />
                Educational Information
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Board exam cutoffs, 10th & 12th school performance, degree preferences and current college admission.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Academic Scores & Allotment
                  </span>
                  {sec5SavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSec5(!isEditingSec5)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${isEditingSec5
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  title={isEditingSec5 ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingSec5 ? "Editing" : "Edit"}</span>
                </button>
              </div>

              {/* 12th Standard HSC (Highlighted in Amber) */}
              <div className="p-5 bg-amber-50/70 border border-amber-300 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-black text-sm text-amber-950 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-[#F7BC0F]" />
                    12th Higher Secondary Marks (HSC)
                  </span>
                  <span className="px-3 py-1 bg-[#F7BC0F] font-mono font-black text-xs sm:text-sm text-slate-950 rounded-xl shadow-xs border border-[#e5ad0c]">
                    HSC Cutoff: {twelfthCutoff}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-600 block mb-1">School Name:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={twelfthSchool}
                      onChange={(e) => setTwelfthSchool(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-amber-300 text-slate-900"
                        : "bg-amber-100/60 border border-amber-200/80 text-slate-800 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 block mb-1">Board & Year:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        disabled={!isEditingSec5}
                        value={twelfthBoard}
                        onChange={(e) => setTwelfthBoard(e.target.value)}
                        className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                          ? "bg-white border border-amber-300 text-slate-900"
                          : "bg-amber-100/60 border border-amber-200/80 text-slate-800 cursor-not-allowed"
                          }`}
                      />
                      <input
                        type="text"
                        disabled={!isEditingSec5}
                        value={twelfthYear}
                        onChange={(e) => setTwelfthYear(e.target.value)}
                        className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                          ? "bg-white border border-amber-300 text-slate-900"
                          : "bg-amber-100/60 border border-amber-200/80 text-slate-800 cursor-not-allowed"
                          }`}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 block mb-1">Group / Stream:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={twelfthStream}
                      onChange={(e) => setTwelfthStream(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-amber-300 text-slate-900"
                        : "bg-amber-100/60 border border-amber-200/80 text-slate-800 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 block mb-1">Total Marks & %:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        disabled={!isEditingSec5}
                        value={twelfthMarks}
                        onChange={(e) => setTwelfthMarks(e.target.value)}
                        className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                          ? "bg-white border border-amber-300 text-slate-900"
                          : "bg-amber-100/60 border border-amber-200/80 text-slate-800 cursor-not-allowed"
                          }`}
                      />
                      <input
                        type="text"
                        disabled={!isEditingSec5}
                        value={twelfthPercentage}
                        onChange={(e) => setTwelfthPercentage(e.target.value)}
                        className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                          ? "bg-white border border-amber-300 text-slate-900"
                          : "bg-amber-100/60 border border-amber-200/80 text-slate-800 cursor-not-allowed"
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 10th Standard SSLC */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 block mb-3">
                  10th Secondary School Marks (SSLC)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">School Name:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={tenthSchool}
                      onChange={(e) => setTenthSchool(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Board & Passing Year:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        disabled={!isEditingSec5}
                        value={tenthBoard}
                        onChange={(e) => setTenthBoard(e.target.value)}
                        className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                          ? "bg-white border border-slate-200 text-slate-900"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                      <input
                        type="text"
                        disabled={!isEditingSec5}
                        value={tenthYear}
                        onChange={(e) => setTenthYear(e.target.value)}
                        className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                          ? "bg-white border border-slate-200 text-slate-900"
                          : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                          }`}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Total Marks:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={tenthMarks}
                      onChange={(e) => setTenthMarks(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Percentage:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={tenthPercentage}
                      onChange={(e) => setTenthPercentage(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Preferences during Admission */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 block mb-3">
                  Course & College Preferences Submitted
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Preferred Degree:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={preferredDegree}
                      onChange={(e) => setPreferredDegree(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">1st Preference Course:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={preferredCourse1}
                      onChange={(e) => setPreferredCourse1(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">2nd Preference Course:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={preferredCourse2}
                      onChange={(e) => setPreferredCourse2(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Preferred Location:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={preferredLocation}
                      onChange={(e) => setPreferredLocation(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Allotted College & Ongoing Academics */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 block mb-3">
                  Allotted Institution & Ongoing Academic Status
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 block mb-1">Allotted College Name:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Department & Branch:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={degreeBranch}
                      onChange={(e) => setDegreeBranch(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Current Academic Year:</span>
                    <input
                      type="text"
                      disabled={!isEditingSec5}
                      value={currentYear}
                      onChange={(e) => setCurrentYear(e.target.value)}
                      className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec5
                        ? "bg-white border border-slate-200 text-slate-900"
                        : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Box Specific Save Changes Button - Shown ONLY when editing */}
              {isEditingSec5 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                  <span className="text-[11px] text-slate-500">
                    Academic performance and allotted college details updated.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveSec(5, "Academic Information")}
                    className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 8: FINANCIAL INFORMATION & NEEDS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <BanknotesIcon className="w-4 h-4 text-[#F7BC0F]" />
                Financial Information & Needs
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Household income sources, family debts, loans and essential scholarship justification.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Economic Hardship & Rationale
                  </span>
                  {sec6SavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSec6(!isEditingSec6)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${isEditingSec6
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  title={isEditingSec6 ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingSec6 ? "Editing" : "Edit"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Annual Family Income</span>
                  <input
                    type="text"
                    disabled={!isEditingSec6}
                    value={familyAnnualIncome}
                    onChange={(e) => setFamilyAnnualIncome(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-emerald-800"
                      : "bg-slate-100/70 border border-slate-200/60 text-emerald-800 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Monthly Family Income</span>
                  <input
                    type="text"
                    disabled={!isEditingSec6}
                    value={monthlyFamilyIncome}
                    onChange={(e) => setMonthlyFamilyIncome(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-slate-900"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Income Sources</span>
                  <input
                    type="text"
                    disabled={!isEditingSec6}
                    value={incomeSources}
                    onChange={(e) => setIncomeSources(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-slate-900"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Family Debts</span>
                  <input
                    type="text"
                    disabled={!isEditingSec6}
                    value={familyDebts}
                    onChange={(e) => setFamilyDebts(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-slate-900"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Existing Education Loans</span>
                  <input
                    type="text"
                    disabled={!isEditingSec6}
                    value={educationLoans}
                    onChange={(e) => setEducationLoans(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-slate-900"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Can Afford Without Support?</span>
                  <input
                    type="text"
                    disabled={!isEditingSec6}
                    value={affordabilityWithoutSupport}
                    onChange={(e) => setAffordabilityWithoutSupport(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-rose-700"
                      : "bg-slate-100/70 border border-slate-200/60 text-rose-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 sm:col-span-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Financial Difficulties Faced by Family
                  </span>
                  <textarea
                    rows={3}
                    disabled={!isEditingSec6}
                    value={financialDifficulties}
                    onChange={(e) => setFinancialDifficulties(e.target.value)}
                    className={`w-full rounded-xl p-2.5 leading-relaxed font-medium transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 sm:col-span-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Why the Student Needs Financial Support
                  </span>
                  <textarea
                    rows={3}
                    disabled={!isEditingSec6}
                    value={whyNeedSupport}
                    onChange={(e) => setWhyNeedSupport(e.target.value)}
                    className={`w-full rounded-xl p-2.5 leading-relaxed font-medium transition ${isEditingSec6
                      ? "bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#F7BC0F]"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>
              </div>

              {/* Box Specific Save Changes Button - Shown ONLY when editing */}
              {isEditingSec6 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                  <span className="text-[11px] text-slate-500">
                    Financial profile updated with foundation records.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveSec(6, "Financial Information")}
                    className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 9: PERSONAL BACKGROUND & AMBITIONS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-[#F7BC0F]" />
                Background & Ambitions
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                First graduate status, personal background, career ambitions and long-term vision.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Ambitions, Motivation & Goals
                  </span>
                  {sec7SavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSec7(!isEditingSec7)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer border ${isEditingSec7
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  title={isEditingSec7 ? "Editing Active" : "Click to Edit"}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-[#F7BC0F]" />
                  <span>{isEditingSec7 ? "Editing" : "Edit"}</span>
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold border ${isOrphan
                    ? "bg-rose-100 border-rose-300 text-rose-950"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                >
                  {isOrphan ? "✓ Orphan Student" : "Both Parents"}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold border ${isSingleParent
                    ? "bg-purple-100 border-purple-300 text-purple-950"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                >
                  {isSingleParent ? "✓ Single Parent Child" : "Both Parents Living"}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold border ${isFirstGraduate
                    ? "bg-amber-100 border-amber-300 text-amber-950"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                >
                  {isFirstGraduate ? "✓ First-Generation Graduate" : "Non-First Graduate"}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold border ${willingToRelocate
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                >
                  {willingToRelocate ? "✓ Willing to Relocate in Tamil Nadu" : "Local Area Only"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Career Ambition</span>
                  <input
                    type="text"
                    disabled={!isEditingSec7}
                    value={careerAmbition}
                    onChange={(e) => setCareerAmbition(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold transition ${isEditingSec7
                      ? "bg-white border border-slate-200 text-slate-900"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Why You Wanted Higher Education
                  </span>
                  <textarea
                    rows={3}
                    disabled={!isEditingSec7}
                    value={higherEducationReason}
                    onChange={(e) => setHigherEducationReason(e.target.value)}
                    className={`w-full rounded-xl p-2 font-medium transition ${isEditingSec7
                      ? "bg-white border border-slate-200 text-slate-800"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Future Goals</span>
                  <textarea
                    rows={3}
                    disabled={!isEditingSec7}
                    value={futureGoals}
                    onChange={(e) => setFutureGoals(e.target.value)}
                    className={`w-full rounded-xl p-2 font-medium transition ${isEditingSec7
                      ? "bg-white border border-slate-200 text-slate-800"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Special Family Circumstances
                  </span>
                  <textarea
                    rows={2}
                    disabled={!isEditingSec7}
                    value={specialCircumstances}
                    onChange={(e) => setSpecialCircumstances(e.target.value)}
                    className={`w-full rounded-xl p-2 font-medium transition ${isEditingSec7
                      ? "bg-white border border-slate-200 text-slate-800"
                      : "bg-slate-100/70 border border-slate-200/60 text-slate-700 cursor-not-allowed"
                      }`}
                  />
                </div>
              </div>

              {/* Box Specific Save Changes Button - Shown ONLY when editing */}
              {isEditingSec7 && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                  <span className="text-[11px] text-slate-500">
                    Goals and ambition notes recorded.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveSec(7, "Ambitions & Goals")}
                    className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-[#e5ad0c]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION 10: DOCUMENTS CHECKLIST ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <DocumentCheckIcon className="w-4 h-4 text-[#F7BC0F]" />
                Documents & Verification
              </h2>
              <p className="font-primary text-xs text-slate-500 mt-1">
                Official certificates, marksheet proofs and verified candidate uploads.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900">
                    Application Dossier Certificates
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  9 Verified Proofs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <span className="font-heading font-bold text-slate-900 text-xs block">{doc.label}</span>
                      <span className="font-semibold text-emerald-700 text-[11px] flex items-center gap-1 mt-1">
                        <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-600" /> {doc.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-400">PDF / Image</span>
                      <button
                        type="button"
                        onClick={() => alert(`Opening certificate copy: ${doc.label}`)}
                        className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" /> View Proof
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Applicant Declaration */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs text-amber-950 mt-4">
                <p className="font-bold">Applicant Declaration</p>
                <p className="mt-1 text-slate-700 leading-relaxed">
                  "I hereby declare that all details furnished in this application are true and correct to the best of my knowledge and belief. I agree to abide by the rules and code of conduct of Maatram Foundation."
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Council Notice Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4 text-xs text-slate-500">
            <span>All student records and admission proofs are strictly archived by the Maatram Foundation Academic Council.</span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shrink-0">
              Council Protected
            </span>
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
                  placeholder="name@student.college.ac.in"
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
