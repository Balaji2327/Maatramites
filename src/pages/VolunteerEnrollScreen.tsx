"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  EyeIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  SparklesIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  UserCircleIcon,
  GlobeAltIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  PrinterIcon,
  UserIcon,
  PencilSquareIcon,
  HomeModernIcon,
  PhotoIcon,
  CameraIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "@/components/StudentSidebar";
import { getStoredUser, studentApi } from "@/lib/api";

interface VolunteerScreenProps {
  role: "student" | "alumni";
}

export type PhysicalPhotoKey = "front_view_home" | "inside_home" | "furniture" | "with_student" | "backward";

export const PHYSICAL_PHOTO_SLOTS: { key: PhysicalPhotoKey; title: string; hint: string }[] = [
  { key: "front_view_home", title: "Front view of the home", hint: "Exterior street or entrance view" },
  { key: "inside_home", title: "Inside home", hint: "Main living or hall area" },
  { key: "furniture", title: "Furniture", hint: "Household assets & furniture" },
  { key: "with_student", title: "With student", hint: "Volunteer along with the student" },
  { key: "backward", title: "Backward", hint: "Backside, kitchen, or rear premises" },
];

export default function VolunteerEnrollScreen({ role }: VolunteerScreenProps) {
  const isAlumni = role === "alumni";
  const [isRegisteredVolunteer, setIsRegisteredVolunteer] = useState(false);
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedApplications, setAssignedApplications] = useState<any[]>([]);
  const [selectedAssignedApplication, setSelectedAssignedApplication] = useState<any | null>(null);

  // View state: "table" (Image 2 Applicants Details) vs "profile" (Image 1 Volunteer Card)
  const [activeViewMode, setActiveViewMode] = useState<"table" | "profile">("table");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Volunteer suggestion input inside full-page view
  const [volunteerSuggestionInput, setVolunteerSuggestionInput] = useState("");
  const [isEditingSuggestion, setIsEditingSuggestion] = useState(false);
  const [isSavingSuggestion, setIsSavingSuggestion] = useState(false);

  // Phase 2 Physical Verification states (5 pictures, student description, final suggestion)
  const [physicalPhotos, setPhysicalPhotos] = useState<{
    front_view_home: string;
    inside_home: string;
    furniture: string;
    with_student: string;
    backward: string;
  }>({
    front_view_home: "",
    inside_home: "",
    furniture: "",
    with_student: "",
    backward: "",
  });
  const [physicalStudentDescription, setPhysicalStudentDescription] = useState("");
  const [physicalFinalSuggestion, setPhysicalFinalSuggestion] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

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

  const loadAssignedApplications = async (userEmail: string, userName: string) => {
    try {
      const res = await studentApi.getAssignedApplicants();
      if (!res.success || !Array.isArray(res.data)) return;
      const cleanEmail = (userEmail || "").trim().toLowerCase();
      const cleanName = (userName || "").trim().toLowerCase();

      const matching = res.data.filter((app: any) => {
        const assignedTele = String(
          app.tele_volunteer_name ||
          app.volunteer_name ||
          app.volunteerName ||
          app.assigned_volunteer_name ||
          ""
        ).trim().toLowerCase();

        const assignedTeleEmail = String(
          app.tele_volunteer_email ||
          app.volunteer_email ||
          ""
        ).trim().toLowerCase();

        const assignedPhysical = String(
          app.physical_volunteer_name ||
          ""
        ).trim().toLowerCase();

        const assignedPhysicalEmail = String(
          app.physical_volunteer_email ||
          ""
        ).trim().toLowerCase();

        const matchesTele =
          (cleanEmail && (assignedTeleEmail === cleanEmail || assignedTele === cleanEmail || assignedTele.includes(cleanEmail))) ||
          (cleanName && (assignedTele === cleanName || assignedTele.includes(cleanName)));

        const matchesPhysical =
          (cleanEmail && (assignedPhysicalEmail === cleanEmail || assignedPhysical === cleanEmail || assignedPhysical.includes(cleanEmail))) ||
          (cleanName && (assignedPhysical === cleanName || assignedPhysical.includes(cleanName)));

        if (matchesPhysical) {
          app._matchedRole = "physical";
        } else if (matchesTele) {
          app._matchedRole = "tele";
        }

        return matchesTele || matchesPhysical;
      });
      setAssignedApplications(matching);
    } catch {
      setAssignedApplications([]);
    }
  };

  // Check volunteer status on load
  useEffect(() => {
    localStorage.removeItem("maatram_volunteer_student");
    localStorage.removeItem("maatram_volunteer_alumni");

    const storedUser = getStoredUser();
    const cleanEmail = (storedUser?.email || "").trim().toLowerCase();
    const storedName = storedUser?.name || storedUser?.full_name || "";

    if (storedUser) {
      setFormData({
        name: storedName,
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
          loadAssignedApplications(cleanEmail, res.data.name || storedName);
        } else {
          setIsRegisteredVolunteer(false);
          setVolunteerData(null);
          localStorage.removeItem(userVolKey);
        }
      })
      .catch(() => {
        loadAssignedApplications(cleanEmail, storedName);
      });

    loadAssignedApplications(cleanEmail, storedName);
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
      loadAssignedApplications(cleanEmail, reg.name);
      setTimeout(() => setToastMessage(""), 6000);
    } catch {
      setIsRegisteredVolunteer(true);
      setVolunteerData(payload);
      if (cleanEmail) {
        localStorage.setItem(`maatram_volunteer_${cleanEmail}`, JSON.stringify(payload));
      }
      setIsRegisterModalOpen(false);
      setToastMessage("You are successfully registered as a volunteer! Wait to contribute to Maatram as a volunteer.");
      loadAssignedApplications(cleanEmail, payload.name);
      setTimeout(() => setToastMessage(""), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.75));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (
    key: "front_view_home" | "inside_home" | "furniture" | "with_student" | "backward",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPhysicalPhotos((prev) => ({
        ...prev,
        [key]: compressed,
      }));
    } catch (err) {
      console.error("Failed to process photo upload:", err);
    }
  };

  const handleRemovePhoto = (
    key: "front_view_home" | "inside_home" | "furniture" | "with_student" | "backward"
  ) => {
    setPhysicalPhotos((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  // Submit Volunteer Suggestion (Tele or Physical) to backend & update local state
  const handleSaveSuggestion = async (appId: string, phase: "tele" | "physical" = "tele") => {
    const volName = volunteerData?.name || formData.name || "Volunteer";
    const volEmail = volunteerData?.email || formData.email || "";
    const volPhone = volunteerData?.phone || formData.phone || "";
    const volAffiliation =
      volunteerData?.college ||
      volunteerData?.company ||
      formData.college ||
      formData.company ||
      "Maatram Volunteer Network";
    const volRole = isAlumni ? "Alumni Volunteer" : "Student Volunteer";

    if (phase === "physical") {
      if (!physicalStudentDescription.trim()) {
        setToastMessage("Please enter the description about the student.");
        return;
      }
      if (!physicalFinalSuggestion.trim()) {
        setToastMessage("Please enter your final suggestion.");
        return;
      }

      setIsSavingSuggestion(true);
      try {
        const res = await studentApi.updateVolunteerSuggestion(
          appId,
          physicalFinalSuggestion.trim(),
          volName,
          {
            phase: "physical",
            volunteer_email: volEmail,
            volunteer_phone: volPhone,
            volunteer_role: volRole,
            volunteer_affiliation: volAffiliation,
            student_description: physicalStudentDescription.trim(),
            physical_student_description: physicalStudentDescription.trim(),
            photos: physicalPhotos,
            front_view_home: physicalPhotos.front_view_home,
            inside_home: physicalPhotos.inside_home,
            furniture: physicalPhotos.furniture,
            with_student: physicalPhotos.with_student,
            backward: physicalPhotos.backward,
          }
        );

        const updatedFields = {
          physical_volunteer_suggestion: physicalFinalSuggestion.trim(),
          physical_student_description: physicalStudentDescription.trim(),
          student_description: physicalStudentDescription.trim(),
          physical_verification_photos: physicalPhotos,
          front_view_home: physicalPhotos.front_view_home,
          inside_home: physicalPhotos.inside_home,
          furniture: physicalPhotos.furniture,
          with_student: physicalPhotos.with_student,
          backward: physicalPhotos.backward,
          physical_volunteer_name: volName,
          physical_volunteer_email: volEmail,
          physical_volunteer_phone: volPhone,
          physical_volunteer_role: volRole,
          physical_volunteer_affiliation: volAffiliation,
        };

        setToastMessage("Physical verification report successfully submitted to administration!");
        setIsEditingSuggestion(false);

        // Update local state
        setAssignedApplications((prev) =>
          prev.map((app) =>
            String(app.id) === String(appId) || String(app.application_number) === String(appId)
              ? { ...app, ...updatedFields }
              : app
          )
        );
        if (selectedAssignedApplication) {
          setSelectedAssignedApplication((prev: any) => ({
            ...prev,
            ...updatedFields,
          }));
        }
      } catch (err) {
        console.error("Failed to save physical verification report:", err);
        setToastMessage("Saved report locally.");
        setIsEditingSuggestion(false);
      } finally {
        setIsSavingSuggestion(false);
        setTimeout(() => setToastMessage(""), 5000);
      }
      return;
    }

    // Phase 1 Televerification
    if (!volunteerSuggestionInput.trim()) {
      setToastMessage("Please enter your verification suggestion or remarks.");
      return;
    }
    setIsSavingSuggestion(true);
    try {
      const res = await studentApi.updateVolunteerSuggestion(
        appId,
        volunteerSuggestionInput.trim(),
        volName,
        {
          phase,
          volunteer_email: volEmail,
          volunteer_phone: volPhone,
          volunteer_role: volRole,
          volunteer_affiliation: volAffiliation,
        }
      );
      if (res && res.success) {
        setToastMessage("Volunteer suggestion successfully submitted to foundation admin!");
        setIsEditingSuggestion(false);
        // Update local state
        setAssignedApplications((prev) =>
          prev.map((app) =>
            String(app.id) === String(appId) || String(app.application_number) === String(appId)
              ? {
                  ...app,
                  volunteer_suggestion: volunteerSuggestionInput.trim(),
                  tele_volunteer_suggestion: volunteerSuggestionInput.trim(),
                  volunteer_name: volName,
                  tele_volunteer_name: volName,
                  tele_volunteer_email: volEmail,
                  tele_volunteer_phone: volPhone,
                  tele_volunteer_role: volRole,
                  tele_volunteer_affiliation: volAffiliation,
                }
              : app
          )
        );
        if (selectedAssignedApplication) {
          setSelectedAssignedApplication((prev: any) => ({
            ...prev,
            volunteer_suggestion: volunteerSuggestionInput.trim(),
            tele_volunteer_suggestion: volunteerSuggestionInput.trim(),
            volunteer_name: volName,
            tele_volunteer_name: volName,
            tele_volunteer_email: volEmail,
            tele_volunteer_phone: volPhone,
            tele_volunteer_role: volRole,
            tele_volunteer_affiliation: volAffiliation,
          }));
        }
      } else {
        setToastMessage("Failed to submit suggestion: " + (res?.message || "Unknown error"));
      }
    } catch (err: any) {
      setToastMessage("Volunteer suggestion saved locally.");
      setIsEditingSuggestion(false);
    } finally {
      setIsSavingSuggestion(false);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  // Distinct districts from assigned applicants
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    assignedApplications.forEach((a) => {
      if (a.district && a.district.trim()) {
        set.add(a.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [assignedApplications]);

  // Filtered applications based on search & district
  const filteredApplications = useMemo(() => {
    let list = [...assignedApplications];
    if (selectedDistrict !== "All") {
      list = list.filter(
        (a) => (a.district || "").trim().toLowerCase() === selectedDistrict.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        return (
          (a.full_name || a.name || "").toLowerCase().includes(q) ||
          (a.application_number || "").toLowerCase().includes(q) ||
          (a.mobile_number || a.phone || "").toLowerCase().includes(q) ||
          (a.email || "").toLowerCase().includes(q) ||
          (a.district || "").toLowerCase().includes(q) ||
          (a.volunteer_suggestion || "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [assignedApplications, selectedDistrict, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (assignedApplications.length === 0) return;
    const headers = [
      "Application No",
      "Student Name",
      "Gender",
      "Mobile",
      "Email",
      "District",
      "12th Cutoff",
      "Course Preference",
      "Family Income",
      "Volunteer Suggestion",
      "Volunteer Name",
      "Siblings",
    ];
    const rows = filteredApplications.map((app) => [
      `"${app.application_number || ""}"`,
      `"${app.full_name || app.name || ""}"`,
      `"${app.gender || ""}"`,
      `"${app.mobile_number || app.phone || ""}"`,
      `"${app.email || ""}"`,
      `"${app.district || ""}"`,
      `"${app.twelfth_cutoff || ""}"`,
      `"${app.preferred_degree || ""}"`,
      `"${app.family_annual_income || app.annual_income || ""}"`,
      `"${(app.volunteer_suggestion || "").replace(/"/g, '""')}"`,
      `"${app.volunteer_name || ""}"`,
      `"${app.siblings_count ?? (Array.isArray(app.siblings) ? app.siblings.length : 0)}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Maatram_Assigned_Applicants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasAssignments = assignedApplications.length > 0;
  const showTableView = isRegisteredVolunteer && hasAssignments && activeViewMode === "table";

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOpenApplicantPage = (app: any) => {
    setSelectedAssignedApplication(app);
    const isPhysical =
      app._matchedRole === "physical" ||
      app.status === "physical_verification_in_progress" ||
      app.status === "telephonic_done" ||
      app.status === "televerification_done";

    const ext = typeof app.additional_remarks === "object" ? app.additional_remarks : {};
    const photos = app.physical_verification_photos || ext?.physical_verification_photos || {};

    setPhysicalPhotos({
      front_view_home: app.front_view_home || photos.front_view_home || ext?.front_view_home || "",
      inside_home: app.inside_home || photos.inside_home || ext?.inside_home || "",
      furniture: app.furniture || photos.furniture || ext?.furniture || "",
      with_student: app.with_student || photos.with_student || ext?.with_student || "",
      backward: app.backward || photos.backward || ext?.backward || "",
    });

    const studentDesc =
      app.physical_student_description || ext?.physical_student_description || app.student_description || "";
    setPhysicalStudentDescription(studentDesc);

    const physicalSuggestion =
      app.physical_volunteer_suggestion || ext?.physical_volunteer_suggestion || "";
    setPhysicalFinalSuggestion(physicalSuggestion);

    const initialInput = isPhysical
      ? physicalSuggestion
      : (app.tele_volunteer_suggestion || app.volunteer_suggestion || "");
    setVolunteerSuggestionInput(initialInput);

    if (isPhysical) {
      setIsEditingSuggestion(!Boolean(physicalSuggestion || studentDesc));
    } else {
      setIsEditingSuggestion(!Boolean(initialInput));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      <StudentSidebar activeTab="volunteer" sectionRole={role} />

      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 flex flex-col flex-1 space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 font-bold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage("")}
                className="text-amber-800 hover:text-amber-950 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE A: FULL PAGE APPLICATION DOCUMENT VIEW (MATCHING ADMIN SIDE UI EXACTLY) */}
          {/* ========================================================================= */}
          {selectedAssignedApplication ? (
            <div className="w-full space-y-6 animate-in fade-in duration-200">
              {/* Official Trust Application Sheet matching screenshot */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-7">
                {/* Trust Letterhead Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAssignedApplication(null)}
                      className="p-2 -ml-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
                      title="Back to Applicants List"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <Image
                      src="/assets/images/logo.png"
                      alt="Maatram Foundation"
                      width={160}
                      height={80}
                      priority
                      className="h-12 w-auto object-contain"
                    />
                    <div>
                      <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 uppercase tracking-wider">
                        Maatram Educational & Charitable Trust
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Higher Education 100% Free Sponsorship Program (Academic Year 2025 - 2026)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Zero Donation • Zero Tuition Fee • Free Higher Education
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                      title="Print official application form"
                    >
                      <PrinterIcon className="w-4 h-4 text-slate-500" />
                      <span>Print Form</span>
                    </button>
                  </div>
                </div>

                {/* Volunteer Verification Phase Banners */}
                {(() => {
                  const isPhysicalVerification =
                    selectedAssignedApplication._matchedRole === "physical" ||
                    selectedAssignedApplication.status === "physical_verification_in_progress" ||
                    selectedAssignedApplication.status === "telephonic_done" ||
                    selectedAssignedApplication.status === "televerification_done";

                  if (isPhysicalVerification) {
                    const hasPhysicalSuggestion = Boolean(
                      selectedAssignedApplication.physical_volunteer_suggestion &&
                      selectedAssignedApplication.physical_volunteer_suggestion.trim() !== ""
                    );

                    return (
                      <div className="space-y-4">
                        {/* 1. Televerification Completed Report Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-emerald-300 shadow-2xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                                <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                              </span>
                              <div>
                                <h4 className="font-heading font-black text-sm text-emerald-950 uppercase tracking-wider">
                                  Phase 1: Televerification Report (Completed)
                                </h4>
                                <p className="text-[11px] text-emerald-800">
                                  Telephonic screening was completed and approved by Maatram Foundation Administration.
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg shrink-0">
                              ✓ Televerification Cleared
                            </span>
                          </div>

                          {/* Televerification Volunteer Details & Suggestion */}
                          <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">
                                  Verified by Volunteer:{" "}
                                  <span className="text-emerald-900 font-extrabold">
                                    {selectedAssignedApplication.tele_volunteer_name || selectedAssignedApplication.volunteer_name || "Admin Review"}
                                  </span>
                                </span>
                                {selectedAssignedApplication.tele_volunteer_role && (
                                  <span className="text-slate-500 font-medium">
                                    • {selectedAssignedApplication.tele_volunteer_role}
                                  </span>
                                )}
                              </div>
                              {selectedAssignedApplication.tele_volunteer_affiliation && (
                                <span className="text-slate-500 font-medium">
                                  Affiliation: <strong className="text-slate-700">{selectedAssignedApplication.tele_volunteer_affiliation}</strong>
                                </span>
                              )}
                            </div>

                            <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-lg">
                              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block mb-1">
                                Televerification Suggestion / Recommendation:
                              </span>
                              <p className="text-xs font-bold text-slate-900 italic leading-relaxed">
                                &quot;{selectedAssignedApplication.tele_volunteer_suggestion || selectedAssignedApplication.volunteer_suggestion || "Student details verified via phone. Genuine family need; recommended for physical verification."}&quot;
                              </p>
                            </div>

                            {(selectedAssignedApplication.tele_volunteer_email || selectedAssignedApplication.tele_volunteer_phone) && (
                              <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1">
                                {selectedAssignedApplication.tele_volunteer_email && (
                                  <span>Email: <strong className="text-slate-700">{selectedAssignedApplication.tele_volunteer_email}</strong></span>
                                )}
                                {selectedAssignedApplication.tele_volunteer_phone && (
                                  <span>Phone: <strong className="text-slate-700">{selectedAssignedApplication.tele_volunteer_phone}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Phase 2: Physical Verification Active Task Card */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-white border-indigo-300 shadow-2xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-heading font-black text-sm text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                                  <HomeModernIcon className="w-4 h-4 text-indigo-600" />
                                  <span>Second Phase: Physical Verification (Active Task)</span>
                                </h4>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-950 text-xs font-bold rounded-lg">
                                  <UserIcon className="w-3.5 h-3.5 text-indigo-700" />
                                  Assigned to: {selectedAssignedApplication.physical_volunteer_name || volunteerData?.name || formData.name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                In-person field & home verification. Capture the 5 required home photos, enter description about the student, and submit your final recommendation.
                              </p>
                            </div>

                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-900 text-[11px] font-bold rounded-lg border border-indigo-300 shrink-0">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                              {hasPhysicalSuggestion ? "Report Submitted" : "In Progress"}
                            </span>
                          </div>

                          <div className="mt-3">
                            {isEditingSuggestion ? (
                              <div className="space-y-5 bg-white p-5 rounded-2xl border border-indigo-200">
                                {/* 1. Five Mandatory Home Visit Photos */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading font-black text-xs text-indigo-950 uppercase tracking-wider block">
                                      1. Five Mandatory Home Visit Photos
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      Front view, inside home, furniture, with student, backward
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    {PHYSICAL_PHOTO_SLOTS.map((slot, idx) => {
                                      const photoUrl = physicalPhotos[slot.key];
                                      return (
                                        <div
                                          key={slot.key}
                                          className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between"
                                        >
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="font-heading font-bold text-[11px] text-slate-800 line-clamp-1">
                                              {idx + 1}. {slot.title}
                                            </span>
                                            {photoUrl ? (
                                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                                                ✓ Added
                                              </span>
                                            ) : (
                                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                                                Required
                                              </span>
                                            )}
                                          </div>

                                          {photoUrl ? (
                                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-900">
                                              <img
                                                src={photoUrl}
                                                alt={slot.title}
                                                className="w-full h-full object-cover"
                                              />
                                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setPreviewImage({ url: photoUrl, title: slot.title })}
                                                  className="p-1.5 bg-white text-slate-900 rounded-lg shadow-xs hover:bg-slate-100 transition cursor-pointer"
                                                  title="View Full Size"
                                                >
                                                  <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <label
                                                  className="p-1.5 bg-white text-slate-900 rounded-lg shadow-xs hover:bg-slate-100 transition cursor-pointer"
                                                  title="Replace Photo"
                                                >
                                                  <ArrowUpTrayIcon className="w-4 h-4" />
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handlePhotoUpload(slot.key, e)}
                                                  />
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemovePhoto(slot.key)}
                                                  className="p-1.5 bg-rose-600 text-white rounded-lg shadow-xs hover:bg-rose-700 transition cursor-pointer"
                                                  title="Delete Photo"
                                                >
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition text-center aspect-[4/3]">
                                              <CameraIcon className="w-6 h-6 text-indigo-500 mb-1" />
                                              <span className="text-[11px] font-bold text-indigo-900">Upload Photo</span>
                                              <span className="text-[9px] text-slate-400 mt-0.5">Camera / File</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handlePhotoUpload(slot.key, e)}
                                              />
                                            </label>
                                          )}
                                          <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">{slot.hint}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 2. Description about the Student */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-heading font-black text-slate-900 uppercase tracking-wider">
                                    2. Description about the Student *
                                  </label>
                                  <p className="text-[11px] text-slate-500">
                                    Enter your observations regarding the student&apos;s family background, living conditions, ambition, and environment observed during your home visit.
                                  </p>
                                  <textarea
                                    value={physicalStudentDescription}
                                    onChange={(e) => setPhysicalStudentDescription(e.target.value)}
                                    placeholder="Enter description about the student (e.g. Visited the student's residence. The family lives in a single room home with basic amenities. Father works as a daily wage laborer and mother is a homemaker. Student is hardworking, determined to pursue engineering, and genuinely requires 100% free scholarship support)..."
                                    rows={4}
                                    className="w-full text-xs p-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                                  />
                                </div>

                                {/* 3. Final Suggestion */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-heading font-black text-slate-900 uppercase tracking-wider">
                                    3. Final Suggestion *
                                  </label>
                                  <p className="text-[11px] text-slate-500">
                                    Enter your final recommendation and suggestion for the selection committee.
                                  </p>
                                  <textarea
                                    value={physicalFinalSuggestion}
                                    onChange={(e) => setPhysicalFinalSuggestion(e.target.value)}
                                    placeholder="Enter final recommendation (e.g. Strongly recommended for Maatram 100% Free Higher Education Sponsorship. Verification fully satisfied)..."
                                    rows={3}
                                    className="w-full text-xs p-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                                  {hasPhysicalSuggestion && (
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingSuggestion(false)}
                                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isSavingSuggestion}
                                    onClick={() =>
                                      handleSaveSuggestion(
                                        selectedAssignedApplication.id || selectedAssignedApplication.application_number,
                                        "physical"
                                      )
                                    }
                                    className="px-6 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs hover:shadow-md active:scale-98"
                                  >
                                    {isSavingSuggestion ? "Submitting Report..." : "Submit Physical Verification Report"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white p-5 rounded-2xl border border-indigo-200 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block mb-0.5">
                                      Physical Verification Completed
                                    </span>
                                    <span className="font-heading font-black text-sm text-slate-900">
                                      Verified by: {selectedAssignedApplication.physical_volunteer_name || volunteerData?.name || formData.name}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingSuggestion(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition shadow-2xs"
                                  >
                                    <PencilSquareIcon className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Edit Findings & Photos</span>
                                  </button>
                                </div>

                                {/* 5 Pictures Showcase */}
                                <div>
                                  <span className="font-heading font-bold text-xs text-slate-800 block mb-2">
                                    Home Visit Inspection Photos (5 Pictures):
                                  </span>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {PHYSICAL_PHOTO_SLOTS.map((slot, idx) => {
                                      const photoUrl =
                                        selectedAssignedApplication[slot.key] ||
                                        selectedAssignedApplication.physical_verification_photos?.[slot.key] ||
                                        physicalPhotos[slot.key];

                                      return (
                                        <div
                                          key={slot.key}
                                          className="group bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col justify-between"
                                        >
                                          <span className="font-heading font-bold text-[10px] text-slate-700 block truncate mb-1.5">
                                            {idx + 1}. {slot.title}
                                          </span>
                                          {photoUrl ? (
                                            <div
                                              onClick={() => setPreviewImage({ url: photoUrl, title: slot.title })}
                                              className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer"
                                            >
                                              <img
                                                src={photoUrl}
                                                alt={slot.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                              />
                                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="px-2 py-1 bg-white/95 text-[10px] font-bold text-slate-900 rounded-md shadow">
                                                  View Photo
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
                                              <PhotoIcon className="w-5 h-5 mb-0.5 text-slate-300" />
                                              <span className="text-[10px] italic">Not uploaded</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Description about the student */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Description about the Student:
                                  </span>
                                  <p className="text-xs text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                                    {selectedAssignedApplication.physical_student_description ||
                                      selectedAssignedApplication.student_description ||
                                      physicalStudentDescription ||
                                      "No student description entered."}
                                  </p>
                                </div>

                                {/* Final Suggestion */}
                                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                                    Final Suggestion & Recommendation:
                                  </span>
                                  <p className="text-xs font-bold text-indigo-950 italic leading-relaxed whitespace-pre-wrap">
                                    &quot;{selectedAssignedApplication.physical_volunteer_suggestion || physicalFinalSuggestion}&quot;
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Standard Phase 1 Volunteer Televerification Banner matching Admin Screenshot
                  return (
                    <div className="p-5 rounded-2xl border bg-gradient-to-r from-amber-50/70 to-orange-50/60 border-amber-300 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                                First Phase: Volunteer Televerification
                              </h4>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg">
                                <UserIcon className="w-3.5 h-3.5 text-amber-700" />
                                Assigned Volunteer: {selectedAssignedApplication.volunteer_name || volunteerData?.name || formData.name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Telephonic verification in progress by assigned volunteer.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            {selectedAssignedApplication.volunteer_suggestion
                              ? "Volunteer Feedback Submitted"
                              : "Waiting for Volunteer Suggestion"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        {isEditingSuggestion ? (
                          <div className="space-y-3 bg-white p-4 rounded-xl border border-amber-200">
                            <label className="block text-xs font-bold text-slate-700">
                              Enter Volunteer Feedback / Suggestion:
                            </label>
                            <textarea
                              value={volunteerSuggestionInput}
                              onChange={(e) => setVolunteerSuggestionInput(e.target.value)}
                              placeholder="Enter volunteer suggestion (e.g., student verified via phone call, genuine financial need, mother is daily wage worker, strongly recommended for support)..."
                              rows={3}
                              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F7BC0F] text-slate-900 font-medium"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingSuggestion(false);
                                  setVolunteerSuggestionInput(selectedAssignedApplication.volunteer_suggestion || "");
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSavingSuggestion}
                                onClick={() =>
                                  handleSaveSuggestion(
                                    selectedAssignedApplication.id || selectedAssignedApplication.application_number,
                                    "tele"
                                  )
                                }
                                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-lg transition cursor-pointer shadow-xs"
                              >
                                {isSavingSuggestion ? "Saving..." : "Save Suggestion"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                                Telephonic Verification Status:
                              </span>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                {selectedAssignedApplication.volunteer_suggestion ? (
                                  <span>
                                    Feedback:{" "}
                                    <strong className="text-slate-900 font-bold">
                                      &quot;{selectedAssignedApplication.volunteer_suggestion}&quot;
                                    </strong>
                                  </span>
                                ) : (
                                  <span>
                                    Waiting for volunteer suggestion. Assigned volunteer{" "}
                                    <strong className="text-slate-900 font-bold">
                                      {selectedAssignedApplication.volunteer_name || volunteerData?.name || formData.name}
                                    </strong>{" "}
                                    is conducting telephonic verification. Once the suggestion is submitted, the decision options to Move to Next Phase or Reject will appear here.
                                  </span>
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingSuggestion(true);
                                setVolunteerSuggestionInput(selectedAssignedApplication.volunteer_suggestion || "");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition"
                              title="Enter volunteer feedback"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {selectedAssignedApplication.volunteer_suggestion ? "Edit Suggestion" : "Record Suggestion"}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Horizontal Quick-Jump Navigation Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold text-slate-600 no-scrollbar sticky top-0 bg-white/95 backdrop-blur-xs z-10 pt-2">
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-personal")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    1. Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-family")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    2. Family
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-siblings")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    3. Siblings
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-address")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    4. Address
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-academic")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    5. Educational
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-financial")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    6. Financial
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-background")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    7. Background & Goals
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-documents")}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    8. Documents
                  </button>
                </div>

                {/* Single Scroll Sections Container matching Screenshot */}
                <div className="space-y-8 text-xs text-slate-800">
                  {/* SECTION 1: PERSONAL DETAILS */}
                  <section id="sec-personal" className="scroll-mt-6 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Personal Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Student Full Name</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.full_name || selectedAssignedApplication.name || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Date of Birth</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.dob || selectedAssignedApplication.date_of_birth || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Gender</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.gender || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Blood Group</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.blood_group || selectedAssignedApplication.bloodGroup || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Mobile Number</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.mobile_number || selectedAssignedApplication.phone || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">WhatsApp Number</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.whatsappNumber ||
                            selectedAssignedApplication.alt_mobile_number ||
                            selectedAssignedApplication.whatsapp_number ||
                            selectedAssignedApplication.whatsapp ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Email Address</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5 truncate">
                          {selectedAssignedApplication.email || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Aadhaar Number</span>
                        <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.aadhaar_number || selectedAssignedApplication.aadhaarNumber || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Community / Category</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.community || selectedAssignedApplication.caste || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Nationality</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.nationality || "Indian"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: FAMILY DETAILS */}
                  <section id="sec-family" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Family Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Father&apos;s Name</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.father_name || selectedAssignedApplication.fatherName || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Occupation: {selectedAssignedApplication.father_occupation || selectedAssignedApplication.fatherOccupation || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Monthly Income: {selectedAssignedApplication.father_income || selectedAssignedApplication.fatherMonthlyIncome || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Status: {selectedAssignedApplication.fatherEmploymentStatus || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Mother&apos;s Name</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.mother_name || selectedAssignedApplication.motherName || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Occupation: {selectedAssignedApplication.mother_occupation || selectedAssignedApplication.motherOccupation || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Monthly Income: {selectedAssignedApplication.mother_income || selectedAssignedApplication.motherMonthlyIncome || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Status: {selectedAssignedApplication.motherEmploymentStatus || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Total Family Income & Members</span>
                        <p className="font-bold text-sm text-emerald-800 mt-0.5">
                          {selectedAssignedApplication.family_annual_income ||
                            selectedAssignedApplication.annual_income ||
                            selectedAssignedApplication.annualFamilyIncome ||
                            "—"}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Family Members: {selectedAssignedApplication.familyMembersCount || selectedAssignedApplication.family_members_count || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Family Type: {selectedAssignedApplication.familyType || "Nuclear"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Situation:{" "}
                          {selectedAssignedApplication.familySituation ||
                            (selectedAssignedApplication.orphan
                              ? "Orphan"
                              : selectedAssignedApplication.single_parent
                                ? "Single Parent"
                                : "Both Parents")}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Guardian Details (If Applicable)</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.guardian_name || selectedAssignedApplication.guardianName || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Relation: {selectedAssignedApplication.guardianRelation || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Occupation: {selectedAssignedApplication.guardian_occupation || selectedAssignedApplication.guardianOccupation || "—"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Income: {selectedAssignedApplication.guardian_income || selectedAssignedApplication.guardianMonthlyIncome || "—"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 3: SIBLINGS DETAILS */}
                  <section id="sec-siblings" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Siblings Information
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs mb-3">
                      <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500">Number of Siblings: </span>
                        <strong className="text-slate-900">
                          {selectedAssignedApplication.siblingCount ??
                            selectedAssignedApplication.siblings_count ??
                            (Array.isArray(selectedAssignedApplication.siblings)
                              ? selectedAssignedApplication.siblings.length
                              : 0)}
                        </strong>
                      </div>
                      <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500">Siblings Currently Studying: </span>
                        <strong className="text-slate-900">
                          {selectedAssignedApplication.siblingsStudyingCount || "—"}
                        </strong>
                      </div>
                    </div>

                    {Array.isArray(selectedAssignedApplication.siblings) && selectedAssignedApplication.siblings.length > 0 ? (
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Relationship</th>
                            <th className="py-2.5 px-3">Age</th>
                            <th className="py-2.5 px-3">Education / Occupation</th>
                            <th className="py-2.5 px-3">School / Institution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {selectedAssignedApplication.siblings.map((s: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-900">{s.name || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.relationship || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.age || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.education || s.occupation || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.institution || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : typeof selectedAssignedApplication.siblings === "string" && selectedAssignedApplication.siblings.trim() ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap">
                        {selectedAssignedApplication.siblings}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                        No siblings recorded
                      </p>
                    )}
                  </section>

                  {/* SECTION 4: ADDRESS INFORMATION */}
                  <section id="sec-address" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Address & Residence Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Permanent Address</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.permanentAddress || selectedAssignedApplication.address || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Current Residential Address</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.currentAddress ||
                            selectedAssignedApplication.current_address ||
                            selectedAssignedApplication.address ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Village / Town</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.villageTown || selectedAssignedApplication.village_town || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">District & State</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.district || "—"},{" "}
                          {selectedAssignedApplication.state || "Tamil Nadu"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">PIN Code</span>
                        <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.pincode || selectedAssignedApplication.pin_code || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Residence Type</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.residenceType || selectedAssignedApplication.housing_status || "Own"}
                        </p>
                      </div>
                      {(selectedAssignedApplication.residenceType || selectedAssignedApplication.housing_status) === "Rented" && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Monthly Rent</span>
                          <p className="font-bold text-sm text-slate-900 mt-0.5">
                            {selectedAssignedApplication.rentAmount || selectedAssignedApplication.rent_amount || "—"}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SECTION 5: EDUCATIONAL INFORMATION */}
                  <section id="sec-academic" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Educational Information (10th, 12th & Preferences)
                      </h4>
                    </div>

                    {/* 12th Standard Section (Most critical) */}
                    <div className="p-5 bg-amber-50/60 border border-amber-300 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-black text-sm text-amber-950">
                          12th Higher Secondary Marks (HSC)
                        </span>
                        {(selectedAssignedApplication.twelfth_cutoff || selectedAssignedApplication.twelfthCutoff) && (
                          <span className="px-3 py-1 bg-[#F7BC0F] font-mono font-black text-sm text-slate-950 rounded-xl shadow-xs">
                            Cutoff: {selectedAssignedApplication.twelfth_cutoff || selectedAssignedApplication.twelfthCutoff} / 200
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-slate-500 block">School Name:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.twelfth_school_name || selectedAssignedApplication.twelfthSchool || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Board & Passing Year:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.twelfth_board || selectedAssignedApplication.twelfthBoard || "State Board"} (
                            {selectedAssignedApplication.twelfth_pass_year || selectedAssignedApplication.twelfthYear || "—"})
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Group / Stream:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.twelfth_group ||
                              selectedAssignedApplication.twelfthStream ||
                              selectedAssignedApplication.twelfth_stream ||
                              "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Total Marks & %:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.twelfth_total_marks || selectedAssignedApplication.twelfthTotalMarks || "—"} /{" "}
                            {selectedAssignedApplication.twelfth_max_marks || "600"} (
                            {selectedAssignedApplication.twelfth_percentage || selectedAssignedApplication.twelfthPercentage || "—"}%)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 10th Standard Section */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="font-heading font-bold text-sm text-slate-900">
                        10th Secondary School Marks (SSLC)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-slate-500 block">School Name:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.tenth_school_name || selectedAssignedApplication.tenthSchool || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Board & Passing Year:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.tenth_board || selectedAssignedApplication.tenthBoard || "State Board"} (
                            {selectedAssignedApplication.tenth_pass_year || selectedAssignedApplication.tenthYear || "—"})
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Total Marks:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.tenth_marks_obtained || selectedAssignedApplication.tenthTotalMarks || "—"} /{" "}
                            {selectedAssignedApplication.tenth_max_marks || "500"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Percentage:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.tenth_percentage || selectedAssignedApplication.tenthPercentage || "—"}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Course & Degree Preferences */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                      <span className="font-heading font-bold text-sm text-slate-900">Course & Degree Preferences</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-slate-500 block">Preferred Degree:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.preferred_degree || selectedAssignedApplication.preferredDegree || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Preferred Course (1st):</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.preferred_branch ||
                              (Array.isArray(selectedAssignedApplication.preferred_courses)
                                ? selectedAssignedApplication.preferred_courses[0]
                                : selectedAssignedApplication.preferred_courses) ||
                              "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Preferred Course (2nd):</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.secondBranch ||
                              (Array.isArray(selectedAssignedApplication.preferred_courses)
                                ? selectedAssignedApplication.preferred_courses[1]
                                : "") ||
                              "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Preferred College / Location:</span>
                          <p className="font-bold text-slate-900">
                            {selectedAssignedApplication.preferredCollegeLocation ||
                              (Array.isArray(selectedAssignedApplication.preferred_districts)
                                ? selectedAssignedApplication.preferred_districts.join(", ")
                                : "") ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 6: FINANCIAL INFORMATION */}
                  <section id="sec-financial" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Financial Information & Needs
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Annual Family Income</span>
                        <p className="font-bold text-sm text-emerald-800 mt-0.5">
                          {selectedAssignedApplication.annualIncome ||
                            selectedAssignedApplication.family_annual_income ||
                            selectedAssignedApplication.annualFamilyIncome ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Monthly Family Income</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.monthlyFamilyIncome || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Income Sources</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.incomeSources || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Family Debts</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.familyDebts || selectedAssignedApplication.family_debt || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Existing Education Loans</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.educationLoans || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Can Afford Without Support?</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">
                          {selectedAssignedApplication.affordabilityWithoutSupport || "No"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-3">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">
                          Financial Difficulties Faced by Family
                        </span>
                        <p className="text-slate-800 mt-1 leading-relaxed">
                          {selectedAssignedApplication.financialDifficulties || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-3">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">
                          Why the Student Needs Financial Support
                        </span>
                        <p className="text-slate-800 mt-1 leading-relaxed">
                          {selectedAssignedApplication.whyNeedSupport ||
                            selectedAssignedApplication.why_scholarship ||
                            selectedAssignedApplication.reason_for_applying ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 7: PERSONAL BACKGROUND & GOALS */}
                  <section id="sec-background" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Background, Career Ambition & Goals
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedAssignedApplication.orphan
                            ? "bg-rose-100 border-rose-300 text-rose-950"
                            : "bg-white border-slate-200 text-slate-500"
                          }`}
                      >
                        {selectedAssignedApplication.orphan ? "✓ Orphan Student" : "Not Orphan"}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedAssignedApplication.single_parent
                            ? "bg-purple-100 border-purple-300 text-purple-950"
                            : "bg-white border-slate-200 text-slate-500"
                          }`}
                      >
                        {selectedAssignedApplication.single_parent ? "✓ Single Parent Child" : "Both Parents"}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedAssignedApplication.first_graduate || selectedAssignedApplication.is_first_graduate
                            ? "bg-amber-100 border-amber-300 text-amber-950"
                            : "bg-white border-slate-200 text-slate-500"
                          }`}
                      >
                        {selectedAssignedApplication.first_graduate || selectedAssignedApplication.is_first_graduate
                          ? "✓ First-Generation Learner"
                          : "Non-First Graduate"}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-emerald-50 border-emerald-300 text-emerald-950">
                        {selectedAssignedApplication.willingToRelocateTN !== false
                          ? "✓ Willing to Relocate in Tamil Nadu"
                          : "Local Only"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Career Ambition</span>
                        <p className="font-medium text-slate-800 mt-1">
                          {selectedAssignedApplication.careerAmbition ||
                            selectedAssignedApplication.career_aspiration ||
                            selectedAssignedApplication.career_goals ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">
                          Why the Student Wants Higher Education
                        </span>
                        <p className="font-medium text-slate-800 mt-1">
                          {selectedAssignedApplication.higherEducationReason || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Future Goals</span>
                        <p className="font-medium text-slate-800 mt-1">
                          {selectedAssignedApplication.futureGoals || "—"}
                        </p>
                      </div>
                      {selectedAssignedApplication.specialCircumstances && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">
                            Special Family Circumstances
                          </span>
                          <p className="font-medium text-slate-800 mt-1">
                            {selectedAssignedApplication.specialCircumstances}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SECTION 8: DOCUMENTS CHECKLIST (THE EXACT 4 APPLICATION DOCUMENTS) */}
                  <section id="sec-documents" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Document Uploads & Checklist
                      </h4>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading font-bold text-sm text-slate-900">
                          Application Documents (4 Documents)
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Documents submitted during initial scholarship application
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        {[
                          {
                            label: "Student Photograph",
                            url: selectedAssignedApplication.studentPhoto || selectedAssignedApplication.student_photo,
                          },
                          {
                            label: "10th Marksheet",
                            url:
                              selectedAssignedApplication.document10thMarksheet ||
                              selectedAssignedApplication.document_10th_marksheet,
                          },
                          {
                            label: "12th Marksheet",
                            url:
                              selectedAssignedApplication.document12thMarksheet ||
                              selectedAssignedApplication.document_12th_marksheet,
                          },
                          {
                            label: "Aadhaar Document",
                            url:
                              selectedAssignedApplication.documentAadhaarCard ||
                              selectedAssignedApplication.document_aadhaar_card,
                          },
                        ].map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition"
                          >
                            <div>
                              <span className="font-heading font-bold text-slate-900 text-xs block">{doc.label}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Document #{idx + 1}</span>
                            </div>

                            {doc.url ? (
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <span className="font-bold text-emerald-600 text-xs flex items-center gap-1">
                                  <CheckBadgeIcon className="w-4 h-4 text-emerald-500" /> Uploaded
                                </span>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-heading font-bold text-xs transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>View &rarr;</span>
                                </a>
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-slate-100">
                                <span className="text-slate-400 text-xs italic">Not Provided</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          ) : showTableView ? (
            /* ========================================================================= */
            /* CASE B: APPLICANTS DETAILS TABLE VIEW (MATCHING IMAGE 2) */
            /* ========================================================================= */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Banner matching Image 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Applicants Details
                  </h1>
                  <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                    Review and manage student applications for the Maatram Foundation 2025-26 program.
                  </p>
                </div>
              </div>

              {/* Search & Filter Bar matching Image 2 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, application no, mobile, email, or district..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/20 transition"
                  />
                </div>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#F7BC0F] focus:bg-white transition cursor-pointer"
                >
                  <option value="All">All Districts</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Applicant Records Table matching Image 2 */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-black text-base text-slate-900">
                      Applicant Records
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing {filteredApplications.length} of {assignedApplications.length} students
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-heading font-bold text-slate-600 tracking-wider uppercase text-[10px]">
                        <th className="py-3 px-4">Application No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">12th Cutoff</th>
                        <th className="py-3 px-4">Course Preference</th>
                        <th className="py-3 px-4">Family Income</th>
                        <th className="py-3 px-4">Volunteer Suggestion</th>
                        <th className="py-3 px-4 text-center">Siblings</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map((app) => (
                        <tr
                          key={app.id || app.application_number}
                          className="hover:bg-amber-50/20 transition cursor-pointer"
                          onClick={() => handleOpenApplicantPage(app)}
                        >
                          {/* Application No */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <div>{app.application_number || "—"}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                              {app.created_at
                                ? new Date(app.created_at).toLocaleDateString("en-GB")
                                : "17/11/2026"}
                            </div>
                            {app.status === "physical_verification_in_progress" || app.status === "telephonic_done" || app._matchedRole === "physical" ? (
                              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold rounded-md">
                                <HomeModernIcon className="w-3 h-3 text-indigo-600" />
                                <span>Phase 2: Physical</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-md">
                                <PhoneIcon className="w-3 h-3 text-amber-600" />
                                <span>Phase 1: Tele</span>
                              </span>
                            )}
                          </td>

                          {/* Student Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">
                              {app.full_name || app.name || "Student Applicant"}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span>{app.gender || "Male"}</span>
                              <span>•</span>
                              <span className="text-amber-700 font-medium">
                                {app.is_first_graduate || app.first_graduate ? "First Graduate" : "Regular"}
                              </span>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="flex items-center gap-1.5 font-medium">
                              <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{app.mobile_number || app.phone || "—"}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]">{app.email || "—"}</span>
                            </div>
                          </td>

                          {/* District */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-bold text-slate-900">{app.district || "—"}</div>
                            <div className="text-[11px] text-slate-500">{app.pincode || app.pin_code || ""}</div>
                          </td>

                          {/* 12th Cutoff */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs inline-block">
                              {app.twelfth_cutoff || "—"}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {app.twelfth_stream || app.twelfth_group || "CS"}
                            </div>
                          </td>

                          {/* Course Preference */}
                          <td className="py-3.5 px-4 text-slate-800">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <AcademicCapIcon className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>{app.preferred_degree || "Engineering (B.E / B.Tech)"}</span>
                            </div>
                          </td>

                          {/* Family Income */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] inline-block">
                              {app.family_annual_income || app.annual_income || "12000"}
                            </span>
                          </td>

                          {/* Volunteer Suggestion */}
                          <td className="py-3.5 px-4 max-w-[220px]">
                            {app.physical_volunteer_suggestion ? (
                              <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-200 text-[11px] text-slate-800 leading-snug">
                                <span className="text-[9px] uppercase font-bold text-indigo-700 block mb-0.5">Phase 2 Physical</span>
                                <p className="line-clamp-2">{app.physical_volunteer_suggestion}</p>
                                {app.physical_volunteer_name && (
                                  <p className="text-[10px] text-indigo-800 font-bold mt-1">
                                    — {app.physical_volunteer_name}
                                  </p>
                                )}
                              </div>
                            ) : app.tele_volunteer_suggestion || app.volunteer_suggestion ? (
                              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-slate-800 leading-snug">
                                <span className="text-[9px] uppercase font-bold text-amber-700 block mb-0.5">Phase 1 Tele</span>
                                <p className="line-clamp-2">{app.tele_volunteer_suggestion || app.volunteer_suggestion}</p>
                                {(app.tele_volunteer_name || app.volunteer_name) && (
                                  <p className="text-[10px] text-amber-800 font-bold mt-1">
                                    — {app.tele_volunteer_name || app.volunteer_name}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                <span className="italic">No remarks</span>
                                <span className="text-[10px] text-amber-600 font-bold underline cursor-pointer">
                                  + Record
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Siblings */}
                          <td className="py-3.5 px-4 text-slate-700 font-mono text-center">
                            {app.siblings_count ?? (Array.isArray(app.siblings) ? app.siblings.length : 0)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenApplicantPage(app);
                              }}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-[#F7BC0F] text-slate-600 hover:text-slate-950 flex items-center justify-center transition cursor-pointer shadow-2xs mx-auto"
                              title="View Full Application Page"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* CASE C: VOLUNTEER REGISTRATION OR STATUS CARD (Image 1 style) */
            /* ========================================================================= */
            <div className="space-y-6">
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

                <div className="flex items-center gap-2">
                  {hasAssignments && (
                    <button
                      type="button"
                      onClick={() => setActiveViewMode("table")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] transition shadow-xs border border-[#e5ad0c] cursor-pointer"
                    >
                      <DocumentTextIcon className="w-4 h-4 stroke-[2.2]" />
                      <span>View Assigned Applicants ({assignedApplications.length})</span>
                    </button>
                  )}

                  <Link
                    href={isAlumni ? "/alumni/events" : "/student/events"}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-900 bg-white border border-slate-200 hover:border-[#F7BC0F] transition shadow-xs"
                  >
                    <CalendarDaysIcon className="w-4 h-4 text-[#F7BC0F]" />
                    <span>Browse Active Events</span>
                  </Link>
                </div>
              </div>

              {/* CENTER OF THE PAGE: REGISTER VOLUNTEER CARD */}
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="w-full max-w-3xl">
                  {!isRegisteredVolunteer ? (
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
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                            Volunteer Name
                          </span>
                          <span className="font-heading font-bold text-slate-900 text-sm mt-0.5 block">
                            {volunteerData?.name || formData.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block truncate">
                            {volunteerData?.email || formData.email}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                            Affiliation
                          </span>
                          <span className="font-heading font-bold text-slate-900 text-sm mt-0.5 block truncate">
                            {volunteerData?.college || formData.college}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            {isAlumni
                              ? volunteerData?.company || formData.company || "Alumni"
                              : volunteerData?.year_of_study || formData.yearOfStudy}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                            Status & Contribution
                          </span>
                          <span className="font-heading font-bold text-slate-900 text-sm mt-0.5 block truncate">
                            {isAlumni ? "Mock Interviews & Verification" : "Applicant Calling & Events"}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
                            ● Ready to contribute to Maatram
                          </span>
                        </div>
                      </div>

                      {/* Assigned Student Applications preview card */}
                      <div className="border-t border-slate-100 pt-5 text-left">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <h4 className="font-heading font-black text-sm text-slate-900">
                              Assigned Student Applications
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Applications assigned to you for verification review (Phase 1 Telephonic & Phase 2 Physical Verification).
                            </p>
                          </div>
                          {hasAssignments ? (
                            <button
                              type="button"
                              onClick={() => setActiveViewMode("table")}
                              className="rounded-full bg-amber-100 hover:bg-amber-200 px-3 py-1 text-[11px] font-bold text-amber-900 transition cursor-pointer"
                            >
                              {assignedApplications.length} Assigned &rarr; View Full Table
                            </button>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                              0 Assigned
                            </span>
                          )}
                        </div>

                        {assignedApplications.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                            No student applications assigned yet. Wait for foundation admin to allocate verification tasks.
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center">
                                {assignedApplications.length}
                              </div>
                              <div>
                                <p className="font-heading font-bold text-slate-900 text-sm">
                                  {assignedApplications.length} Applicant{assignedApplications.length > 1 ? "s" : ""} Assigned for Verification
                                </p>
                                <p className="text-xs text-slate-600">
                                  Access the full applicant details table below to review documents and submit your verification reports.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveViewMode("table")}
                              className="px-4 py-2 rounded-xl bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
                            >
                              Open Full Table View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* POPUP: REGISTER VOLUNTEER MODAL */}
      {/* ========================================================================= */}
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
              <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
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

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                  <SparklesIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    By registering, you will be eligible to receive telephonic verification tasks and first-come volunteer events posted by the foundation.
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

      {/* Lightbox Modal for Physical Verification Photo Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className="font-heading font-bold text-sm text-slate-800">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
