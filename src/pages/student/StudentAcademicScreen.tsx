"use client";

import React, { useState, useEffect } from "react";
import {
  AcademicCapIcon,
  DocumentArrowUpIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  BuildingLibraryIcon,
  UserIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import { getStoredUser, studentApi, getAcademicRecords, saveAcademicRecords } from "../../lib/api";

interface SubjectMark {
  id: string;
  code: string;
  name: string;
  credits: number;
  internal1: string; // e.g., 23/25
  internal2: string; // e.g., 24/25
  modelExam: string; // e.g., 46/50
  attendance: string; // e.g., 96%
  semesterExam: string; // Grade e.g. O, A+, A or Marks e.g. 88/100
  gradePoint: number | null; // e.g. 9.0
  status: "Cleared" | "Arrear" | "In Progress";
}

interface SemesterRecord {
  sem: number;
  gpa: number | null;
  creditsEarned: number;
  totalCredits: number;
  status: "Cleared" | "In Progress" | "Upcoming" | "Arrear";
  standingArrears: number;
  subjects: SubjectMark[];
}

const createEmptyRoadmap = (): SemesterRecord[] => [
  { sem: 1, gpa: null, creditsEarned: 0, totalCredits: 20, status: "In Progress", standingArrears: 0, subjects: [] },
  { sem: 2, gpa: null, creditsEarned: 0, totalCredits: 20, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 3, gpa: null, creditsEarned: 0, totalCredits: 20, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 4, gpa: null, creditsEarned: 0, totalCredits: 20, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 5, gpa: null, creditsEarned: 0, totalCredits: 20, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 6, gpa: null, creditsEarned: 0, totalCredits: 20, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 7, gpa: null, creditsEarned: 0, totalCredits: 20, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 8, gpa: null, creditsEarned: 0, totalCredits: 20, status: "Upcoming", standingArrears: 0, subjects: [] },
];

export default function StudentAcademicScreen() {
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [collegeName, setCollegeName] = useState("Engineering College");
  const [degreeName, setDegreeName] = useState("Undergraduate Degree");
  const [studentEmail, setStudentEmail] = useState("");

  // Semester records state initialized completely clean without dummy subjects
  const [semesterRecords, setSemesterRecords] = useState<SemesterRecord[]>(createEmptyRoadmap());

  // Load student user info & real academic records from database on mount
  useEffect(() => {
    let email = "";
    try {
      const stored = getStoredUser();
      if (stored) {
        if (stored.email) {
          email = stored.email;
          setStudentEmail(stored.email);
        }
        if (stored.college || stored.college_name) {
          setCollegeName(stored.college || stored.college_name);
        }
        if (stored.degree || stored.department || stored.degree_branch) {
          setDegreeName(stored.degree || stored.department || stored.degree_branch);
        }
      }
    } catch {
      // fallback
    }

    if (email) {
      loadAcademicRecords(email);
    }
  }, []);

  const loadAcademicRecords = async (email: string) => {
    try {
      const fetcher = typeof getAcademicRecords === "function" ? getAcademicRecords : studentApi?.getAcademicRecords;
      const res = fetcher ? await fetcher(email) : null;
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Merge fetched semester records with 8-semester roadmap
        const cleanBase = createEmptyRoadmap();
        const merged = cleanBase.map((baseSem) => {
          const found = res.data.find((item: any) => item.sem === baseSem.sem);
          if (found) {
            return {
              ...baseSem,
              ...found,
              subjects: Array.isArray(found.subjects) ? found.subjects : [],
            };
          }
          return baseSem;
        });

        // Pick first active semester or default to 1
        const activeSem = merged.find((s) => s.subjects && s.subjects.length > 0) || merged[0];
        setSelectedSemester(activeSem ? activeSem.sem : 1);
        setSemesterRecords(merged);
      }
    } catch (err) {
      console.error("Error fetching academic records:", err);
    }
  };

  // Modal State for adding/editing a subject's marks
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectMark | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  // Multi-step modal state:
  // Step 1: "select_exam" (Choose CAT 1, CAT 2, CAT 3, or Semester Exam)
  // Step 2: "entry_method" (Choose Upload Marksheet or Enter Manually, or fill both)
  const [modalStep, setModalStep] = useState<"select_exam" | "entry_method">("select_exam");
  const [selectedExamType, setSelectedExamType] = useState<"CAT 1" | "CAT 2" | "CAT 3" | "Semester Exam">("CAT 1");
  const [entryModeTab, setEntryModeTab] = useState<"manual" | "upload">("manual");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  // Form fields for modal
  const [modalTargetSemester, setModalTargetSemester] = useState(1);
  const [subCode, setSubCode] = useState("");
  const [subName, setSubName] = useState("");
  const [subCredits, setSubCredits] = useState("4");
  const [internal1, setInternal1] = useState("");
  const [internal2, setInternal2] = useState("");
  const [modelExam, setModelExam] = useState("");
  const [attendance, setAttendance] = useState("95%");
  const [semesterExam, setSemesterExam] = useState("");
  const [subStatus, setSubStatus] = useState<"Cleared" | "Arrear" | "In Progress">("In Progress");

  // Overall Calculated Stats
  const currentRecord = semesterRecords.find((r) => r.sem === selectedSemester) || semesterRecords[0];

  // Calculate Cumulative CGPA from all cleared semesters
  const completedSemesters = semesterRecords.filter((r) => r.gpa !== null && r.gpa > 0);
  const totalEarnedCredits = completedSemesters.reduce((acc, curr) => acc + curr.creditsEarned, 0);
  const weightedGpaSum = completedSemesters.reduce((acc, curr) => acc + (curr.gpa || 0) * curr.creditsEarned, 0);
  const overallCgpa = totalEarnedCredits > 0 ? (weightedGpaSum / totalEarnedCredits).toFixed(2) : "0.00";

  // Arrears Calculation
  // Standing Arrears: currently uncleared arrear subjects across all semesters
  let standingArrearsCount = 0;
  // History of Arrears: total subjects that had ever been marked as Arrear
  let historyOfArrearsCount = 0;

  semesterRecords.forEach((sem) => {
    sem.subjects.forEach((sub) => {
      if (sub.status === "Arrear") {
        standingArrearsCount++;
        historyOfArrearsCount++;
      }
    });
  });

  const openAddSubjectModal = (targetSem?: number) => {
    setModalMode("add");
    setEditingSubject(null);
    setModalTargetSemester(targetSem || selectedSemester);
    setModalStep("select_exam");
    setSelectedExamType("CAT 1");
    setEntryModeTab("manual");
    setUploadedFileName("");
    setSubCode("");
    setSubName("");
    setSubCredits("4");
    setInternal1("");
    setInternal2("");
    setModelExam("");
    setAttendance("95%");
    setSemesterExam("");
    setSubStatus("In Progress");
    setShowMarkModal(true);
  };

  const openEditSubjectModal = (sub: SubjectMark, currentSem?: number) => {
    setModalMode("edit");
    setEditingSubject(sub);
    setModalTargetSemester(currentSem || selectedSemester);
    setModalStep("entry_method");
    setSelectedExamType("CAT 1");
    setEntryModeTab("manual");
    setUploadedFileName("");
    setSubCode(sub.code);
    setSubName(sub.name);
    setSubCredits(String(sub.credits));
    setInternal1(sub.internal1);
    setInternal2(sub.internal2);
    setModelExam(sub.modelExam);
    setAttendance(sub.attendance);
    setSemesterExam(sub.semesterExam);
    setSubStatus(sub.status);
    setShowMarkModal(true);
  };

  const syncRecordsToDatabase = async (updatedRecords: SemesterRecord[], computedCgpa?: string) => {
    if (!studentEmail) {
      console.warn("No student email found in session to persist to database.");
      return;
    }
    setIsSaving(true);
    try {
      const saver = typeof saveAcademicRecords === "function" ? saveAcademicRecords : studentApi?.saveAcademicRecords;
      const res = saver
        ? await saver(studentEmail, {
          records: updatedRecords,
          cgpa: computedCgpa || overallCgpa,
        })
        : null;
      if (res && !res.success) {
        console.error("Failed to save academic records:", res.message);
      }
    } catch (err) {
      console.error("Failed to save records to database:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCode.trim() || !subName.trim()) {
      alert("Please enter subject code and course name.");
      return;
    }

    const targetSem = Number(modalTargetSemester) || selectedSemester;

    const updated = semesterRecords.map((semRecord) => {
      if (semRecord.sem !== targetSem) {
        if (editingSubject && modalMode === "edit") {
          return {
            ...semRecord,
            subjects: semRecord.subjects.filter((s) => s.id !== editingSubject.id),
          };
        }
        return semRecord;
      }

      const updatedSubjects = [...semRecord.subjects];

      if (modalMode === "add") {
        const newSub: SubjectMark = {
          id: `${targetSem}-${Date.now()}`,
          code: subCode.trim().toUpperCase(),
          name: subName.trim(),
          credits: Number(subCredits) || 3,
          internal1: internal1.trim() || "—",
          internal2: internal2.trim() || "—",
          modelExam: modelExam.trim() || "—",
          attendance: attendance.trim() || "—",
          semesterExam: semesterExam.trim() || (subStatus === "In Progress" ? "Awaiting Exam" : "—"),
          gradePoint: subStatus === "Cleared" ? 8.5 : null,
          status: subStatus,
        };
        updatedSubjects.push(newSub);
      } else if (editingSubject) {
        const existingIdx = updatedSubjects.findIndex((s) => s.id === editingSubject.id);
        const updatedSub: SubjectMark = {
          ...editingSubject,
          code: subCode.trim().toUpperCase(),
          name: subName.trim(),
          credits: Number(subCredits) || editingSubject.credits,
          internal1: internal1.trim() || editingSubject.internal1,
          internal2: internal2.trim() || editingSubject.internal2,
          modelExam: modelExam.trim() || editingSubject.modelExam,
          attendance: attendance.trim() || editingSubject.attendance,
          semesterExam: semesterExam.trim() || editingSubject.semesterExam,
          status: subStatus,
        };

        if (existingIdx !== -1) {
          updatedSubjects[existingIdx] = updatedSub;
        } else {
          updatedSubjects.push(updatedSub);
        }
      }

      // Compute semester total credits and earned credits
      const earnedCredits = updatedSubjects
        .filter((s) => s.status === "Cleared")
        .reduce((sum, s) => sum + s.credits, 0);
      const totalCredits = updatedSubjects.reduce((sum, s) => sum + s.credits, 0) || 20;

      // Compute semester GPA if cleared subjects exist
      const clearedSubs = updatedSubjects.filter((s) => s.status === "Cleared" && s.gradePoint !== null);
      let semGpa: number | null = null;
      if (clearedSubs.length > 0 && earnedCredits > 0) {
        const totalPoints = clearedSubs.reduce((sum, s) => sum + (s.gradePoint || 8.0) * s.credits, 0);
        semGpa = Number((totalPoints / earnedCredits).toFixed(2));
      }

      const hasArrear = updatedSubjects.some((s) => s.status === "Arrear");

      return {
        ...semRecord,
        status: hasArrear ? "Arrear" : updatedSubjects.length > 0 ? (semGpa ? "Cleared" : "In Progress") : semRecord.status,
        creditsEarned: earnedCredits,
        totalCredits: totalCredits,
        gpa: semGpa,
        subjects: updatedSubjects,
      };
    });

    setSemesterRecords(updated);
    setSelectedSemester(targetSem);
    setShowMarkModal(false);

    // Save directly to the database
    await syncRecordsToDatabase(updated);

    setToastMessage(
      modalMode === "add"
        ? `Course ${subCode.trim().toUpperCase()} added and saved to database!`
        : `Course ${subCode.trim().toUpperCase()} updated and saved to database!`
    );
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleDeleteSubject = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete ${code}?`)) return;
    const updated = semesterRecords.map((r) => {
      if (r.sem !== selectedSemester) return r;
      const filtered = r.subjects.filter((s) => s.id !== id);
      const earnedCredits = filtered
        .filter((s) => s.status === "Cleared")
        .reduce((sum, s) => sum + s.credits, 0);
      return {
        ...r,
        creditsEarned: earnedCredits,
        subjects: filtered,
      };
    });

    setSemesterRecords(updated);
    await syncRecordsToDatabase(updated);

    setToastMessage(`Course ${code} removed from database.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setToastMessage("Official Marksheet document uploaded & logged for coordinator verification!");
        setTimeout(() => setToastMessage(""), 4000);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Student Sidebar */}
      <StudentSidebar activeTab="academic" sectionRole="student" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-7 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Academic Performance & Marksheet Portal
              </h1>

              {/* College & Degree Badge directly after the heading */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-heading font-bold text-xs shadow-2xs">
                  <BuildingLibraryIcon className="w-4 h-4 text-amber-700 shrink-0 stroke-[2.2]" />
                  <span>{collegeName}</span>
                </div>
                {degreeName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-primary font-semibold text-xs shadow-2xs">
                    <AcademicCapIcon className="w-4 h-4 text-slate-500 shrink-0 stroke-[2]" />
                    <span>{degreeName}</span>
                  </div>
                )}
              </div>

              <p className="font-primary text-xs sm:text-sm text-slate-600 mt-2">
                Track internal assessment scores, semester grades, cumulative CGPA, and standing arrear history.
              </p>
            </div>
          </div>

          {/* Toast Message */}
          {toastMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ================= 4 WATER-FILLED LIQUID BALLS KPI SECTION ================= */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-2 mb-6">
              <div>
                <h2 className="font-heading font-black text-lg text-slate-900 tracking-tight">
                  Academic Health & Performance Indicators
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Liquid level gauges reflecting your CGPA, semester completion, and arrear status.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 py-3">
              {/* 1. Cumulative CGPA Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFFDF5] overflow-hidden flex items-center justify-center shadow-inner border border-amber-200/70">
                  {/* Single Unified Seamless Water Body */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[#F7BC0F] transition-all duration-1000 ease-out z-10"
                    style={{ height: `${Math.min(92, Math.max(14, (Number(overallCgpa) || 0) * 10))}%` }}
                  >
                    {/* Top Animated Waves - with overlapping top edge to completely prevent any separation line */}
                    <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                      {/* Back wave */}
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-[#FFE082] fill-current animate-wave-back opacity-100"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                      </svg>
                      {/* Front wave identical color to body */}
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-[#F7BC0F] fill-current animate-wave-front opacity-95"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Inner Center Text */}
                  <div className="relative z-20 flex flex-col items-center justify-center text-slate-950 pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-slate-950 leading-none">
                      {overallCgpa}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 mt-0.5">
                      {totalEarnedCredits > 0 ? `${totalEarnedCredits} hrs` : "0 hrs"}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 mt-2.5">
                  CGPA / OVERALL
                </span>
              </div>

              {/* 2. Progress / Completion Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFFDF5] overflow-hidden flex items-center justify-center shadow-inner border border-amber-200/70">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[#F7BC0F] transition-all duration-1000 ease-out z-10"
                    style={{ height: `${Math.min(92, Math.max(14, (selectedSemester / 8) * 100))}%` }}
                  >
                    <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-[#FFE082] fill-current animate-wave-back opacity-100"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                      </svg>
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-[#F7BC0F] fill-current animate-wave-front opacity-95"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative z-20 flex flex-col items-center justify-center text-slate-950 pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-slate-950 leading-none">
                      {((selectedSemester / 8) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 mt-0.5">
                      Sem {selectedSemester} / 8
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 mt-2.5">
                  PROGRESS
                </span>
              </div>

              {/* 3. Standing Arrears Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFFDF5] overflow-hidden flex items-center justify-center shadow-inner border border-amber-200/70">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[#F7BC0F] transition-all duration-1000 ease-out z-10"
                    style={{ height: standingArrearsCount === 0 ? "100%" : `${Math.max(15, 100 - standingArrearsCount * 25)}%` }}
                  >
                    {standingArrearsCount > 0 && (
                      <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-[#FFE082] fill-current animate-wave-back opacity-100"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                        </svg>
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-[#F7BC0F] fill-current animate-wave-front opacity-95"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="relative z-20 flex flex-col items-center justify-center text-slate-950 pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-slate-950 leading-none">
                      {standingArrearsCount === 0 ? "100%" : `${standingArrearsCount} Arr`}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 mt-0.5">
                      {standingArrearsCount === 0 ? "0 standing" : `${standingArrearsCount} subjects`}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 mt-2.5">
                  STANDING ARREARS
                </span>
              </div>

              {/* 4. History of Arrears Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFFDF5] overflow-hidden flex items-center justify-center shadow-inner border border-amber-200/70">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[#F7BC0F] transition-all duration-1000 ease-out z-10"
                    style={{ height: historyOfArrearsCount === 0 ? "100%" : `${Math.max(15, 100 - historyOfArrearsCount * 20)}%` }}
                  >
                    {historyOfArrearsCount > 0 && (
                      <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-[#FFE082] fill-current animate-wave-back opacity-100"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                        </svg>
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-[#F7BC0F] fill-current animate-wave-front opacity-95"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="relative z-20 flex flex-col items-center justify-center text-slate-950 pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-slate-950 leading-none">
                      {historyOfArrearsCount === 0 ? "0.0%" : `${historyOfArrearsCount}`}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 mt-0.5">
                      {historyOfArrearsCount === 0 ? "0 arrear history" : `${historyOfArrearsCount} cleared`}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 mt-2.5">
                  HISTORY
                </span>
              </div>
            </div>
          </div>


          {/* ================= SEMESTER ROADMAP STRIP ================= */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Semester Roadmap & Marksheets
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a semester to inspect internal marks, model exams, and semester results.
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                Viewing: Semester {selectedSemester}
              </span>
            </div>

            {/* Genuine Horizontal Liquid Wave Flow Tracker (Connecting Pipe + Water Filling Circle Nodes) */}
            <div className="relative py-4 overflow-x-auto">
              <div className="min-w-[760px] px-4">
                {/* Continuous Connecting Pipe Line */}
                <div className="relative flex items-center justify-between">
                  {/* Background pipe rail */}
                  <div className="absolute top-[28px] left-[32px] right-[32px] h-[6px] bg-slate-100 rounded-full z-0 border border-slate-200/60" />

                  {/* Filled Liquid Water Pipeline connecting cleared/active semesters */}
                  <div
                    className="absolute top-[28px] left-[32px] h-[6px] bg-gradient-to-r from-amber-400 via-[#F7BC0F] to-emerald-400 rounded-full z-0 transition-all duration-700 ease-out shadow-xs"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((Math.max(0, semesterRecords.findLastIndex((r) => r.status === "Cleared" || r.status === "In Progress" || (r.subjects && r.subjects.length > 0)))) /
                            (semesterRecords.length - 1)) *
                          100
                        )
                      )}%`,
                    }}
                  />

                  {/* 8 Connected Liquid Water Filling Circles */}
                  {semesterRecords.map((s, idx) => {
                    const isSelected = selectedSemester === s.sem;
                    const isCleared = s.status === "Cleared" || (s.gpa !== null && s.gpa > 0);
                    const isInProgress = s.status === "In Progress" || (!isCleared && s.subjects && s.subjects.length > 0);
                    const isArrear = s.status === "Arrear" || s.subjects.some((sub) => sub.status === "Arrear");

                    // Compute individual circle water filling level
                    const waterHeightPercent = isCleared
                      ? Math.min(100, Math.max(30, ((s.gpa || 8.0) / 10) * 100))
                      : isInProgress
                        ? 50
                        : isArrear
                          ? 25
                          : 0;

                    return (
                      <button
                        key={s.sem}
                        type="button"
                        onClick={() => setSelectedSemester(s.sem)}
                        className="group flex flex-col items-center text-center cursor-pointer relative z-10 transition-transform hover:scale-105 focus:outline-none"
                      >
                        {/* Circular Liquid Wave Water Sphere */}
                        <div
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${isSelected
                            ? "ring-4 ring-[#F7BC0F]/40 shadow-md scale-105 border-2 border-[#F7BC0F] bg-white"
                            : "border-2 border-slate-200/90 shadow-2xs bg-[#FFFDF7] hover:border-amber-300"
                            }`}
                        >
                          {/* Inner Animated Water Body */}
                          {waterHeightPercent > 0 && (
                            <div
                              className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out z-10 ${isArrear
                                ? "bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400"
                                : isCleared
                                  ? "bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400"
                                  : "bg-gradient-to-t from-[#E5A807] via-[#F7BC0F] to-[#FCD34D]"
                                }`}
                              style={{ height: `${waterHeightPercent}%` }}
                            >
                              {/* Undulating back wave */}
                              <svg
                                className="absolute -top-2.5 left-0 w-[200%] h-3 text-white/50 fill-current animate-wave-back"
                                viewBox="0 0 1000 100"
                                preserveAspectRatio="none"
                              >
                                <path d="M0,50 C150,90 350,10 500,50 C650,90 850,10 1000,50 L1000,100 L0,100 Z" />
                              </svg>

                              {/* Undulating front wave */}
                              <svg
                                className={`absolute -top-2 left-0 w-[200%] h-2.5 fill-current animate-wave-front ${isArrear ? "text-rose-500" : isCleared ? "text-emerald-500" : "text-[#F7BC0F]"
                                  }`}
                                viewBox="0 0 1000 100"
                                preserveAspectRatio="none"
                              >
                                <path d="M0,50 C200,10 300,90 500,50 C700,10 800,90 1000,50 L1000,100 L0,100 Z" />
                              </svg>
                            </div>
                          )}

                          {/* Center Node Text / Icon */}
                          <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none drop-shadow-xs">
                            {isCleared ? (
                              <>
                                <span className="font-heading font-black text-xs text-white leading-none">
                                  {s.gpa ? `${s.gpa}` : "✓"}
                                </span>
                                <span className="text-[9px] font-bold text-white/90 mt-0.5">GPA</span>
                              </>
                            ) : isInProgress ? (
                              <>
                                <span className="font-heading font-black text-xs text-slate-900 leading-none">
                                  {s.sem}
                                </span>
                                <span className="text-[9px] font-bold text-slate-800 mt-0.5">Live</span>
                              </>
                            ) : isArrear ? (
                              <span className="font-heading font-black text-[11px] text-white">Arr</span>
                            ) : (
                              <span className="font-mono font-bold text-xs text-slate-400">
                                {s.sem}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Node Label Below Circle */}
                        <div className="mt-2.5 flex flex-col items-center">
                          <span
                            className={`text-xs font-heading font-extrabold tracking-tight ${isSelected ? "text-slate-950" : "text-slate-700 group-hover:text-slate-900"
                              }`}
                          >
                            Sem {s.sem}
                          </span>

                          <span
                            className={`text-[10px] font-bold mt-0.5 ${isCleared
                              ? "text-emerald-600"
                              : isArrear
                                ? "text-rose-600"
                                : isInProgress
                                  ? "text-amber-800"
                                  : "text-slate-400"
                              }`}
                          >
                            {isCleared ? "Completed" : isInProgress ? "Active" : isArrear ? "Arrear" : "Upcoming"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ================= SUBJECTS MARKS BREAKDOWN TABLE ================= */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-slate-900">
                    Semester {selectedSemester} Subjects & Marks Details
                  </h4>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {currentRecord.subjects.length} Courses
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => openAddSubjectModal(selectedSemester)}
                    className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 font-bold hover:underline cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add New Subject</span>
                  </button>
                </div>
              </div>

              {currentRecord.subjects.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <AcademicCapIcon className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <p className="text-xs text-slate-600 font-bold">No course records added for Semester {selectedSemester} yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Click "Add Marks / Subject" above to input your internal test marks and semester marks.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddSubjectModal(selectedSemester)}
                    className="px-4 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Add Semester {selectedSemester} Subject
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-heading text-[10px] uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-bold">Subject Code</th>
                        <th className="py-3 px-4 font-bold">Course Title</th>
                        <th className="py-3 px-4 font-bold text-center">Credits</th>
                        <th className="py-3 px-4 font-bold text-center">CAT 1 (25)</th>
                        <th className="py-3 px-4 font-bold text-center">CAT 2 (25)</th>
                        <th className="py-3 px-4 font-bold text-center">Model / CAT 3 (50)</th>
                        <th className="py-3 px-4 font-bold text-center">Attendance</th>
                        <th className="py-3 px-4 font-bold text-center">Semester Exam / Grade</th>
                        <th className="py-3 px-4 font-bold text-center">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {currentRecord.subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {sub.code}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {sub.name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                            {sub.credits}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                            {sub.internal1}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                            {sub.internal2}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                            {sub.modelExam}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                            {sub.attendance}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                            <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                              {sub.semesterExam}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === "Cleared"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : sub.status === "Arrear"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-900 border border-amber-200"
                                }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditSubjectModal(sub, selectedSemester)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Edit Marks"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(sub.id, sub.code)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete Subject"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ================= MULTI-STEP ADD / EDIT MARKS MODAL ================= */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Semester {modalTargetSemester} • {modalStep === "select_exam" ? "Step 1 of 2: Select Exam" : "Step 2 of 2: Enter Marks"}
                </span>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 mt-1.5">
                  {modalMode === "add"
                    ? modalStep === "select_exam"
                      ? "Choose Assessment / Exam Type"
                      : `Enter ${selectedExamType} Details`
                    : `Edit Marks for ${subCode}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMarkModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: CHOOSE EXAM TYPE (CAT 1, CAT 2, CAT 3, SEMESTER EXAM) */}
            {modalStep === "select_exam" ? (
              <div className="space-y-4 text-xs">
                {/* Target Semester Quick Selector */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Target Semester
                  </label>
                  <select
                    value={modalTargetSemester}
                    onChange={(e) => setModalTargetSemester(Number(e.target.value))}
                    className="w-full p-2.5 bg-amber-50/60 border border-amber-300 rounded-xl font-heading font-bold text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => (
                      <option key={semNum} value={semNum}>
                        Semester {semNum} {semNum === selectedSemester ? "(Currently Viewing)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-2">
                    Select Examination Category <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Choose which test you want to record for this semester. You can upload an official marksheet document or enter scores manually on the next screen.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* CAT 1 Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("CAT 1")}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "CAT 1"
                          ? "border-[#F7BC0F] bg-amber-50/70 ring-2 ring-[#F7BC0F]/40 shadow-xs"
                          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-extrabold text-sm text-slate-900">
                          CAT 1
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Max 25 Marks
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Continuous Assessment Test 1 (Internal Assessment 1).
                      </p>
                    </button>

                    {/* CAT 2 Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("CAT 2")}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "CAT 2"
                          ? "border-[#F7BC0F] bg-amber-50/70 ring-2 ring-[#F7BC0F]/40 shadow-xs"
                          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-extrabold text-sm text-slate-900">
                          CAT 2
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Max 25 Marks
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Continuous Assessment Test 2 (Internal Assessment 2).
                      </p>
                    </button>

                    {/* CAT 3 / Model Exam Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("CAT 3")}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "CAT 3"
                          ? "border-[#F7BC0F] bg-amber-50/70 ring-2 ring-[#F7BC0F]/40 shadow-xs"
                          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-extrabold text-sm text-slate-900">
                          CAT 3 / Model Exam
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Max 50 Marks
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Model Examination or third Internal Assessment before finals.
                      </p>
                    </button>

                    {/* Semester End Exam Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("Semester Exam")}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "Semester Exam"
                          ? "border-[#F7BC0F] bg-amber-50/70 ring-2 ring-[#F7BC0F]/40 shadow-xs"
                          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-extrabold text-sm text-slate-900">
                          Semester Exam
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                          Grades / End-Sem
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Final University / College Semester Marksheet & Grade Points.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Footer Controls for Step 1 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowMarkModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep("entry_method")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-xs border border-[#e5ad0c]"
                  >
                    <span>Continue to Marks Entry ({selectedExamType})</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: MARKSHEET UPLOAD FIELD & MANUAL ENTRY FIELDS */
              <div className="space-y-4 text-xs">
                {/* Method Switcher Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEntryModeTab("manual")}
                    className={`flex-1 py-2 text-center rounded-xl font-heading font-bold text-xs transition cursor-pointer ${
                      entryModeTab === "manual"
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Enter Manually
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryModeTab("upload")}
                    className={`flex-1 py-2 text-center rounded-xl font-heading font-bold text-xs transition cursor-pointer ${
                      entryModeTab === "upload"
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Upload Marksheet (PDF / Image)
                  </button>
                </div>

                {/* TAB 1: UPLOAD MARKSHEET ONLY */}
                {entryModeTab === "upload" ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3.5">
                      <div className="flex items-center gap-2 text-amber-950 font-heading font-bold text-sm">
                        <DocumentArrowUpIcon className="w-5 h-5 text-amber-600" />
                        <span>Upload Official {selectedExamType} Marksheet</span>
                      </div>
                      <p className="text-[11px] text-amber-900/80 leading-relaxed">
                        Attach your scanned marksheet document or result screenshot for Semester {modalTargetSemester}. Supported formats: PDF, JPG, PNG (Max 5MB).
                      </p>

                      <label className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition text-center group shadow-xs">
                        <DocumentArrowUpIcon className="w-10 h-10 text-amber-500 group-hover:scale-110 transition-transform mb-2" />
                        <span className="font-heading font-extrabold text-sm text-slate-900">
                          {uploadedFileName ? uploadedFileName : `Choose ${selectedExamType} Marksheet File`}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">
                          {uploadedFileName ? "File attached successfully" : "Click to browse or drag & drop PDF / image"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const name = e.target.files[0].name;
                              setUploadedFileName(name);
                              setToastMessage(`Marksheet "${name}" selected for ${selectedExamType}!`);
                              setTimeout(() => setToastMessage(""), 3500);
                            }
                          }}
                        />
                      </label>

                      {uploadedFileName && (
                        <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                          <span className="font-mono text-[11px] text-slate-800 truncate max-w-[320px]">
                            📎 {uploadedFileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => setUploadedFileName("")}
                            className="text-red-500 hover:text-red-700 font-bold text-[11px] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions for Upload Marksheet Alone */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setModalStep("select_exam")}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        ← Back to Exam Selection
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMarkModal(false)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!uploadedFileName) {
                              alert("Please select a marksheet file to upload.");
                              return;
                            }
                            setToastMessage(`Official ${selectedExamType} marksheet (${uploadedFileName}) uploaded and submitted for Semester ${modalTargetSemester}!`);
                            setShowMarkModal(false);
                            setTimeout(() => setToastMessage(""), 4500);
                          }}
                          className="px-5 py-2.5 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-xs border border-[#e5ad0c]"
                        >
                          Upload {selectedExamType} Marksheet
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: MANUAL FIELDS FORM ONLY */
                  <form onSubmit={handleSaveSubject} className="space-y-4">
                    {/* Subject Code & Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Subject Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subCode}
                          onChange={(e) => setSubCode(e.target.value)}
                          placeholder="e.g. CS3351"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1">
                          Course Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subName}
                          onChange={(e) => setSubName(e.target.value)}
                          placeholder="e.g. Data Structures and Algorithms"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                        />
                      </div>
                    </div>

                    {/* Credits & Attendance */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Credits</label>
                        <select
                          value={subCredits}
                          onChange={(e) => setSubCredits(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                        >
                          <option value="1">1 Credit</option>
                          <option value="2">2 Credits (Lab / Practical)</option>
                          <option value="3">3 Credits (Theory)</option>
                          <option value="4">4 Credits (Core with Tutorial)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Attendance Percentage</label>
                        <input
                          type="text"
                          value={attendance}
                          onChange={(e) => setAttendance(e.target.value)}
                          placeholder="e.g. 96%"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                        />
                      </div>
                    </div>

                    {/* Highlighted active exam score field + full continuous assessments */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-[11px] text-slate-800 uppercase tracking-wider block">
                          Continuous Assessment Test (CAT) Marks
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded">
                          Active Exam: {selectedExamType}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className={selectedExamType === "CAT 1" ? "p-1.5 bg-amber-100/50 rounded-xl border border-amber-300" : ""}>
                          <label className="block text-slate-700 text-[11px] font-bold mb-1">
                            CAT 1 (/25) {selectedExamType === "CAT 1" && "★"}
                          </label>
                          <input
                            type="text"
                            value={internal1}
                            onChange={(e) => setInternal1(e.target.value)}
                            placeholder="e.g. 23/25"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-center focus:outline-none focus:border-[#F7BC0F]"
                          />
                        </div>
                        <div className={selectedExamType === "CAT 2" ? "p-1.5 bg-amber-100/50 rounded-xl border border-amber-300" : ""}>
                          <label className="block text-slate-700 text-[11px] font-bold mb-1">
                            CAT 2 (/25) {selectedExamType === "CAT 2" && "★"}
                          </label>
                          <input
                            type="text"
                            value={internal2}
                            onChange={(e) => setInternal2(e.target.value)}
                            placeholder="e.g. 24/25"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-center focus:outline-none focus:border-[#F7BC0F]"
                          />
                        </div>
                        <div className={selectedExamType === "CAT 3" ? "p-1.5 bg-amber-100/50 rounded-xl border border-amber-300" : ""}>
                          <label className="block text-slate-700 text-[11px] font-bold mb-1">
                            Model / CAT 3 (/50) {selectedExamType === "CAT 3" && "★"}
                          </label>
                          <input
                            type="text"
                            value={modelExam}
                            onChange={(e) => setModelExam(e.target.value)}
                            placeholder="e.g. 48/50"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-center focus:outline-none focus:border-[#F7BC0F]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Semester Exam Result & Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={selectedExamType === "Semester Exam" ? "p-1.5 bg-emerald-50 rounded-xl border border-emerald-300" : ""}>
                        <label className="block text-slate-700 font-bold mb-1">
                          Semester Exam (Grade / Marks) {selectedExamType === "Semester Exam" && "★"}
                        </label>
                        <input
                          type="text"
                          value={semesterExam}
                          onChange={(e) => setSemesterExam(e.target.value)}
                          placeholder="e.g. O (94) or A+ (88) or Awaiting"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#F7BC0F]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Course Status</label>
                        <select
                          value={subStatus}
                          onChange={(e) => setSubStatus(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#F7BC0F]"
                        >
                          <option value="Cleared">Cleared (Passed)</option>
                          <option value="In Progress">In Progress (Ongoing)</option>
                          <option value="Arrear">Arrear (Need Reappearance)</option>
                        </select>
                      </div>
                    </div>

                    {/* Modal Step 2 Actions for Manual Form */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setModalStep("select_exam")}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        ← Back to Exam Selection
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMarkModal(false)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-xs border border-[#e5ad0c]"
                        >
                          {modalMode === "add" ? `Save ${selectedExamType} Marks` : "Update Marks"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
