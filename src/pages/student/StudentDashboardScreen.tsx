"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import { studentApi, getStoredUser } from "../../lib/api";

export default function StudentDashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [assignedApplicants, setAssignedApplicants] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [volunteerNote, setVolunteerNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  const studentName = user?.name || user?.full_name || "Kavitha R";
  const rollNumber = user?.rollNumber || "MF-SCH-2024-042";
  const collegeName = user?.college || "Sri Venkateswara College of Engineering";
  const degree = user?.degree || "B.Tech Information Technology (2nd Year)";

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);

    // Fetch applications for volunteer verification
    const fetchVerificationQueue = async () => {
      try {
        const res = await studentApi.getAssignedApplicants();
        if (res.success && Array.isArray(res.data)) {
          setAssignedApplicants(res.data);
        }
      } catch (err) {
        console.error("Failed to load volunteer applications:", err);
      }
    };

    fetchVerificationQueue();
  }, []);

  const handleSaveVolunteerSuggestion = async (id: string) => {
    if (!volunteerNote.trim()) return;
    try {
      setIsSavingNote(true);
      const res = await studentApi.updateVolunteerSuggestion(id, volunteerNote, studentName);
      if (res.success) {
        setSaveSuccessMessage("Volunteer verification note saved successfully!");
        setAssignedApplicants((prev) =>
          prev.map((app) =>
            app.id === id
              ? { ...app, volunteer_suggestion: volunteerNote, volunteer_name: studentName }
              : app
          )
        );
        setSelectedApplicant(null);
        setVolunteerNote("");
        setTimeout(() => setSaveSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error("Error saving volunteer suggestion:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const verifiedCount = assignedApplicants.filter((a) => a.volunteer_suggestion).length;
  const pendingCount = assignedApplicants.length - verifiedCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Dedicated Student Sidebar */}
      <StudentSidebar activeTab="dashboard" sectionRole="student" studentName={studentName} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-7 flex-1">
          {/* Header & Welcome Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-950 font-heading font-black text-xs rounded-full border border-amber-300">
                  ★ Active Scholar & Volunteer
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {rollNumber}
                </span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Welcome back, {studentName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {degree} • {collegeName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
              <Link
                href="/student/posts"
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-heading font-bold text-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-600" />
                <span>Community Posts</span>
              </Link>
              <Link
                href="/student/academic"
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-heading font-bold text-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <AcademicCapIcon className="w-4 h-4 text-slate-600" />
                <span>Academic Record</span>
              </Link>
              <Link
                href="/student/events"
                className="px-3.5 py-2.5 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 rounded-xl text-xs font-heading font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CalendarDaysIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Upcoming Events</span>
              </Link>
            </div>

            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-10 translate-y-10">
              <Image src="/assets/images/logo.png" alt="Maatram" width={300} height={300} />
            </div>
          </div>

          {/* Key Metrics / Snapshot */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Current Semester CGPA
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-2xl text-slate-900">8.85</span>
                <span className="text-xs font-bold text-slate-500">/ 10.0</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">First Class with Distinction</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Overall Attendance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-2xl text-slate-900">96.4%</span>
                <span className="text-xs font-bold text-slate-500">Above criteria</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Mandatory minimum: 75%</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Volunteer Verifications
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-2xl text-slate-900">{verifiedCount}</span>
                <span className="text-xs font-bold text-slate-500">/ {assignedApplicants.length} completed</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                {pendingCount} phone calls pending
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Scholarship Status
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-lg text-slate-900">100% Sponsored</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Year 2 Fees Paid in Full</p>
            </div>
          </div>

          {/* Success toast */}
          {saveSuccessMessage && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircleIcon className="w-4 h-4 text-amber-600" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Volunteer Verification Hub (Students as Volunteers) */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-black text-lg text-slate-900 uppercase tracking-tight">
                    Volunteer Verification Queue
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold text-[10px]">
                    {assignedApplicants.length} Assigned
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  You are a student volunteer! Conduct telephonic verification for applicants, record feedback, and help Maatram select genuine candidates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  Completed: <strong className="text-slate-900">{verifiedCount}</strong> | Pending: <strong className="text-slate-900">{pendingCount}</strong>
                </span>
              </div>
            </div>

            {/* Verification Items List */}
            {assignedApplicants.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No applicants assigned for verification at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedApplicants.slice(0, 6).map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition-all bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                          {app.application_number || "MF-2025-APP"}
                        </span>
                        <h4 className="font-heading font-bold text-sm text-slate-900">
                          {app.full_name || "Applicant"}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {app.district || "Tamil Nadu"} • Cutoff: <strong className="text-slate-800">{app.twelfth_cutoff || app.twelfthCutoff || "—"}</strong>
                        </p>
                      </div>

                      {app.volunteer_suggestion ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-bold shrink-0">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold shrink-0">
                          Call Pending
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Father / Mother:</span>
                        <span className="font-medium text-slate-800">{app.father_occupation || app.mother_occupation || "Daily Wage / Farmer"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Annual Family Income:</span>
                        <span className="font-bold text-slate-900">{app.family_annual_income || "₹48,000"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <a
                          href={`tel:${app.mobile_number || ""}`}
                          className="font-bold text-slate-800 hover:text-amber-800 flex items-center gap-1"
                        >
                          <PhoneIcon className="w-3.5 h-3.5" />
                          <span>{app.mobile_number || "—"}</span>
                        </a>
                      </div>
                    </div>

                    {app.volunteer_suggestion ? (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Your Recorded Feedback:</span>
                        <p className="text-slate-800 italic font-medium mt-0.5">"{app.volunteer_suggestion}"</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplicant(app);
                          setVolunteerNote(app.volunteer_suggestion || "");
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Conduct Verification & Enter Remarks</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Links / Two Columns: Events & Academic Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Snapshot Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-amber-600 stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Academic Progress
                  </h3>
                </div>
                <Link
                  href="/student/academic"
                  className="text-xs font-bold text-slate-800 hover:text-amber-800 flex items-center gap-1"
                >
                  <span>Full Gradesheet</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Semester 1 SGPA</span>
                  <strong className="font-bold text-slate-900">8.92 (All Clear)</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Semester 2 SGPA</span>
                  <strong className="font-bold text-slate-900">8.78 (All Clear)</strong>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="font-bold text-amber-950">Semester 3 (Current)</span>
                  <strong className="font-bold text-amber-900">In Progress</strong>
                </div>
              </div>
            </div>

            {/* Upcoming Foundation Events Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-amber-600 stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Upcoming Events
                  </h3>
                </div>
                <Link
                  href="/student/events"
                  className="text-xs font-bold text-slate-800 hover:text-amber-800 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Maatram Annual Scholars Meet 2026</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">Upcoming</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Chennai Trade Centre • 15th Nov 2026</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Full-Stack Career & Tech Workshop</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">Virtual</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Online Webinar with Zoho Engineers • 22nd Nov 2026</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Volunteer Remark Entry Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Record Volunteer Feedback
                </h3>
                <p className="text-xs text-slate-500">
                  Applicant: <span className="font-bold text-slate-800">{selectedApplicant.full_name}</span> ({selectedApplicant.application_number})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Mobile:</strong> {selectedApplicant.mobile_number || "—"}</p>
                <p><strong>Family Income:</strong> {selectedApplicant.family_annual_income || "—"}</p>
                <p><strong>Parents Occupation:</strong> {selectedApplicant.father_occupation || selectedApplicant.mother_occupation || "—"}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Telephonic Verification Notes & Recommendation:
                </label>
                <textarea
                  value={volunteerNote}
                  onChange={(e) => setVolunteerNote(e.target.value)}
                  placeholder="Enter details from phone call: family genuine condition, need for scholarship, parent background, recommended branch..."
                  rows={4}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F7BC0F] text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingNote || !volunteerNote.trim()}
                onClick={() => handleSaveVolunteerSuggestion(selectedApplicant.id)}
                className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-xs"
              >
                {isSavingNote ? "Saving..." : "Save Volunteer Suggestion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
