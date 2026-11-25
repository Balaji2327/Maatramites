"use client";

import React, { useState, useEffect } from "react";
import {
  StarIcon,
  CheckIcon,
  PaperClipIcon,
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

function calculateCgpa(records: SemesterRecord[]) {
  const graded = records.flatMap(r => r.subjects).filter(s => s.status === "Cleared" && s.gradePoint != null);
  const credits = graded.reduce((total, s) => total + s.credits, 0);
  return credits ? (graded.reduce((total,s) => total + Number(s.gradePoint) * s.credits, 0) / credits).toFixed(2) : "";
}

const createEmptyRoadmap = (): SemesterRecord[] => [
  { sem: 1, gpa: null, creditsEarned: 0, totalCredits: 0, status: "In Progress", standingArrears: 0, subjects: [] },
  { sem: 2, gpa: null, creditsEarned: 0, totalCredits: 0, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 3, gpa: null, creditsEarned: 0, totalCredits: 0, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 4, gpa: null, creditsEarned: 0, totalCredits: 0, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 5, gpa: null, creditsEarned: 0, totalCredits: 0, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 6, gpa: null, creditsEarned: 0, totalCredits: 0, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 7, gpa: null, creditsEarned: 0, totalCredits: 0, status: "Upcoming", standingArrears: 0, subjects: [] },
  { sem: 8, gpa: null, creditsEarned: 0, totalCredits: 0, status: "Upcoming", standingArrears: 0, subjects: [] },
];

export default function StudentAcademicScreen() {
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degreeName, setDegreeName] = useState("");
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
        studentApi.getScholarProfile().then(res => { if (res.success) { setCollegeName(res.data.values.collegeName); setDegreeName(res.data.values.degreeBranch); } });
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadedFileName = selectedFile?.name || "";

  // Form fields for modal
  const [modalTargetSemester, setModalTargetSemester] = useState(1);
  const [subCode, setSubCode] = useState("");
  const [subName, setSubName] = useState("");
  const [subCredits, setSubCredits] = useState("");
  const [internal1, setInternal1] = useState("");
  const [internal2, setInternal2] = useState("");
  const [modelExam, setModelExam] = useState("");
  const [gradePoint, setGradePoint] = useState("");
  const [attendance, setAttendance] = useState("");
  const [semesterExam, setSemesterExam] = useState("");
  const [subStatus, setSubStatus] = useState<"Cleared" | "Arrear" | "In Progress">("In Progress");

  // Overall Calculated Stats
  const currentRecord = semesterRecords.find((r) => r.sem === selectedSemester) || semesterRecords[0];

  // Calculate Cumulative CGPA from all cleared semesters
  const totalEarnedCredits = semesterRecords.reduce((total, r) => total + r.creditsEarned, 0);
  const overallCgpa = calculateCgpa(semesterRecords);

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
    setSelectedFile(null);
    setSubCode("");
    setSubName("");
    setSubCredits("");
    setInternal1("");
    setInternal2("");
    setModelExam("");
    setGradePoint("");
    setAttendance("");
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
    setSelectedFile(null);
    setSubCode(sub.code);
    setSubName(sub.name);
    setSubCredits(String(sub.credits));
    setInternal1(sub.internal1);
    setInternal2(sub.internal2);
    setModelExam(sub.modelExam);
    setGradePoint(sub.gradePoint?.toString() || "");
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
          cgpa: computedCgpa ?? calculateCgpa(updatedRecords),
        })
        : null;
      if (!res?.success) throw new Error(res?.message || "Could not save academic records.");
      return true;
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Could not save academic records.");
      return false;
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
          gradePoint: gradePoint === "" ? null : Number(gradePoint),
          status: subStatus,
        };
        updatedSubjects.push(newSub);
      } else if (editingSubject) {
        const existingIdx = updatedSubjects.findIndex((s) => s.id === editingSubject.id);
        const updatedSub: SubjectMark = {
          ...editingSubject,
          gradePoint: gradePoint === "" ? null : Number(gradePoint),
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
      const totalCredits = updatedSubjects.reduce((sum, s) => sum + s.credits, 0);

      // Compute semester GPA if cleared subjects exist
      const clearedSubs = updatedSubjects.filter((s) => s.status === "Cleared" && s.gradePoint !== null);
      let semGpa: number | null = null;
      if (clearedSubs.length > 0 && earnedCredits > 0) {
        const totalPoints = clearedSubs.reduce((sum, s) => sum + Number(s.gradePoint) * s.credits, 0);
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

    if (!await syncRecordsToDatabase(updated)) return;
    setSemesterRecords(updated);
    setSelectedSemester(targetSem);
    setShowMarkModal(false);

    // Save directly to the database

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

    if (!await syncRecordsToDatabase(updated)) return;
    setSemesterRecords(updated);

    setToastMessage(`Course ${code} removed from database.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const uploadMarksheet = async () => {
    if (!selectedFile || selectedFile.size > 5 * 1024 * 1024) { setToastMessage("Select a marksheet up to 5 MB."); return; }
    setIsUploading(true);
    try {
      const file = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      const result = await studentApi.uploadMarksheet(modalTargetSemester, selectedExamType, file);
      if (!result.success) throw new Error(result.message || "Upload failed.");
      setToastMessage("Marksheet saved. View it in your profile.");
      setShowMarkModal(false);
    } catch (error) { setToastMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setIsUploading(false); }
  };

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Student Sidebar */}
      <StudentSidebar activeTab="academic" sectionRole="student" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-7 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Academic Performance & Marksheet Portal
              </h1>

              {/* College & Degree Badge directly after the heading */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-brand/15 border border-brand/60 text-black font-heading font-bold text-xs">
                  <BuildingLibraryIcon className="w-4 h-4 text-black shrink-0 stroke-[2.2]" />
                  <span>{collegeName}</span>
                </div>
                {degreeName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-black/15 text-black font-primary font-semibold text-xs">
                    <AcademicCapIcon className="w-4 h-4 text-black/65 shrink-0 stroke-[2]" />
                    <span>{degreeName}</span>
                  </div>
                )}
              </div>

              <p className="font-primary text-xs sm:text-sm text-black mt-2">
                Track internal assessment scores, semester grades, cumulative CGPA, and standing arrear history.
              </p>
            </div>
          </div>

          {/* Toast Message */}
          {toastMessage && (
            <div className="p-3.5 bg-brand/15 border border-brand/60 rounded-lg text-xs text-black font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircleIcon className="w-4 h-4 text-black shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ================= 4 WATER-FILLED LIQUID BALLS KPI SECTION ================= */}
          <div className="bg-white border border-black/15 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-black/15 gap-2 mb-6">
              <div>
                <h2 className="font-heading font-bold text-lg text-black tracking-tight">
                  Academic Health & Performance Indicators
                </h2>
                <p className="text-xs text-black/65 mt-0.5">
                  Liquid level gauges reflecting your CGPA, semester completion, and arrear status.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 py-3">
              {/* 1. Cumulative CGPA Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner border border-brand/60">
                  {/* Single Unified Seamless Water Body */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-brand transition-all duration-1000 ease-out z-10"
                    style={{ height: `${Math.min(92, Math.max(14, (Number(overallCgpa) || 0) * 10))}%` }}
                  >
                    {/* Top Animated Waves - with overlapping top edge to completely prevent any separation line */}
                    <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                      {/* Back wave */}
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-back opacity-100"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                      </svg>
                      {/* Front wave identical color to body */}
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-front opacity-95"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Inner Center Text */}
                  <div className="relative z-20 flex flex-col items-center justify-center text-black pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-black leading-none">
                      {overallCgpa || "-"}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-black mt-0.5">
                      {totalEarnedCredits > 0 ? `${totalEarnedCredits} hrs` : "0 hrs"}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black mt-2.5">
                  CGPA / OVERALL
                </span>
              </div>

              {/* 2. Progress / Completion Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner border border-brand/60">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-brand transition-all duration-1000 ease-out z-10"
                    style={{ height: `${Math.min(92, Math.max(14, (selectedSemester / 8) * 100))}%` }}
                  >
                    <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-back opacity-100"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                      </svg>
                      <svg
                        className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-front opacity-95"
                        viewBox="0 0 1000 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative z-20 flex flex-col items-center justify-center text-black pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-black leading-none">
                      {((selectedSemester / 8) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-black mt-0.5">
                      Sem {selectedSemester} / 8
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black mt-2.5">
                  PROGRESS
                </span>
              </div>

              {/* 3. Standing Arrears Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner border border-brand/60">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-brand transition-all duration-1000 ease-out z-10"
                    style={{ height: standingArrearsCount === 0 ? "100%" : `${Math.max(15, 100 - standingArrearsCount * 25)}%` }}
                  >
                    {standingArrearsCount > 0 && (
                      <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-back opacity-100"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                        </svg>
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-front opacity-95"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="relative z-20 flex flex-col items-center justify-center text-black pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-black leading-none">
                      {standingArrearsCount === 0 ? "100%" : `${standingArrearsCount} Arr`}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-black mt-0.5">
                      {standingArrearsCount === 0 ? "0 standing" : `${standingArrearsCount} subjects`}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black mt-2.5">
                  STANDING ARREARS
                </span>
              </div>

              {/* 4. History of Arrears Liquid Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner border border-brand/60">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-brand transition-all duration-1000 ease-out z-10"
                    style={{ height: historyOfArrearsCount === 0 ? "100%" : `${Math.max(15, 100 - historyOfArrearsCount * 20)}%` }}
                  >
                    {historyOfArrearsCount > 0 && (
                      <div className="absolute -top-[18px] left-0 right-0 h-[20px] overflow-hidden pointer-events-none">
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-back opacity-100"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,58 C140,100 310,0 500,58 C690,100 860,0 1000,58 L1000,100 L0,100 Z" />
                        </svg>
                        <svg
                          className="absolute bottom-0 left-0 w-[200%] h-full text-brand fill-current animate-wave-front opacity-95"
                          viewBox="0 0 1000 100"
                          preserveAspectRatio="none"
                        >
                          <path d="M0,50 C180,0 320,100 500,50 C680,0 820,100 1000,50 L1000,100 L0,100 Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="relative z-20 flex flex-col items-center justify-center text-black pointer-events-none drop-shadow-xs">
                    <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-black leading-none">
                      {historyOfArrearsCount === 0 ? "0.0%" : `${historyOfArrearsCount}`}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-black mt-0.5">
                      {historyOfArrearsCount === 0 ? "0 arrear history" : `${historyOfArrearsCount} cleared`}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black mt-2.5">
                  HISTORY
                </span>
              </div>
            </div>
          </div>


          {/* ================= SEMESTER ROADMAP STRIP ================= */}
          <div className="bg-white border border-black/15 rounded-xl p-6 lg:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-black/15 gap-2">
              <div>
                <h3 className="font-heading font-bold text-sm text-black">
                  Semester Roadmap & Marksheets
                </h3>
                <p className="text-xs text-black/65 mt-0.5">
                  Select a semester to inspect internal marks, model exams, and semester results.
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-black/65 bg-black/5 px-3 py-1 rounded-lg border border-black/15">
                Viewing: Semester {selectedSemester}
              </span>
            </div>

            {/* Genuine Horizontal Liquid Wave Flow Tracker (Connecting Pipe + Water Filling Circle Nodes) */}
            <div className="relative py-4 overflow-x-auto">
              <div className="min-w-[760px] px-4">
                {/* Continuous Connecting Pipe Line */}
                <div className="relative flex items-center justify-between">
                  {/* Background pipe rail */}
                  <div className="absolute top-[28px] left-[32px] right-[32px] h-[6px] bg-black/5 rounded-full z-0 border border-black/15" />

                  {/* Filled Liquid Water Pipeline connecting cleared/active semesters */}
                  <div
                    className="absolute top-[28px] left-[32px] h-[6px] bg-brand rounded-full z-0 transition-all duration-700 ease-out"
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
                        className="group flex flex-col items-center text-center cursor-pointer relative z-10 transition-transform focus:outline-none"
                      >
                        {/* Circular Liquid Wave Water Sphere */}
                        <div
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${isSelected
                            ? "ring-4 ring-brand/40 shadow-sm scale-105 border-2 border-brand bg-white"
                            : "border-2 border-black/15 bg-white hover:border-brand/60"
                            }`}
                        >
                          {/* Inner Animated Water Body */}
                          {waterHeightPercent > 0 && (
                            <div
                              className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out z-10 ${isArrear
                                ? "bg-black"
                                : isCleared
                                  ? "bg-black"
                                  : "bg-brand"
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
                                className={`absolute -top-2 left-0 w-[200%] h-2.5 fill-current animate-wave-front ${isArrear ? "text-black/65" : isCleared ? "text-black/65" : "text-brand"
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
                                <span className="font-heading font-bold text-xs text-white leading-none">
                                  {s.gpa ? `${s.gpa}` : <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Verified" />}
                                </span>
                                <span className="text-[10px] font-bold text-white/90 mt-0.5">GPA</span>
                              </>
                            ) : isInProgress ? (
                              <>
                                <span className="font-heading font-bold text-xs text-black leading-none">
                                  {s.sem}
                                </span>
                                <span className="text-[10px] font-bold text-black mt-0.5">Live</span>
                              </>
                            ) : isArrear ? (
                              <span className="font-heading font-bold text-[11px] text-white">Arr</span>
                            ) : (
                              <span className="font-mono font-bold text-xs text-black/65">
                                {s.sem}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Node Label Below Circle */}
                        <div className="mt-2.5 flex flex-col items-center">
                          <span
                            className={`text-xs font-heading font-bold tracking-tight ${isSelected ? "text-black" : "text-black group-hover:text-black"
                              }`}
                          >
                            Sem {s.sem}
                          </span>

                          <span
                            className={`text-[10px] font-bold mt-0.5 ${isCleared
                              ? "text-black"
                              : isArrear
                                ? "text-black"
                                : isInProgress
                                  ? "text-black"
                                  : "text-black/65"
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
                  <h4 className="font-heading font-bold text-sm text-black">
                    Semester {selectedSemester} Subjects & Marks Details
                  </h4>
                  <span className="text-[11px] bg-black/5 text-black px-2 py-0.5 rounded-md font-bold">
                    {currentRecord.subjects.length} Courses
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => openAddSubjectModal(selectedSemester)}
                    className="inline-flex items-center gap-1 text-black hover:text-black font-bold hover:underline cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add New Subject</span>
                  </button>
                </div>
              </div>

              {currentRecord.subjects.length === 0 ? (
                <div className="p-12 text-center bg-black/5 border border-black/15 rounded-lg space-y-3">
                  <AcademicCapIcon className="w-10 h-10 text-black/65 mx-auto stroke-1" />
                  <p className="text-xs text-black font-bold">No course records added for Semester {selectedSemester} yet.</p>
                  <p className="text-[11px] text-black/65">
                    Click "Add Marks / Subject" above to input your internal test marks and semester marks.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddSubjectModal(selectedSemester)}
                    className="px-4 py-2 bg-brand hover:brightness-95 text-black text-xs font-bold rounded-md transition cursor-pointer"
                  >
                    Add Semester {selectedSemester} Subject
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-black/15 rounded-lg bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-black/5 text-black font-heading text-[10px] uppercase tracking-wider border-b border-black/15">
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
                    <tbody className="divide-y divide-black/15 font-medium">
                      {currentRecord.subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-brand/15 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-black">
                            {sub.code}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-black">
                            {sub.name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-black">
                            {sub.credits}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-black">
                            {sub.internal1}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-black">
                            {sub.internal2}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-black">
                            {sub.modelExam}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-black">
                            {sub.attendance}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-black">
                            <span className="bg-black/5 px-2 py-0.5 rounded-md border border-black/15">
                              {sub.semesterExam}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${sub.status === "Cleared"
                                ? "bg-brand/15 text-black border border-brand/60"
                                : sub.status === "Arrear"
                                  ? "bg-brand/15 text-black border border-brand/60"
                                  : "bg-brand/15 text-black border border-brand/60"
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
                                className="p-1.5 text-black/65 hover:text-black hover:bg-black/5 rounded-lg transition cursor-pointer"
                                title="Edit Marks"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(sub.id, sub.code)}
                                className="p-1.5 text-black/65 hover:text-black hover:bg-brand/15 rounded-lg transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-black/15 shadow-sm max-w-xl w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/15">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black bg-brand/15 px-2.5 py-1 rounded-md border border-brand/60">
                  Semester {modalTargetSemester} • {modalStep === "select_exam" ? "Step 1 of 2: Select Exam" : "Step 2 of 2: Enter Marks"}
                </span>
                <h3 className="font-heading font-bold text-base sm:text-lg text-black mt-1.5">
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
                className="p-1.5 text-black/65 hover:text-black rounded-md hover:bg-black/5 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: CHOOSE EXAM TYPE (CAT 1, CAT 2, CAT 3, SEMESTER EXAM) */}
            {modalStep === "select_exam" ? (
              <div className="space-y-4 text-xs">
                {/* Target Semester Quick Selector */}
                <div>
                  <label className="block text-black font-bold mb-1.5">
                    Target Semester
                  </label>
                  <select
                    value={modalTargetSemester}
                    onChange={(e) => setModalTargetSemester(Number(e.target.value))}
                    className="w-full p-2.5 bg-brand/15 border border-brand/60 rounded-md font-heading font-bold text-black focus:outline-none focus:border-brand"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => (
                      <option key={semNum} value={semNum}>
                        Semester {semNum} {semNum === selectedSemester ? "(Currently Viewing)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-black font-bold mb-2">
                    Select Examination Category <span className="text-black/65">*</span>
                  </label>
                  <p className="text-[11px] text-black/65 mb-3">
                    Choose which test you want to record for this semester. You can upload an official marksheet document or enter scores manually on the next screen.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* CAT 1 Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("CAT 1")}
                      className={`p-4 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "CAT 1"
                          ? "border-brand bg-brand/15 ring-2 ring-brand/40 "
                          : "border-black/15 bg-white hover:border-brand/60 hover:bg-black/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-sm text-black">
                          CAT 1
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/15 text-black">
                          Max 25 Marks
                        </span>
                      </div>
                      <p className="text-[11px] text-black/65 mt-1">
                        Continuous Assessment Test 1 (Internal Assessment 1).
                      </p>
                    </button>

                    {/* CAT 2 Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("CAT 2")}
                      className={`p-4 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "CAT 2"
                          ? "border-brand bg-brand/15 ring-2 ring-brand/40 "
                          : "border-black/15 bg-white hover:border-brand/60 hover:bg-black/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-sm text-black">
                          CAT 2
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/15 text-black">
                          Max 25 Marks
                        </span>
                      </div>
                      <p className="text-[11px] text-black/65 mt-1">
                        Continuous Assessment Test 2 (Internal Assessment 2).
                      </p>
                    </button>

                    {/* CAT 3 / Model Exam Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("CAT 3")}
                      className={`p-4 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "CAT 3"
                          ? "border-brand bg-brand/15 ring-2 ring-brand/40 "
                          : "border-black/15 bg-white hover:border-brand/60 hover:bg-black/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-sm text-black">
                          CAT 3 / Model Exam
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/15 text-black">
                          Max 50 Marks
                        </span>
                      </div>
                      <p className="text-[11px] text-black/65 mt-1">
                        Model Examination or third Internal Assessment before finals.
                      </p>
                    </button>

                    {/* Semester End Exam Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedExamType("Semester Exam")}
                      className={`p-4 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedExamType === "Semester Exam"
                          ? "border-brand bg-brand/15 ring-2 ring-brand/40 "
                          : "border-black/15 bg-white hover:border-brand/60 hover:bg-black/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-sm text-black">
                          Semester Exam
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/15 text-black">
                          Grades / End-Sem
                        </span>
                      </div>
                      <p className="text-[11px] text-black/65 mt-1">
                        Final University / College Semester Marksheet & Grade Points.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Footer Controls for Step 1 */}
                <div className="flex items-center justify-between pt-4 border-t border-black/15">
                  <button
                    type="button"
                    onClick={() => setShowMarkModal(false)}
                    className="px-4 py-2 rounded-md text-xs font-bold text-black hover:bg-black/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep("entry_method")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand"
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
                <div className="flex items-center p-1 bg-black/5 rounded-lg border border-black/15">
                  <button
                    type="button"
                    onClick={() => setEntryModeTab("manual")}
                    className={`flex-1 py-2 text-center rounded-md font-heading font-bold text-xs transition cursor-pointer ${
                      entryModeTab === "manual"
                        ? "bg-white text-black border border-black/15"
                        : "text-black hover:text-black"
                    }`}
                  >
                    Enter Manually
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryModeTab("upload")}
                    className={`flex-1 py-2 text-center rounded-md font-heading font-bold text-xs transition cursor-pointer ${
                      entryModeTab === "upload"
                        ? "bg-white text-black border border-black/15"
                        : "text-black hover:text-black"
                    }`}
                  >
                    Upload Marksheet (PDF / Image)
                  </button>
                </div>

                {/* TAB 1: UPLOAD MARKSHEET ONLY */}
                {entryModeTab === "upload" ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-brand/15 border border-brand/60 rounded-lg space-y-3.5">
                      <div className="flex items-center gap-2 text-black font-heading font-bold text-sm">
                        <DocumentArrowUpIcon className="w-5 h-5 text-black" />
                        <span>Upload Official {selectedExamType} Marksheet</span>
                      </div>
                      <p className="text-[11px] text-black/80 leading-relaxed">
                        Attach your scanned marksheet document or result screenshot for Semester {modalTargetSemester}. Supported formats: PDF, JPG, PNG (Max 5MB).
                      </p>

                      <label className="border-2 border-dashed border-brand/60 hover:border-brand bg-white rounded-lg p-7 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                        <DocumentArrowUpIcon className="w-10 h-10 text-black/65 transition-transform mb-2" />
                        <span className="font-heading font-bold text-sm text-black">
                          {uploadedFileName ? uploadedFileName : `Choose ${selectedExamType} Marksheet File`}
                        </span>
                        <span className="text-[11px] text-black/65 mt-1">
                          {uploadedFileName ? "File attached successfully" : "Click to browse or drag & drop PDF / image"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const name = e.target.files[0].name;
                              setSelectedFile(e.target.files[0]);
                              setToastMessage(`Marksheet "${name}" selected for ${selectedExamType}!`);
                              setTimeout(() => setToastMessage(""), 3500);
                            }
                          }}
                        />
                      </label>

                      {uploadedFileName && (
                        <div className="flex items-center justify-between text-xs bg-white p-3 rounded-md border border-brand/60">
                          <span className="font-mono text-[11px] text-black truncate max-w-[320px]">
                            <PaperClipIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> {uploadedFileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="text-black/65 hover:text-black font-bold text-[11px] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions for Upload Marksheet Alone */}
                    <div className="flex items-center justify-between pt-3 border-t border-black/15">
                      <button
                        type="button"
                        onClick={() => setModalStep("select_exam")}
                        className="px-4 py-2 rounded-md text-xs font-bold text-black hover:bg-black/5 transition cursor-pointer"
                      >
                        ← Back to Exam Selection
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMarkModal(false)}
                          className="px-3.5 py-2 rounded-md text-xs font-bold text-black/65 hover:bg-black/5 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isUploading || !selectedFile} onClick={uploadMarksheet}
                          className="px-5 py-2.5 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand"
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
                        <label className="block text-black font-bold mb-1">
                          Subject Code <span className="text-black/65">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subCode}
                          onChange={(e) => setSubCode(e.target.value)}
                          placeholder="e.g. CS3351"
                          className="w-full p-2.5 bg-black/5 border border-black/15 rounded-md font-mono uppercase text-black focus:outline-none focus:border-brand"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-black font-bold mb-1">
                          Course Name <span className="text-black/65">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subName}
                          onChange={(e) => setSubName(e.target.value)}
                          placeholder="e.g. Data Structures and Algorithms"
                          className="w-full p-2.5 bg-black/5 border border-black/15 rounded-md text-black focus:outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    <label className="block">Grade point (if awarded)<input type="number" min="0" max="10" step="0.01" value={gradePoint} onChange={e => setGradePoint(e.target.value)} className="ml-2 rounded border p-2" /></label>
                    {/* Credits & Attendance */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-black font-bold mb-1">Credits</label>
                        <select
                          required
                          value={subCredits}
                          onChange={(e) => setSubCredits(e.target.value)}
                          className="w-full p-2.5 bg-black/5 border border-black/15 rounded-md text-black focus:outline-none focus:border-brand"
                        >
                          <option value="">Choose credits</option>
                          <option value="1">1 Credit</option>
                          <option value="2">2 Credits (Lab / Practical)</option>
                          <option value="3">3 Credits (Theory)</option>
                          <option value="4">4 Credits (Core with Tutorial)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-black font-bold mb-1">Attendance Percentage</label>
                        <input
                          type="text"
                          value={attendance}
                          onChange={(e) => setAttendance(e.target.value)}
                          placeholder="e.g. 96%"
                          className="w-full p-2.5 bg-black/5 border border-black/15 rounded-md text-black focus:outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    {/* Highlighted active exam score field + full continuous assessments */}
                    <div className="p-3.5 bg-black/5 rounded-lg border border-black/15 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-[11px] text-black uppercase tracking-wider block">
                          Continuous Assessment Test (CAT) Marks
                        </span>
                        <span className="text-[10px] text-black font-bold bg-brand/15 px-2 py-0.5 rounded">
                          Active Exam: {selectedExamType}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className={selectedExamType === "CAT 1" ? "p-1.5 bg-brand/15 rounded-md border border-brand/60" : ""}>
                          <label className="block text-black text-[11px] font-bold mb-1">
                            CAT 1 (/25) {selectedExamType === "CAT 1" && <StarIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Selected" />}
                          </label>
                          <input
                            type="text"
                            value={internal1}
                            onChange={(e) => setInternal1(e.target.value)}
                            placeholder="e.g. 23/25"
                            className="w-full p-2 bg-white border border-black/15 rounded-lg text-black font-mono text-center focus:outline-none focus:border-brand"
                          />
                        </div>
                        <div className={selectedExamType === "CAT 2" ? "p-1.5 bg-brand/15 rounded-md border border-brand/60" : ""}>
                          <label className="block text-black text-[11px] font-bold mb-1">
                            CAT 2 (/25) {selectedExamType === "CAT 2" && <StarIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Selected" />}
                          </label>
                          <input
                            type="text"
                            value={internal2}
                            onChange={(e) => setInternal2(e.target.value)}
                            placeholder="e.g. 24/25"
                            className="w-full p-2 bg-white border border-black/15 rounded-lg text-black font-mono text-center focus:outline-none focus:border-brand"
                          />
                        </div>
                        <div className={selectedExamType === "CAT 3" ? "p-1.5 bg-brand/15 rounded-md border border-brand/60" : ""}>
                          <label className="block text-black text-[11px] font-bold mb-1">
                            Model / CAT 3 (/50) {selectedExamType === "CAT 3" && <StarIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Selected" />}
                          </label>
                          <input
                            type="text"
                            value={modelExam}
                            onChange={(e) => setModelExam(e.target.value)}
                            placeholder="e.g. 48/50"
                            className="w-full p-2 bg-white border border-black/15 rounded-lg text-black font-mono text-center focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Semester Exam Result & Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={selectedExamType === "Semester Exam" ? "p-1.5 bg-brand/15 rounded-md border border-brand/60" : ""}>
                        <label className="block text-black font-bold mb-1">
                          Semester Exam (Grade / Marks) {selectedExamType === "Semester Exam" && <StarIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Selected" />}
                        </label>
                        <input
                          type="text"
                          value={semesterExam}
                          onChange={(e) => setSemesterExam(e.target.value)}
                          placeholder="e.g. O (94) or A+ (88) or Awaiting"
                          className="w-full p-2.5 bg-white border border-black/15 rounded-md text-black focus:outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-black font-bold mb-1">Course Status</label>
                        <select
                          value={subStatus}
                          onChange={(e) => setSubStatus(e.target.value as any)}
                          className="w-full p-2.5 bg-black/5 border border-black/15 rounded-md text-black font-bold focus:outline-none focus:border-brand"
                        >
                          <option value="Cleared">Cleared (Passed)</option>
                          <option value="In Progress">In Progress (Ongoing)</option>
                          <option value="Arrear">Arrear (Need Reappearance)</option>
                        </select>
                      </div>
                    </div>

                    {/* Modal Step 2 Actions for Manual Form */}
                    <div className="flex items-center justify-between pt-3 border-t border-black/15">
                      <button
                        type="button"
                        onClick={() => setModalStep("select_exam")}
                        className="px-4 py-2 rounded-md text-xs font-bold text-black hover:bg-black/5 transition cursor-pointer"
                      >
                        ← Back to Exam Selection
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMarkModal(false)}
                          className="px-3.5 py-2 rounded-md text-xs font-bold text-black/65 hover:bg-black/5 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand"
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
