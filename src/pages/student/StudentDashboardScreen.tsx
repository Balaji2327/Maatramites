"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  XMarkIcon,
  CheckIcon,
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

  const studentName = user?.fullName || "Scholar";
  const rollNumber = user?.rollNumber || user?.applicationNumber || "";
  const collegeName = user?.collegeName || "";
  const degree = user?.degreeBranch || "";

  useEffect(() => {
    const stored = getStoredUser();
    studentApi.getScholarProfile().then(res => { if (res.success) setUser(res.data.values); });

    // Fetch applications for volunteer verification
    const fetchVerificationQueue = async () => {
      try {
        const res = await studentApi.getAssignedApplicants();
        if (res.success && Array.isArray(res.data)) {
          setAssignedApplicants(res.data.filter((a: any) => stored?.email && [a.tele_volunteer_email, a.physical_volunteer_email].some(email => email?.toLowerCase() === stored.email.toLowerCase())));
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
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Dedicated Student Sidebar */}
      <StudentSidebar activeTab="dashboard" sectionRole="student" studentName={studentName} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-7 flex-1">
          {/* Header & Welcome Banner */}
          <div className="border-b border-black/20 pb-6 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-brand/15 text-black font-heading font-bold text-xs rounded-md border border-brand/60">
                  Active Scholar
                </span>
                <span className="text-xs font-mono font-bold text-black/65">
                  {rollNumber}
                </span>
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                {studentName}
              </h1>
              <p className="text-xs sm:text-sm text-black font-medium">
                {[degree, collegeName].filter(Boolean).join(" / ")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
              <Link href="/student/settings" className="rounded-md bg-white border px-4 py-2 font-bold text-sm">Student Profile</Link>
              <Link
                href="/student/posts"
                className="px-3.5 py-2.5 bg-black/5 hover:bg-black/10 border border-black/15 rounded-md text-xs font-heading font-bold text-black transition cursor-pointer flex items-center gap-1.5"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-black" />
                <span>Community Posts</span>
              </Link>
              <Link
                href="/student/academic"
                className="px-3.5 py-2.5 bg-black/5 hover:bg-black/10 border border-black/15 rounded-md text-xs font-heading font-bold text-black transition cursor-pointer flex items-center gap-1.5"
              >
                <AcademicCapIcon className="w-4 h-4 text-black" />
                <span>Academic Record</span>
              </Link>
              <Link
                href="/student/events"
                className="px-3.5 py-2.5 bg-brand hover:brightness-95 text-black rounded-md text-xs font-heading font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <CalendarDaysIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Upcoming Events</span>
              </Link>
            </div>


          </div>

          {/* Key Metrics / Snapshot */}
          <div className="summary-strip grid grid-cols-2 lg:grid-cols-4">
            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Current Semester CGPA
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-2xl text-black">{user?.cgpa || "-"}</span>
                <span className="text-xs font-bold text-black/65">/ 10.0</span>
              </div>
            </div>

            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Overall Attendance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-2xl text-black">{user?.attendance || "-"}</span>
              </div>
              <p className="text-[11px] text-black/65 mt-1">Mandatory minimum: 75%</p>
            </div>

            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Volunteer Verifications
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-2xl text-black">{verifiedCount}</span>
                <span className="text-xs font-bold text-black/65">/ {assignedApplicants.length} completed</span>
              </div>
              <p className="text-[11px] text-black font-medium mt-1">
                {pendingCount} phone calls pending
              </p>
            </div>

            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Admission Status
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-lg text-black">Admitted</span>
              </div>
            </div>
          </div>

          {/* Success toast */}
          {saveSuccessMessage && (
            <div className="p-3 bg-brand/15 border border-brand/60 rounded-lg text-xs text-black font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircleIcon className="w-4 h-4 text-black" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Volunteer Verification Hub (Students as Volunteers) */}
          <section className="bg-white border border-black/15 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/15">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-lg text-black uppercase tracking-tight">
                    Volunteer Verification Queue
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-black/5 text-black border border-black/15 font-mono font-bold text-[10px]">
                    {assignedApplicants.length} Assigned
                  </span>
                </div>
                <p className="text-xs text-black/65 mt-1">
                  You are a student volunteer! Conduct telephonic verification for applicants, record feedback, and help Maatram select genuine candidates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black/65">
                  Completed: <strong className="text-black">{verifiedCount}</strong> | Pending: <strong className="text-black">{pendingCount}</strong>
                </span>
              </div>
            </div>

            {/* Verification Items List */}
            {assignedApplicants.length === 0 ? (
              <div className="py-12 text-center text-xs text-black/65">
                No applicants assigned for verification at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedApplicants.slice(0, 6).map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-lg border border-black/15 hover:border-brand transition-all bg-black/5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-black/65 uppercase">
                          {app.application_number || "MF-2025-APP"}
                        </span>
                        <h4 className="font-heading font-bold text-sm text-black">
                          {app.full_name || "Applicant"}
                        </h4>
                        <p className="text-[11px] text-black/65">
                          {app.district || "Tamil Nadu"} • Cutoff: <strong className="text-black">{app.twelfth_cutoff || app.twelfthCutoff || "—"}</strong>
                        </p>
                      </div>

                      {app.volunteer_suggestion ? (
                        <span className="px-2 py-0.5 bg-black/5 text-black border border-black/15 rounded-md text-[10px] font-bold shrink-0">
                          <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-brand/15 text-black border border-brand/60 rounded-md text-[10px] font-bold shrink-0">
                          Call Pending
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-black bg-white p-3 rounded-md border border-black/15 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-black/65">Father / Mother:</span>
                        <span className="font-medium text-black">{app.father_occupation || app.mother_occupation || "Daily Wage / Farmer"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/65">Annual Family Income:</span>
                        <span className="font-bold text-black">{app.family_annual_income || "₹48,000"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/65">Phone:</span>
                        <a
                          href={`tel:${app.mobile_number || ""}`}
                          className="font-bold text-black hover:text-black flex items-center gap-1"
                        >
                          <PhoneIcon className="w-3.5 h-3.5" />
                          <span>{app.mobile_number || "—"}</span>
                        </a>
                      </div>
                    </div>

                    {app.volunteer_suggestion ? (
                      <div className="p-2.5 bg-brand/15 rounded-md border border-brand/60 text-xs">
                        <span className="text-[10px] text-black/65 uppercase font-bold block">Your Recorded Feedback:</span>
                        <p className="text-black italic font-medium mt-0.5">"{app.volunteer_suggestion}"</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplicant(app);
                          setVolunteerNote(app.volunteer_suggestion || "");
                        }}
                        className="w-full py-2 bg-black hover:bg-black text-white rounded-md text-xs font-heading font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="bg-white border border-black/15 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/15">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-black stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-black">
                    Academic Progress
                  </h3>
                </div>
                <Link
                  href="/student/academic"
                  className="text-xs font-bold text-black hover:text-black flex items-center gap-1"
                >
                  <span>Full Gradesheet</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-black/5 rounded-md border border-black/15 flex items-center justify-between">
                  <span className="font-medium text-black">Semester 1 SGPA</span>
                  <strong className="font-bold text-black">8.92 (All Clear)</strong>
                </div>
                <div className="p-3 bg-black/5 rounded-md border border-black/15 flex items-center justify-between">
                  <span className="font-medium text-black">Semester 2 SGPA</span>
                  <strong className="font-bold text-black">8.78 (All Clear)</strong>
                </div>
                <div className="p-3 bg-brand/15 rounded-md border border-brand/60 flex items-center justify-between">
                  <span className="font-bold text-black">Semester 3 (Current)</span>
                  <strong className="font-bold text-black">In Progress</strong>
                </div>
              </div>
            </div>

            {/* Upcoming Foundation Events Card */}
            <div className="bg-white border border-black/15 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/15">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-black stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-black">
                    Upcoming Events
                  </h3>
                </div>
                <Link
                  href="/student/events"
                  className="text-xs font-bold text-black hover:text-black flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-black/5 rounded-md border border-black/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">Maatram Annual Scholars Meet 2026</span>
                    <span className="text-[10px] px-2 py-0.5 bg-brand/15 text-black rounded font-bold">Upcoming</span>
                  </div>
                  <p className="text-black/65 text-[11px]">Chennai Trade Centre • 15th Nov 2026</p>
                </div>

                <div className="p-3 bg-black/5 rounded-md border border-black/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">Full-Stack Career & Tech Workshop</span>
                    <span className="text-[10px] px-2 py-0.5 bg-black/10 text-black rounded font-bold">Virtual</span>
                  </div>
                  <p className="text-black/65 text-[11px]">Online Webinar with Zoho Engineers • 22nd Nov 2026</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Volunteer Remark Entry Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-xl border border-black/15 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-black">
                  Record Volunteer Feedback
                </h3>
                <p className="text-xs text-black/65">
                  Applicant: <span className="font-bold text-black">{selectedApplicant.full_name}</span> ({selectedApplicant.application_number})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="text-black/65 hover:text-black font-bold text-sm"
              >
                <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-black/5 p-3 rounded-md border border-black/15 space-y-1">
                <p><strong>Mobile:</strong> {selectedApplicant.mobile_number || "—"}</p>
                <p><strong>Family Income:</strong> {selectedApplicant.family_annual_income || "—"}</p>
                <p><strong>Parents Occupation:</strong> {selectedApplicant.father_occupation || selectedApplicant.mother_occupation || "—"}</p>
              </div>

              <div>
                <label className="block text-black font-bold mb-1">
                  Telephonic Verification Notes & Recommendation:
                </label>
                <textarea
                  value={volunteerNote}
                  onChange={(e) => setVolunteerNote(e.target.value)}
                  placeholder="Enter details from phone call: family genuine condition, need for financial support, parent background, recommended branch..."
                  rows={4}
                  className="w-full p-3 bg-white border border-black/15 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-black font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 border border-black/15 text-black text-xs font-bold rounded-md hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingNote || !volunteerNote.trim()}
                onClick={() => handleSaveVolunteerSuggestion(selectedApplicant.id)}
                className="px-5 py-2 bg-brand hover:brightness-95 disabled:opacity-50 text-black text-xs font-bold rounded-md"
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
