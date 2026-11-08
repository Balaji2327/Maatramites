"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PhoneIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  UserCircleIcon,
  BuildingLibraryIcon,
  SparklesIcon,
  XMarkIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  GlobeAltIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "@/components/StudentSidebar";
import { getStoredUser, studentApi } from "@/lib/api";

interface VolunteerScreenProps {
  role: "student" | "alumni";
}

export default function VolunteerEnrollScreen({ role }: VolunteerScreenProps) {
  const isAlumni = role === "alumni";
  const [isRegisteredVolunteer, setIsRegisteredVolunteer] = useState(false);
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile-derived defaults
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    yearOfStudy: isAlumni ? "Alumni" : "1st Year",
    batch: isAlumni ? "Class of 2021" : "2024-2028",
    company: isAlumni ? "Leading Tech Firm" : "",
    designation: isAlumni ? "Software Engineer" : "",
    skills: isAlumni
      ? "Technical Mock Interviews, Socio-economic verification, Career Mentorship"
      : "Applicant Calling Duty, Document verification, Event desk, Peer Tutoring",
  });

  // Check volunteer status on load
  useEffect(() => {
    // Clean up any stale legacy global keys
    localStorage.removeItem("maatram_volunteer_student");
    localStorage.removeItem("maatram_volunteer_alumni");

    const storedUser = getStoredUser();
    const cleanEmail = (storedUser?.email || "").trim().toLowerCase();

    if (storedUser) {
      setFormData({
        name: storedUser.name || storedUser.full_name || "",
        email: cleanEmail,
        phone: storedUser.phone || storedUser.mobile_number || storedUser.whatsapp || "+91 98765 43210",
        college: storedUser.college || storedUser.college_name || storedUser.grad_college || (isAlumni ? "Anna University" : "Engineering College"),
        department: storedUser.department || storedUser.degree || (isAlumni ? "Information Technology" : "Computer Science & Engineering"),
        yearOfStudy: storedUser.year || storedUser.current_year || (isAlumni ? "Alumni" : "1st Year"),
        batch: storedUser.gradBatch || storedUser.grad_batch || (isAlumni ? "Class of 2021" : "2024-2028"),
        company: storedUser.company || (isAlumni ? "Leading Tech Firm" : ""),
        designation: storedUser.designation || (isAlumni ? "Software Engineer" : ""),
        skills: isAlumni
          ? "Technical Mock Interviews, Socio-economic verification, Career Mentorship"
          : "Applicant Calling Duty, Document verification, Event desk, Peer Tutoring",
      });
    }

    if (!cleanEmail) {
      setIsRegisteredVolunteer(false);
      setVolunteerData(null);
      return;
    }

    const userVolKey = `maatram_volunteer_${cleanEmail}`;
    const localVol = localStorage.getItem(userVolKey);
    if (localVol) {
      try {
        const parsed = JSON.parse(localVol);
        setIsRegisteredVolunteer(true);
        setVolunteerData(parsed);
      } catch {
        // ignore
      }
    } else {
      setIsRegisteredVolunteer(false);
      setVolunteerData(null);
    }

    // Authoritative check against backend database
    studentApi
      .checkVolunteerStatus(cleanEmail)
      .then((res) => {
        if (res.success && res.isRegistered && res.data) {
          setIsRegisteredVolunteer(true);
          setVolunteerData(res.data);
          localStorage.setItem(userVolKey, JSON.stringify(res.data));
        } else {
          setIsRegisteredVolunteer(false);
          setVolunteerData(null);
          localStorage.removeItem(userVolKey);
        }
      })
      .catch(() => { });
  }, [role, isAlumni]);

  const handleOpenRegisterModal = () => {
    setIsRegisterModalOpen(true);
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const cleanEmail = (formData.email || "").trim().toLowerCase();
    const payload = {
      name: formData.name || "Volunteer",
      email: cleanEmail,
      phone: formData.phone,
      college: formData.college,
      department: formData.department,
      year_of_study: formData.yearOfStudy,
      batch: formData.batch,
      company: formData.company,
      designation: formData.designation,
      skills: formData.skills,
      role: isAlumni ? "alumni" : "student",
    };

    try {
      const res = await studentApi.registerVolunteer(payload);
      const reg = res.success && res.data ? res.data : payload;

      setIsRegisteredVolunteer(true);
      setVolunteerData(reg);
      if (cleanEmail) {
        localStorage.setItem(`maatram_volunteer_${cleanEmail}`, JSON.stringify(reg));
      }
      setIsRegisterModalOpen(false);
      setToastMessage(
        "You are successfully registered as a volunteer! Wait to contribute to Maatram as a volunteer."
      );
      setTimeout(() => setToastMessage(""), 6000);
    } catch {
      // Offline fallback
      setIsRegisteredVolunteer(true);
      setVolunteerData(payload);
      if (cleanEmail) {
        localStorage.setItem(`maatram_volunteer_${cleanEmail}`, JSON.stringify(payload));
      }
      setIsRegisterModalOpen(false);
      setToastMessage("You are successfully registered as a volunteer! Wait to contribute to Maatram as a volunteer.");
      setTimeout(() => setToastMessage(""), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      <StudentSidebar activeTab="volunteer" sectionRole={role} />

      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 flex flex-col flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
                Volunteer Portal
              </h1>
              <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                {isAlumni
                  ? "Give back to the foundation by verifying applicant calls, conducting mock interviews, and supporting events."
                  : "Every Maatram scholar is a volunteer. Register your volunteer status to participate in foundation drives."}
              </p>
            </div>

            <Link
              href={isAlumni ? "/alumni/events" : "/student/events"}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-900 bg-white border border-slate-200 hover:border-[#F7BC0F] transition shadow-xs"
            >
              <CalendarDaysIcon className="w-4 h-4 text-[#F7BC0F]" />
              <span>Browse Active Events</span>
            </Link>
          </div>

          {/* Toast */}
          {toastMessage && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircleIcon className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* CENTER OF THE PAGE: REGISTER VOLUNTEER PROMINENT SECTION */}
          {/* ======================================================== */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-full max-w-3xl">
            {!isRegisteredVolunteer ? (
              /* NOT YET REGISTERED CARD */
              <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50 rounded-3xl border-2 border-amber-300 p-8 shadow-sm text-center space-y-5">

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Registration Required
                  </span>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
                    Register as a Volunteer
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-primary">
                    To participate in Remote calling tasks or Offline event drives posted by the Foundation Admin, register your volunteer profile below. We will retrieve your verified profile information to get you started.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenRegisterModal}
                    className="px-8 py-3.5 rounded-2xl text-sm font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] transition cursor-pointer shadow-md hover:shadow-lg border border-[#e5ad0c] inline-flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <IdentificationIcon className="w-5 h-5 stroke-[2.2]" />
                    <span>Register Volunteer</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
                  <EnvelopeIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Registered volunteers receive instant email notifications when new events are posted.</span>
                </p>
              </div>
            ) : (
              /* ALREADY REGISTERED STATUS CARD */
              <div className="bg-white rounded-3xl border-2 border-emerald-400 p-7 sm:p-9 shadow-md space-y-6 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-6 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircleIcon className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="font-heading font-black text-xl text-slate-900">
                          You are successfully registered as a volunteer!
                        </h3>
                        <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium max-w-xl">
                        Wait for the opportunity to contribute to Maatram as a volunteer. You will receive notifications when new drives and activities are posted.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={isAlumni ? "/alumni/events" : "/student/events"}
                    className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] transition border border-[#e5ad0c] flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <span>Browse Volunteer Drives &rarr;</span>
                  </Link>
                </div>

                {/* Volunteer Credential Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-left">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Volunteer Name</span>
                    <span className="font-heading font-bold text-slate-900 text-sm mt-0.5 block">
                      {volunteerData?.name || formData.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block truncate">
                      {volunteerData?.email || formData.email}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Affiliation</span>
                    <span className="font-heading font-bold text-slate-900 text-sm mt-0.5 block truncate">
                      {volunteerData?.college || formData.college}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {isAlumni ? volunteerData?.company || formData.company || "Alumni" : volunteerData?.year_of_study || formData.yearOfStudy}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Status & Contribution</span>
                    <span className="font-heading font-bold text-slate-900 text-sm mt-0.5 block truncate">
                      {isAlumni ? "Mock Interviews & Verification" : "Applicant Calling & Events"}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
                      ● Ready to contribute to Maatram
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

        </main>
      </div>

      {/* ======================================================== */}
      {/* POPUP: BASIC DETAILS RETRIEVED FROM PROFILE PAGE */}
      {/* ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                  <IdentificationIcon className="w-5 h-5 text-slate-700 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Register as Volunteer
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verified details retrieved from your profile page
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRegistration} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Form Body */}
              <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                {/* Profile Details (Pre-filled) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        disabled
                        value={isAlumni ? "Alumni Volunteer" : "Student Volunteer"}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                      College / Institution
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        {isAlumni ? "Graduation Batch" : "Year of Study"}
                      </label>
                      <input
                        type="text"
                        value={isAlumni ? formData.batch : formData.yearOfStudy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [isAlumni ? "batch" : "yearOfStudy"]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        {isAlumni ? "Current Company" : "Department"}
                      </label>
                      <input
                        type="text"
                        value={isAlumni ? formData.company : formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [isAlumni ? "company" : "department"]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                      Volunteering Skills / Interest Areas
                    </label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="e.g. Telephonic calling, event registration desk, math tutoring"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                  <SparklesIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    By registering, you will be eligible to <strong className="text-slate-900">Accept</strong> first-come volunteer events posted by the foundation and receive real-time email broadcasts.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-heading font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-xs border border-[#e5ad0c] flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 stroke-[2.2]" />
                      <span>Confirm & Register</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
