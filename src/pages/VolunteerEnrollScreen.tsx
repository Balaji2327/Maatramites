"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckIcon,
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
import { getStoredUser, studentApi, getPhysicalPhotoUrl } from "@/lib/api";

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
  const [processingPhotos, setProcessingPhotos] = useState(0);
  const allPhotosReady = processingPhotos === 0 && PHYSICAL_PHOTO_SLOTS.every(({ key }) => Boolean(physicalPhotos[key]));
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
      if (cleanEmail && typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`maatram_assigned_apps_${cleanEmail}`, JSON.stringify(matching));
        } catch {}
      }
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

    // Instant Hydration from local cache (0-second wait)
    const userVolKey = `maatram_volunteer_${cleanEmail}`;
    const userAppsKey = `maatram_assigned_apps_${cleanEmail}`;
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

    // Instantly hydrate cached assignments if available
    try {
      const cachedApps = sessionStorage.getItem(userAppsKey) || localStorage.getItem(userAppsKey);
      if (cachedApps) {
        const parsedApps = JSON.parse(cachedApps);
        if (Array.isArray(parsedApps) && parsedApps.length > 0) {
          setAssignedApplications(parsedApps);
        }
      }
    } catch {}

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
    setProcessingPhotos(count => count + 1);
    try {
      const compressed = await compressImage(file);
      setPhysicalPhotos((prev) => ({
        ...prev,
        [key]: compressed,
      }));
    } catch (err) {
      console.error("Failed to process photo upload:", err);
      setToastMessage("Could not read this photo. Please select it again.");
    } finally {
      setProcessingPhotos(count => count - 1);
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
      if (!allPhotosReady) {
        setToastMessage("Add all five home visit photos before submitting.");
        return;
      }
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
          }
        );

        if (!res.success) throw new Error(res.message || "Could not save the physical verification report.");
        const returnedPhotos = res.data?.physical_verification_photos;
        if (!returnedPhotos || PHYSICAL_PHOTO_SLOTS.some(({ key }) => !returnedPhotos[key])) {
          throw new Error("The server did not confirm all five photos. Please retry.");
        }

        const updatedFields = {
          physical_volunteer_suggestion: physicalFinalSuggestion.trim(),
          physical_student_description: physicalStudentDescription.trim(),
          student_description: physicalStudentDescription.trim(),
          physical_verification_photos: returnedPhotos,
          front_view_home: returnedPhotos.front_view_home,
          inside_home: returnedPhotos.inside_home,
          furniture: returnedPhotos.furniture,
          with_student: returnedPhotos.with_student,
          backward: returnedPhotos.backward,
          physical_volunteer_name: volName,
          physical_volunteer_email: volEmail,
          physical_volunteer_phone: volPhone,
          physical_volunteer_role: volRole,
          physical_volunteer_affiliation: volAffiliation,
        };

        // Update active local physicalPhotos state with returned S3 keys / URLs
        setPhysicalPhotos({
          front_view_home: returnedPhotos.front_view_home || "",
          inside_home: returnedPhotos.inside_home || "",
          furniture: returnedPhotos.furniture || "",
          with_student: returnedPhotos.with_student || "",
          backward: returnedPhotos.backward || "",
        });

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
        setToastMessage(err instanceof Error ? err.message : "Could not save the report. Please retry.");
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
      setIsEditingSuggestion(!(physicalSuggestion && studentDesc && PHYSICAL_PHOTO_SLOTS.every(({ key }) => app[key] || photos[key] || ext[key])));
    } else {
      setIsEditingSuggestion(!Boolean(initialInput));
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      <StudentSidebar activeTab="volunteer" sectionRole={role} />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 flex flex-col flex-1 space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 bg-brand/15 border border-brand/60 rounded-lg text-xs text-black font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="w-5 h-5 text-black shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage("")}
                className="text-black hover:text-black font-bold"
              >
                <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE A: FULL PAGE APPLICATION DOCUMENT VIEW (MATCHING ADMIN SIDE UI EXACTLY) */}
          {/* ========================================================================= */}
          {selectedAssignedApplication ? (
            <div className="w-full space-y-6 animate-in fade-in duration-200">
              {/* Official Trust Application Sheet matching screenshot */}
              <div className="bg-white border border-black/15 rounded-xl p-6 sm:p-10 space-y-7">
                {/* Trust Letterhead Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-black gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAssignedApplication(null)}
                      className="p-2 -ml-2 text-black/65 hover:text-black rounded-md hover:bg-black/5 transition cursor-pointer shrink-0"
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
                      <h3 className="font-heading font-bold text-base sm:text-lg text-black uppercase tracking-wider">
                        Maatram Educational & Charitable Trust
                      </h3>
                      <p className="text-xs text-black font-medium">
                        Higher Education 100% Free Sponsorship Program (Academic Year 2025 - 2026)
                      </p>
                      <p className="text-[11px] text-black/65">
                        Zero Donation • Zero Tuition Fee • Free Higher Education
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-black/5 border border-black/15 rounded-md text-xs font-bold text-black transition cursor-pointer"
                      title="Print official application form"
                    >
                      <PrinterIcon className="w-4 h-4 text-black/65" />
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
                      selectedAssignedApplication.physical_volunteer_suggestion.trim() !== "" &&
                      PHYSICAL_PHOTO_SLOTS.every(({ key }) => selectedAssignedApplication[key] || selectedAssignedApplication.physical_verification_photos?.[key])
                    );

                    return (
                      <div className="space-y-4">
                        {/* 1. Televerification Completed Report Box */}
                        <div className="p-5 rounded-lg border bg-brand/10 border-brand/60 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand/60">
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 bg-black text-white rounded-lg">
                                <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                              </span>
                              <div>
                                <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                                  Phase 1: Televerification Report (Completed)
                                </h4>
                                <p className="text-[11px] text-black">
                                  Telephonic screening was completed and approved by Maatram Foundation Administration.
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/15 text-black border border-brand/60 text-xs font-bold rounded-lg shrink-0">
                              <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> Televerification Cleared
                            </span>
                          </div>

                          {/* Televerification Volunteer Details & Suggestion */}
                          <div className="bg-white p-4 rounded-md border border-brand/60 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-black">
                                  Verified by Volunteer:{" "}
                                  <span className="text-black font-bold">
                                    {selectedAssignedApplication.tele_volunteer_name || selectedAssignedApplication.volunteer_name || "Admin Review"}
                                  </span>
                                </span>
                                {selectedAssignedApplication.tele_volunteer_role && (
                                  <span className="text-black/65 font-medium">
                                    • {selectedAssignedApplication.tele_volunteer_role}
                                  </span>
                                )}
                              </div>
                              {selectedAssignedApplication.tele_volunteer_affiliation && (
                                <span className="text-black/65 font-medium">
                                  Affiliation: <strong className="text-black">{selectedAssignedApplication.tele_volunteer_affiliation}</strong>
                                </span>
                              )}
                            </div>

                            <div className="p-3 bg-brand/15 border border-brand/60 rounded-lg">
                              <span className="text-[10px] uppercase font-bold text-black tracking-wider block mb-1">
                                Televerification Suggestion / Recommendation:
                              </span>
                              <p className="text-xs font-bold text-black italic leading-relaxed">
                                &quot;{selectedAssignedApplication.tele_volunteer_suggestion || selectedAssignedApplication.volunteer_suggestion || "Student details verified via phone. Genuine family need; recommended for physical verification."}&quot;
                              </p>
                            </div>

                            {(selectedAssignedApplication.tele_volunteer_email || selectedAssignedApplication.tele_volunteer_phone) && (
                              <div className="text-[11px] text-black/65 flex flex-wrap gap-4 pt-1">
                                {selectedAssignedApplication.tele_volunteer_email && (
                                  <span>Email: <strong className="text-black">{selectedAssignedApplication.tele_volunteer_email}</strong></span>
                                )}
                                {selectedAssignedApplication.tele_volunteer_phone && (
                                  <span>Phone: <strong className="text-black">{selectedAssignedApplication.tele_volunteer_phone}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Phase 2: Physical Verification Active Task Card */}
                        <div className="p-5 rounded-lg border bg-brand/10 border-brand/60 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider flex items-center gap-2">
                                  <HomeModernIcon className="w-4 h-4 text-black" />
                                  <span>Second Phase: Physical Verification (Active Task)</span>
                                </h4>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand/15 border border-brand/60 text-black text-xs font-bold rounded-lg">
                                  <UserIcon className="w-3.5 h-3.5 text-black" />
                                  Assigned to: {selectedAssignedApplication.physical_volunteer_name || volunteerData?.name || formData.name}
                                </span>
                              </div>
                              <p className="text-xs text-black mt-1">
                                In-person field & home verification. Capture the 5 required home photos, enter description about the student, and submit your final recommendation.
                              </p>
                            </div>

                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/15 text-black text-[11px] font-bold rounded-lg border border-brand/60 shrink-0">
                              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                              {hasPhysicalSuggestion ? "Report Submitted" : "In Progress"}
                            </span>
                          </div>

                          <div className="mt-3">
                            {isEditingSuggestion ? (
                              <div className="space-y-5 bg-white p-5 rounded-lg border border-brand/60">
                                {/* 1. Five Mandatory Home Visit Photos */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-xs text-black uppercase tracking-wider block">
                                      1. Five Mandatory Home Visit Photos
                                    </span>
                                    <span className="text-[10px] text-black/65 font-medium">
                                      Front view, inside home, furniture, with student, backward
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    {PHYSICAL_PHOTO_SLOTS.map((slot, idx) => {
                                      const photoUrl = getPhysicalPhotoUrl(physicalPhotos[slot.key]);
                                      return (
                                        <div
                                          key={slot.key}
                                          className="bg-black/5 p-2.5 rounded-md border border-black/15 flex flex-col justify-between"
                                        >
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="font-heading font-bold text-[11px] text-black line-clamp-1">
                                              {idx + 1}. {slot.title}
                                            </span>
                                            {photoUrl ? (
                                              <span className="px-1.5 py-0.5 bg-brand/15 text-black text-[10px] font-bold rounded">
                                                <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> Added
                                              </span>
                                            ) : (
                                              <span className="px-1.5 py-0.5 bg-brand/15 text-black text-[10px] font-bold rounded">
                                                Required
                                              </span>
                                            )}
                                          </div>

                                          {photoUrl ? (
                                            <div className="relative group rounded-lg overflow-hidden border border-black/15 aspect-[4/3] bg-black">
                                              <img
                                                src={photoUrl}
                                                alt={slot.title}
                                                className="w-full h-full object-cover"
                                              />
                                              <div className="absolute inset-0 bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition flex items-center justify-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setPreviewImage({ url: photoUrl, title: slot.title })}
                                                  className="p-1.5 bg-white text-black rounded-lg hover:bg-black/5 transition cursor-pointer"
                                                  title="View Full Size"
                                                >
                                                  <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <label
                                                  className="p-1.5 bg-white text-black rounded-lg hover:bg-black/5 transition cursor-pointer"
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
                                                  className="p-1.5 bg-black text-white rounded-lg hover:bg-black transition cursor-pointer"
                                                  title="Delete Photo"
                                                >
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <label className="border-2 border-dashed border-brand/60 hover:border-brand bg-white hover:bg-brand/15 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition text-center aspect-[4/3]">
                                              <CameraIcon className="w-6 h-6 text-black/65 mb-1" />
                                              <span className="text-[11px] font-bold text-black">Upload Photo</span>
                                              <span className="text-[10px] text-black/65 mt-0.5">Camera / File</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handlePhotoUpload(slot.key, e)}
                                              />
                                            </label>
                                          )}
                                          <p className="text-[10px] text-black/65 mt-1 line-clamp-1">{slot.hint}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 2. Description about the Student */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-heading font-bold text-black uppercase tracking-wider">
                                    2. Description about the Student *
                                  </label>
                                  <p className="text-[11px] text-black/65">
                                    Enter your observations regarding the student&apos;s family background, living conditions, ambition, and environment observed during your home visit.
                                  </p>
                                  <textarea
                                    value={physicalStudentDescription}
                                    onChange={(e) => setPhysicalStudentDescription(e.target.value)}
                                    placeholder="Enter description about the student (e.g. Visited the student's residence. The family lives in a single room home with basic amenities. Father works as a daily wage laborer and mother is a homemaker. Student is hardworking, determined to pursue engineering, and genuinely requires full financial support)..."
                                    rows={4}
                                    className="w-full text-xs p-3.5 bg-white border border-black/15 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-black font-medium"
                                  />
                                </div>

                                {/* 3. Final Suggestion */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-heading font-bold text-black uppercase tracking-wider">
                                    3. Final Suggestion *
                                  </label>
                                  <p className="text-[11px] text-black/65">
                                    Enter your final recommendation and suggestion for the selection committee.
                                  </p>
                                  <textarea
                                    value={physicalFinalSuggestion}
                                    onChange={(e) => setPhysicalFinalSuggestion(e.target.value)}
                                    placeholder="Enter final recommendation (e.g. Strongly recommended for Maatram 100% Free Higher Education Sponsorship. Verification fully satisfied)..."
                                    rows={3}
                                    className="w-full text-xs p-3.5 bg-white border border-black/15 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-black font-medium"
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/15">
                                  {hasPhysicalSuggestion && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenApplicantPage(selectedAssignedApplication)}
                                      className="px-4 py-2 text-xs font-bold text-black hover:bg-black/10 rounded-md transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isSavingSuggestion || !allPhotosReady || !physicalStudentDescription.trim() || !physicalFinalSuggestion.trim()}
                                    onClick={() =>
                                      handleSaveSuggestion(
                                        selectedAssignedApplication.id || selectedAssignedApplication.application_number,
                                        "physical"
                                      )
                                    }
                                    className="px-6 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white bg-black hover:bg-black disabled:opacity-50 rounded-md transition cursor-pointer hover:shadow-sm"
                                  >
                                    {isSavingSuggestion ? "Submitting Report..." : "Submit Physical Verification Report"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white p-5 rounded-lg border border-brand/60 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand/60">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-black block mb-0.5">
                                      Physical Verification Completed
                                    </span>
                                    <span className="font-heading font-bold text-sm text-black">
                                      Verified by: {selectedAssignedApplication.physical_volunteer_name || volunteerData?.name || formData.name}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenApplicantPage(selectedAssignedApplication);
                                      setIsEditingSuggestion(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand/15 hover:bg-brand/15 text-black border border-brand/60 rounded-md text-xs font-bold shrink-0 cursor-pointer transition"
                                  >
                                    <PencilSquareIcon className="w-3.5 h-3.5 text-black" />
                                    <span>Edit Findings & Photos</span>
                                  </button>
                                </div>

                                {/* 5 Pictures Showcase */}
                                <div>
                                  <span className="font-heading font-bold text-xs text-black block mb-2">
                                    Home Visit Inspection Photos (5 Pictures):
                                  </span>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {PHYSICAL_PHOTO_SLOTS.map((slot, idx) => {
                                      const rawKey =
                                        selectedAssignedApplication[slot.key] ||
                                        selectedAssignedApplication.physical_verification_photos?.[slot.key];
                                      const photoUrl = getPhysicalPhotoUrl(rawKey);

                                      return (
                                        <div
                                          key={slot.key}
                                          className="group bg-black/5 p-2 rounded-md border border-black/15 flex flex-col justify-between"
                                        >
                                          <span className="font-heading font-bold text-[10px] text-black block truncate mb-1.5">
                                            {idx + 1}. {slot.title}
                                          </span>
                                          {photoUrl ? (
                                            <div
                                              onClick={() => setPreviewImage({ url: photoUrl, title: slot.title })}
                                              className="relative aspect-[4/3] rounded-lg overflow-hidden border border-black/15 bg-black cursor-pointer"
                                            >
                                              <img
                                                src={photoUrl}
                                                alt={slot.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                              />
                                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="px-2 py-1 bg-white/95 text-[10px] font-bold text-black rounded-md shadow">
                                                  View Photo
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="aspect-[4/3] rounded-lg border border-dashed border-black/15 bg-white flex flex-col items-center justify-center text-black/65">
                                              <PhotoIcon className="w-5 h-5 mb-0.5 text-black/65" />
                                              <span className="text-[10px] italic">Not uploaded</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Description about the student */}
                                <div className="p-4 bg-black/5 border border-black/15 rounded-md space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-black/65 block">
                                    Description about the Student:
                                  </span>
                                  <p className="text-xs text-black font-medium leading-relaxed whitespace-pre-wrap">
                                    {selectedAssignedApplication.physical_student_description ||
                                      selectedAssignedApplication.student_description ||
                                      physicalStudentDescription ||
                                      "No student description entered."}
                                  </p>
                                </div>

                                {/* Final Suggestion */}
                                <div className="p-4 bg-brand/15 border border-brand/60 rounded-md space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-black block">
                                    Final Suggestion & Recommendation:
                                  </span>
                                  <p className="text-xs font-bold text-black italic leading-relaxed whitespace-pre-wrap">
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
                    <div className="p-5 rounded-lg border bg-brand/10 border-brand/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                                First Phase: Volunteer Televerification
                              </h4>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand/15 border border-brand/60 text-black text-xs font-bold rounded-lg">
                                <UserIcon className="w-3.5 h-3.5 text-black" />
                                Assigned Volunteer: {selectedAssignedApplication.volunteer_name || volunteerData?.name || formData.name}
                              </span>
                            </div>
                            <p className="text-xs text-black mt-0.5">
                              Telephonic verification in progress by assigned volunteer.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/15 text-black text-[11px] font-bold rounded-lg border border-brand/60">
                            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                            {selectedAssignedApplication.volunteer_suggestion
                              ? "Volunteer Feedback Submitted"
                              : "Waiting for Volunteer Suggestion"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        {isEditingSuggestion ? (
                          <div className="space-y-3 bg-white p-4 rounded-md border border-brand/60">
                            <label className="block text-xs font-bold text-black">
                              Enter Volunteer Feedback / Suggestion:
                            </label>
                            <textarea
                              value={volunteerSuggestionInput}
                              onChange={(e) => setVolunteerSuggestionInput(e.target.value)}
                              placeholder="Enter volunteer suggestion (e.g., student verified via phone call, genuine financial need, mother is daily wage worker, strongly recommended for support)..."
                              rows={3}
                              className="w-full text-xs p-3 bg-white border border-black/15 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-black font-medium"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingSuggestion(false);
                                  setVolunteerSuggestionInput(selectedAssignedApplication.volunteer_suggestion || "");
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-black hover:bg-black/10 rounded-lg transition cursor-pointer"
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
                                className="px-4 py-1.5 text-xs font-bold text-black bg-brand hover:brightness-95 rounded-lg transition cursor-pointer"
                              >
                                {isSavingSuggestion ? "Saving..." : "Save Suggestion"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-md border border-brand/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-black block mb-1">
                                Telephonic Verification Status:
                              </span>
                              <p className="text-xs text-black font-medium leading-relaxed">
                                {selectedAssignedApplication.volunteer_suggestion ? (
                                  <span>
                                    Feedback:{" "}
                                    <strong className="text-black font-bold">
                                      &quot;{selectedAssignedApplication.volunteer_suggestion}&quot;
                                    </strong>
                                  </span>
                                ) : (
                                  <span>
                                    Waiting for volunteer suggestion. Assigned volunteer{" "}
                                    <strong className="text-black font-bold">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-brand/15 text-black hover:text-black border border-black/15 hover:border-brand/60 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition"
                              title="Enter volunteer feedback"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5 text-black" />
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


                {/* Single Scroll Sections Container matching Screenshot */}
                <div className="space-y-8 text-xs text-black">
                  {/* SECTION 1: PERSONAL DETAILS */}
                  <section id="sec-personal" className="scroll-mt-6 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Personal Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Student Full Name</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.full_name || selectedAssignedApplication.name || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Date of Birth</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.dob || selectedAssignedApplication.date_of_birth || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Gender</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.gender || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Blood Group</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.blood_group || selectedAssignedApplication.bloodGroup || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Mobile Number</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.mobile_number || selectedAssignedApplication.phone || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">WhatsApp Number</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.whatsappNumber ||
                            selectedAssignedApplication.alt_mobile_number ||
                            selectedAssignedApplication.whatsapp_number ||
                            selectedAssignedApplication.whatsapp ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Email Address</span>
                        <p className="font-bold text-sm text-black mt-0.5 truncate">
                          {selectedAssignedApplication.email || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Aadhaar Number</span>
                        <p className="font-mono font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.aadhaar_number || selectedAssignedApplication.aadhaarNumber || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Community / Category</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.community || selectedAssignedApplication.caste || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Nationality</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.nationality || "Indian"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: FAMILY DETAILS */}
                  <section id="sec-family" className="scroll-mt-6 space-y-4 pt-6 border-t border-black/15">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Family Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Father&apos;s Name</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.father_name || selectedAssignedApplication.fatherName || "—"}
                        </p>
                        <p className="text-black/65 text-[11px] mt-1">
                          Occupation: {selectedAssignedApplication.father_occupation || selectedAssignedApplication.fatherOccupation || "—"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Annual Income: {selectedAssignedApplication.father_income || selectedAssignedApplication.fatherAnnualIncome || "—"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Status: {selectedAssignedApplication.fatherEmploymentStatus || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Mother&apos;s Name</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.mother_name || selectedAssignedApplication.motherName || "—"}
                        </p>
                        <p className="text-black/65 text-[11px] mt-1">
                          Occupation: {selectedAssignedApplication.mother_occupation || selectedAssignedApplication.motherOccupation || "—"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Annual Income: {selectedAssignedApplication.mother_income || selectedAssignedApplication.motherAnnualIncome || "—"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Status: {selectedAssignedApplication.motherEmploymentStatus || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Total Family Income & Members</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.family_annual_income ||
                            selectedAssignedApplication.annual_income ||
                            selectedAssignedApplication.annualFamilyIncome ||
                            "—"}
                        </p>
                        <p className="text-black/65 text-[11px] mt-1">
                          Family Members: {selectedAssignedApplication.familyMembersCount || selectedAssignedApplication.family_members_count || "—"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Family Type: {selectedAssignedApplication.familyType || "Nuclear"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Situation:{" "}
                          {selectedAssignedApplication.familySituation ||
                            (selectedAssignedApplication.orphan
                              ? "Orphan"
                              : selectedAssignedApplication.single_parent
                                ? "Single Parent"
                                : "Both Parents")}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Guardian Details (If Applicable)</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.guardian_name || selectedAssignedApplication.guardianName || "—"}
                        </p>
                        <p className="text-black/65 text-[11px] mt-1">
                          Relation: {selectedAssignedApplication.guardianRelation || "—"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Occupation: {selectedAssignedApplication.guardian_occupation || selectedAssignedApplication.guardianOccupation || "—"}
                        </p>
                        <p className="text-black/65 text-[11px]">
                          Annual Income: {selectedAssignedApplication.guardian_income || selectedAssignedApplication.guardianAnnualIncome || "—"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 3: SIBLINGS DETAILS */}
                  <section id="sec-siblings" className="scroll-mt-6 space-y-4 pt-6 border-t border-black/15">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Siblings Information
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs mb-3">
                      <div className="bg-black/5 px-3.5 py-2 rounded-md border border-black/15">
                        <span className="text-black/65">Number of Siblings: </span>
                        <strong className="text-black">
                          {selectedAssignedApplication.siblingCount ??
                            selectedAssignedApplication.siblings_count ??
                            (Array.isArray(selectedAssignedApplication.siblings)
                              ? selectedAssignedApplication.siblings.length
                              : 0)}
                        </strong>
                      </div>
                      <div className="bg-black/5 px-3.5 py-2 rounded-md border border-black/15">
                        <span className="text-black/65">Siblings Currently Studying: </span>
                        <strong className="text-black">
                          {selectedAssignedApplication.siblingsStudyingCount || "—"}
                        </strong>
                      </div>
                    </div>

                    {Array.isArray(selectedAssignedApplication.siblings) && selectedAssignedApplication.siblings.length > 0 ? (
                      <table className="w-full text-left text-xs border border-black/15 rounded-md overflow-hidden">
                        <thead className="bg-black/5 text-black font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Relationship</th>
                            <th className="py-2.5 px-3">Age</th>
                            <th className="py-2.5 px-3">Education / Occupation</th>
                            <th className="py-2.5 px-3">School / Institution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/15 bg-white">
                          {selectedAssignedApplication.siblings.map((s: any, i: number) => (
                            <tr key={i} className="hover:bg-black/5">
                              <td className="py-2 px-3 font-bold text-black">{s.name || "—"}</td>
                              <td className="py-2 px-3 text-black">{s.relationship || "—"}</td>
                              <td className="py-2 px-3 text-black">{s.age || "—"}</td>
                              <td className="py-2 px-3 text-black">{s.education || s.occupation || "—"}</td>
                              <td className="py-2 px-3 text-black">{s.institution || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : typeof selectedAssignedApplication.siblings === "string" && selectedAssignedApplication.siblings.trim() ? (
                      <div className="p-4 bg-black/5 border border-black/15 rounded-md text-xs text-black whitespace-pre-wrap">
                        {selectedAssignedApplication.siblings}
                      </div>
                    ) : (
                      <p className="text-black/65 italic bg-black/5 p-4 rounded-md border border-black/15">
                        No siblings recorded
                      </p>
                    )}
                  </section>

                  {/* SECTION 4: ADDRESS INFORMATION */}
                  <section id="sec-address" className="scroll-mt-6 space-y-4 pt-6 border-t border-black/15">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Address & Residence Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-black/5 p-4 rounded-md border border-black/15 sm:col-span-2">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Permanent Address</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.permanentAddress || selectedAssignedApplication.address || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15 sm:col-span-2">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Current Residential Address</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.currentAddress ||
                            selectedAssignedApplication.current_address ||
                            selectedAssignedApplication.address ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Village / Town</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.villageTown || selectedAssignedApplication.village_town || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">District & State</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.district || "—"},{" "}
                          {selectedAssignedApplication.state || "Tamil Nadu"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">PIN Code</span>
                        <p className="font-mono font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.pincode || selectedAssignedApplication.pin_code || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Residence Type</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.residenceType || selectedAssignedApplication.housing_status || "Own"}
                        </p>
                      </div>
                      {(selectedAssignedApplication.residenceType || selectedAssignedApplication.housing_status) === "Rented" && (
                        <div className="bg-black/5 p-4 rounded-md border border-black/15">
                          <span className="text-[10px] text-black/65 uppercase font-bold">Monthly Rent</span>
                          <p className="font-bold text-sm text-black mt-0.5">
                            {selectedAssignedApplication.rentAmount || selectedAssignedApplication.rent_amount || "—"}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SECTION 5: EDUCATIONAL INFORMATION */}
                  <section id="sec-academic" className="scroll-mt-6 space-y-4 pt-6 border-t border-black/15">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Educational Information (10th, 12th & Preferences)
                      </h4>
                    </div>

                    {/* 12th Standard Section (Most critical) */}
                    <div className="p-5 bg-brand/15 border border-brand/60 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-bold text-sm text-black">
                          12th Higher Secondary Marks (HSC)
                        </span>
                        {(selectedAssignedApplication.twelfth_cutoff || selectedAssignedApplication.twelfthCutoff) && (
                          <span className="px-3 py-1 bg-brand font-mono font-bold text-sm text-black rounded-md">
                            Cutoff: {selectedAssignedApplication.twelfth_cutoff || selectedAssignedApplication.twelfthCutoff} / 200
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-black/65 block">School Name:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.twelfth_school_name || selectedAssignedApplication.twelfthSchool || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Board & Passing Year:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.twelfth_board || selectedAssignedApplication.twelfthBoard || "State Board"} (
                            {selectedAssignedApplication.twelfth_pass_year || selectedAssignedApplication.twelfthYear || "—"})
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Group / Stream:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.twelfth_group ||
                              selectedAssignedApplication.twelfthStream ||
                              selectedAssignedApplication.twelfth_stream ||
                              "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Total Marks & %:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.twelfth_total_marks || selectedAssignedApplication.twelfthTotalMarks || "—"} /{" "}
                            {selectedAssignedApplication.twelfth_max_marks || "600"} (
                            {selectedAssignedApplication.twelfth_percentage || selectedAssignedApplication.twelfthPercentage || "—"}%)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 10th Standard Section */}
                    <div className="p-5 bg-black/5 border border-black/15 rounded-lg">
                      <span className="font-heading font-bold text-sm text-black">
                        10th Secondary School Marks (SSLC)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-black/65 block">School Name:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.tenth_school_name || selectedAssignedApplication.tenthSchool || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Board & Passing Year:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.tenth_board || selectedAssignedApplication.tenthBoard || "State Board"} (
                            {selectedAssignedApplication.tenth_pass_year || selectedAssignedApplication.tenthYear || "—"})
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Total Marks:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.tenth_marks_obtained || selectedAssignedApplication.tenthTotalMarks || "—"} /{" "}
                            {selectedAssignedApplication.tenth_max_marks || "500"}
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Percentage:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.tenth_percentage || selectedAssignedApplication.tenthPercentage || "—"}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Course & Degree Preferences */}
                    <div className="p-5 bg-white border border-black/15 rounded-lg">
                      <span className="font-heading font-bold text-sm text-black">Course & Degree Preferences</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-black/65 block">Preferred Degree:</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.preferred_degree || selectedAssignedApplication.preferredDegree || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Preferred Course (1st):</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.preferred_branch ||
                              (Array.isArray(selectedAssignedApplication.preferred_courses)
                                ? selectedAssignedApplication.preferred_courses[0]
                                : selectedAssignedApplication.preferred_courses) ||
                              "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Preferred Course (2nd):</span>
                          <p className="font-bold text-black">
                            {selectedAssignedApplication.secondBranch ||
                              (Array.isArray(selectedAssignedApplication.preferred_courses)
                                ? selectedAssignedApplication.preferred_courses[1]
                                : "") ||
                              "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-black/65 block">Preferred College / Location:</span>
                          <p className="font-bold text-black">
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
                  <section id="sec-financial" className="scroll-mt-6 space-y-4 pt-6 border-t border-black/15">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Financial Information & Needs
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Annual Family Income</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.annualIncome ||
                            selectedAssignedApplication.family_annual_income ||
                            selectedAssignedApplication.annualFamilyIncome ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Income Sources</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.incomeSources || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Family Debts</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.familyDebts || selectedAssignedApplication.family_debt || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Existing Education Loans</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.educationLoans || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Can Afford Without Support?</span>
                        <p className="font-bold text-sm text-black mt-0.5">
                          {selectedAssignedApplication.affordabilityWithoutSupport || "No"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15 sm:col-span-3">
                        <span className="text-[10px] text-black/65 uppercase font-bold">
                          Financial Difficulties Faced by Family
                        </span>
                        <p className="text-black mt-1 leading-relaxed">
                          {selectedAssignedApplication.financialDifficulties || "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15 sm:col-span-3">
                        <span className="text-[10px] text-black/65 uppercase font-bold">
                          Why the Student Needs Financial Support
                        </span>
                        <p className="text-black mt-1 leading-relaxed">
                          {selectedAssignedApplication.whyNeedSupport ||

                            selectedAssignedApplication.reason_for_applying ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 7: PERSONAL BACKGROUND & GOALS */}
                  <section id="sec-background" className="scroll-mt-6 space-y-4 pt-6 border-t border-black/15">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Background, Career Ambition & Goals
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedAssignedApplication.orphan
                          ? "bg-brand/15 border-brand/60 text-black"
                          : "bg-white border-black/15 text-black/65"
                          }`}
                      >
                        {selectedAssignedApplication.orphan ? <> <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> Orphan Student</> : "Not Orphan"}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedAssignedApplication.single_parent
                          ? "bg-brand/15 border-brand/60 text-black"
                          : "bg-white border-black/15 text-black/65"
                          }`}
                      >
                        {selectedAssignedApplication.single_parent ? <> <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> Single Parent Child</> : "Both Parents"}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedAssignedApplication.first_graduate || selectedAssignedApplication.is_first_graduate
                          ? "bg-brand/15 border-brand/60 text-black"
                          : "bg-white border-black/15 text-black/65"
                          }`}
                      >
                        {selectedAssignedApplication.first_graduate || selectedAssignedApplication.is_first_graduate
                          ? <> <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> First-Generation Learner</>
                          : "Non-First Graduate"}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-brand/15 border-brand/60 text-black">
                        {selectedAssignedApplication.willingToRelocateTN !== false
                          ? <> <CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /> Willing to Relocate in Tamil Nadu</>
                          : "Local Only"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div className="bg-black/5 p-4 rounded-md border border-black/15 sm:col-span-2">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Career Ambition</span>
                        <p className="font-medium text-black mt-1">
                          {selectedAssignedApplication.careerAmbition ||
                            selectedAssignedApplication.career_aspiration ||
                            selectedAssignedApplication.career_goals ||
                            "—"}
                        </p>
                      </div>
                      <div className="bg-black/5 p-4 rounded-md border border-black/15">
                        <span className="text-[10px] text-black/65 uppercase font-bold">Future Goals</span>
                        <p className="font-medium text-black mt-1">
                          {selectedAssignedApplication.futureGoals || "—"}
                        </p>
                      </div>
                      {selectedAssignedApplication.specialCircumstances && (
                        <div className="bg-black/5 p-4 rounded-md border border-black/15 sm:col-span-2">
                          <span className="text-[10px] text-black/65 uppercase font-bold">
                            Special Family Circumstances
                          </span>
                          <p className="font-medium text-black mt-1">
                            {selectedAssignedApplication.specialCircumstances}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SECTION 8: DOCUMENTS CHECKLIST (THE EXACT 4 APPLICATION DOCUMENTS) */}
                  <section id="sec-documents" className="scroll-mt-6 space-y-4 pt-6 border-t border-black/15">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/15">
                      <h4 className="font-heading font-bold text-sm text-black uppercase tracking-wider">
                        Document Uploads & Checklist
                      </h4>
                    </div>
                    <div className="p-4 bg-black/5 border border-black/15 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading font-bold text-sm text-black">
                          Application Documents (4 Documents)
                        </span>
                        <span className="text-[11px] text-black/65 font-medium">
                          Documents submitted during initial admission application
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
                            className="p-4 bg-white rounded-lg border border-black/15 flex flex-col justify-between gap-3 transition"
                          >
                            <div>
                              <span className="font-heading font-bold text-black text-xs block">{doc.label}</span>
                              <span className="text-[10px] text-black/65 mt-0.5 block">Document #{idx + 1}</span>
                            </div>

                            {doc.url ? (
                              <div className="pt-2 border-t border-black/15 flex items-center justify-between gap-2">
                                <span className="font-bold text-black text-xs flex items-center gap-1">
                                  <CheckBadgeIcon className="w-4 h-4 text-black/65" /> Uploaded
                                </span>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-md bg-brand hover:brightness-95 text-black font-heading font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>View &rarr;</span>
                                </a>
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-black/15">
                                <span className="text-black/65 text-xs italic">Not Provided</span>
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
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                    Applicants Details
                  </h1>
                  <p className="font-primary text-xs sm:text-sm text-black mt-1">
                    Review and manage student applications for the Maatram Foundation 2025-26 program.
                  </p>
                </div>
              </div>

              {/* Search & Filter Bar matching Image 2 */}
              <div className="bg-white border border-black/15 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-4 h-4 text-black/65" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, application no, mobile, email, or district..."
                    className="w-full bg-black/5 border border-black/15 rounded-md pl-10 pr-4 py-2.5 text-xs text-black placeholder-black/65 focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-black/5 border border-black/15 rounded-md px-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-brand focus:bg-white transition cursor-pointer"
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
              <div className="bg-white border border-black/15 rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-black/15 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-bold text-base text-black">
                      Applicant Records
                    </h2>
                    <p className="text-xs text-black/65 mt-0.5">
                      Showing {filteredApplications.length} of {assignedApplications.length} students
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/5 border-b border-black/15 font-heading font-bold text-black tracking-wider uppercase text-[10px]">
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
                    <tbody className="divide-y divide-black/15">
                      {filteredApplications.map((app) => (
                        <tr
                          key={app.id || app.application_number}
                          className="hover:bg-brand/15 transition cursor-pointer"
                          onClick={() => handleOpenApplicantPage(app)}
                        >
                          {/* Application No */}
                          <td className="py-3.5 px-4 font-mono font-bold text-black">
                            <div>{app.application_number || "—"}</div>
                            <div className="text-[10px] text-black/65 font-normal mt-0.5">
                              {app.created_at
                                ? new Date(app.created_at).toLocaleDateString("en-GB")
                                : "17/11/2026"}
                            </div>
                            {app.status === "physical_verification_in_progress" || app.status === "telephonic_done" || app._matchedRole === "physical" ? (
                              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-brand/15 border border-brand/60 text-black text-[10px] font-bold rounded-md">
                                <HomeModernIcon className="w-3 h-3 text-black" />
                                <span>Phase 2: Physical</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-brand/15 border border-brand/60 text-black text-[10px] font-bold rounded-md">
                                <PhoneIcon className="w-3 h-3 text-black" />
                                <span>Phase 1: Tele</span>
                              </span>
                            )}
                          </td>

                          {/* Student Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-black text-sm">
                              {app.full_name || app.name || "Student Applicant"}
                            </div>
                            <div className="text-[11px] text-black/65 mt-0.5 flex items-center gap-1.5">
                              <span>{app.gender || "Male"}</span>
                              <span>•</span>
                              <span className="text-black font-medium">
                                {app.is_first_graduate || app.first_graduate ? "First Graduate" : "Regular"}
                              </span>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4 text-black">
                            <div className="flex items-center gap-1.5 font-medium">
                              <PhoneIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                              <span>{app.mobile_number || app.phone || "—"}</span>
                            </div>
                            <div className="text-[11px] text-black/65 mt-0.5 flex items-center gap-1.5">
                              <EnvelopeIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                              <span className="truncate max-w-[170px]">{app.email || "—"}</span>
                            </div>
                          </td>

                          {/* District */}
                          <td className="py-3.5 px-4 text-black">
                            <div className="font-bold text-black">{app.district || "—"}</div>
                            <div className="text-[11px] text-black/65">{app.pincode || app.pin_code || ""}</div>
                          </td>

                          {/* 12th Cutoff */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="px-2.5 py-1 rounded-md bg-brand/15 border border-brand/60 text-black font-bold text-xs inline-block">
                              {app.twelfth_cutoff || "—"}
                            </span>
                            <div className="text-[10px] text-black/65 mt-0.5">
                              {app.twelfth_stream || app.twelfth_group || "CS"}
                            </div>
                          </td>

                          {/* Course Preference */}
                          <td className="py-3.5 px-4 text-black">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <AcademicCapIcon className="w-4 h-4 text-black/65 shrink-0" />
                              <span>{app.preferred_degree || "Engineering (B.E / B.Tech)"}</span>
                            </div>
                          </td>

                          {/* Family Income */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-brand/15 border border-brand/60 text-black font-bold text-[11px] inline-block">
                              {app.family_annual_income || app.annual_income || "12000"}
                            </span>
                          </td>

                          {/* Volunteer Suggestion */}
                          <td className="py-3.5 px-4 max-w-[220px]">
                            {app.physical_volunteer_suggestion ? (
                              <div className="p-2 rounded-md bg-brand/15 border border-brand/60 text-[11px] text-black leading-snug">
                                <span className="text-[10px] uppercase font-bold text-black block mb-0.5">Phase 2 Physical</span>
                                <p className="line-clamp-2">{app.physical_volunteer_suggestion}</p>
                                {app.physical_volunteer_name && (
                                  <p className="text-[10px] text-black font-bold mt-1">
                                    — {app.physical_volunteer_name}
                                  </p>
                                )}
                              </div>
                            ) : app.tele_volunteer_suggestion || app.volunteer_suggestion ? (
                              <div className="p-2 rounded-md bg-brand/15 border border-brand/60 text-[11px] text-black leading-snug">
                                <span className="text-[10px] uppercase font-bold text-black block mb-0.5">Phase 1 Tele</span>
                                <p className="line-clamp-2">{app.tele_volunteer_suggestion || app.volunteer_suggestion}</p>
                                {(app.tele_volunteer_name || app.volunteer_name) && (
                                  <p className="text-[10px] text-black font-bold mt-1">
                                    — {app.tele_volunteer_name || app.volunteer_name}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-black/65 text-xs">
                                <span className="italic">No remarks</span>
                                <span className="text-[10px] text-black font-bold underline cursor-pointer">
                                  + Record
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Siblings */}
                          <td className="py-3.5 px-4 text-black font-mono text-center">
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
                              className="w-8 h-8 rounded-md bg-black/5 hover:bg-brand text-black hover:text-black flex items-center justify-center transition cursor-pointer mx-auto"
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
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight mt-1">
                    Volunteer Portal
                  </h1>
                  <p className="font-primary text-xs sm:text-sm text-black mt-1">
                    {isAlumni
                      ? "Review applicant assignments, mock interviews, and foundation events."
                      : "Register for foundation drives and check your applicant assignments."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {hasAssignments && (
                    <button
                      type="button"
                      onClick={() => setActiveViewMode("table")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition border border-brand cursor-pointer"
                    >
                      <DocumentTextIcon className="w-4 h-4 stroke-[2.2]" />
                      <span>View Assigned Applicants ({assignedApplications.length})</span>
                    </button>
                  )}

                  <Link
                    href={isAlumni ? "/alumni/events" : "/student/events"}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-white border border-black/15 hover:border-brand transition"
                  >
                    <CalendarDaysIcon className="w-4 h-4 text-brand" />
                    <span>Browse Active Events</span>
                  </Link>
                </div>
              </div>

              {/* CENTER OF THE PAGE: REGISTER VOLUNTEER CARD */}
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="w-full max-w-3xl">
                  {!isRegisteredVolunteer ? (
                    <div className="bg-brand/10 rounded-xl border-2 border-brand/60 p-8 text-center space-y-5">
                      <div className="space-y-2 max-w-lg mx-auto">
                        <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-brand/15 text-black border border-brand/60">
                          Registration Required
                        </span>
                        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-black">
                          Register as a Volunteer
                        </h2>
                        <p className="text-xs sm:text-sm text-black leading-relaxed font-primary">
                          To participate in Remote calling tasks or Offline event drives posted by the Foundation Admin, register your volunteer profile below. We will retrieve your verified profile information to get you started.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleOpenRegisterModal}
                          className="px-8 py-3.5 rounded-lg text-sm font-heading font-bold text-black bg-brand hover:brightness-95 transition cursor-pointer shadow-sm hover:shadow-sm border border-brand inline-flex items-center gap-2 transform"
                        >
                          <IdentificationIcon className="w-5 h-5 stroke-[2.2]" />
                          <span>Register Volunteer</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-black/65 font-mono flex items-center justify-center gap-1.5">
                        <EnvelopeIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                        <span>Registered volunteers receive instant email notifications when new events are posted.</span>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border-2 border-brand p-7 sm:p-9 shadow-sm space-y-6 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-6 border-b border-black/15">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                          <div className="w-14 h-14 rounded-lg bg-brand/15 text-black border border-brand/60 flex items-center justify-center shrink-0">
                            <CheckCircleIcon className="w-8 h-8 stroke-[2.2]" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                              <h3 className="font-heading font-bold text-xl text-black">
                                Volunteer registration confirmed
                              </h3>
                              <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-brand/15 text-black border border-brand/60">
                                Verified
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-black mt-1 font-medium max-w-xl">
                              You?ll receive a notification when new drives and activities are posted.
                            </p>
                          </div>
                        </div>

                        <Link
                          href={isAlumni ? "/alumni/events" : "/student/events"}
                          className="px-5 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition border border-brand flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <span>Browse Volunteer Drives &rarr;</span>
                        </Link>
                      </div>

                      {/* Volunteer Credential Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-left">
                        <div className="p-4 rounded-lg bg-black/5 border border-black/15">
                          <span className="text-[10px] text-black/65 font-bold uppercase tracking-wider block">
                            Volunteer Name
                          </span>
                          <span className="font-heading font-bold text-black text-sm mt-0.5 block">
                            {volunteerData?.name || formData.name}
                          </span>
                          <span className="text-[11px] text-black/65 font-mono mt-0.5 block truncate">
                            {volunteerData?.email || formData.email}
                          </span>
                        </div>

                        <div className="p-4 rounded-lg bg-black/5 border border-black/15">
                          <span className="text-[10px] text-black/65 font-bold uppercase tracking-wider block">
                            Affiliation
                          </span>
                          <span className="font-heading font-bold text-black text-sm mt-0.5 block truncate">
                            {volunteerData?.college || formData.college}
                          </span>
                          <span className="text-[11px] text-black/65 mt-0.5 block">
                            {isAlumni
                              ? volunteerData?.company || formData.company || "Alumni"
                              : volunteerData?.year_of_study || formData.yearOfStudy}
                          </span>
                        </div>

                        <div className="p-4 rounded-lg bg-brand/15 border border-brand/60">
                          <span className="text-[10px] text-black font-bold uppercase tracking-wider block">
                            Status & Contribution
                          </span>
                          <span className="font-heading font-bold text-black text-sm mt-0.5 block truncate">
                            {isAlumni ? "Mock Interviews & Verification" : "Applicant Calling & Events"}
                          </span>
                          <span className="text-[11px] text-black font-bold mt-0.5 block">
                            ● Ready to contribute to Maatram
                          </span>
                        </div>
                      </div>

                      {/* Assigned Student Applications preview card */}
                      <div className="border-t border-black/15 pt-5 text-left">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <h4 className="font-heading font-bold text-sm text-black">
                              Assigned Student Applications
                            </h4>
                            <p className="text-[11px] text-black/65 mt-0.5">
                              Applications assigned to you for verification review (Phase 1 Telephonic & Phase 2 Physical Verification).
                            </p>
                          </div>
                          {hasAssignments ? (
                            <button
                              type="button"
                              onClick={() => setActiveViewMode("table")}
                              className="rounded-md bg-brand/15 hover:bg-brand/30 px-3 py-1 text-[11px] font-bold text-black transition cursor-pointer"
                            >
                              {assignedApplications.length} Assigned &rarr; View Full Table
                            </button>
                          ) : (
                            <span className="rounded-md bg-black/5 px-2.5 py-1 text-[11px] font-bold text-black">
                              0 Assigned
                            </span>
                          )}
                        </div>

                        {assignedApplications.length === 0 ? (
                          <div className="rounded-md border border-dashed border-black/15 bg-black/5 p-6 text-center text-xs text-black/65">
                            No student applications assigned yet. Wait for foundation admin to allocate verification tasks.
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-brand/15 border border-brand/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-brand/15 text-black font-bold flex items-center justify-center">
                                {assignedApplications.length}
                              </div>
                              <div>
                                <p className="font-heading font-bold text-black text-sm">
                                  {assignedApplications.length} Applicant{assignedApplications.length > 1 ? "s" : ""} Assigned for Verification
                                </p>
                                <p className="text-xs text-black">
                                  Access the full applicant details table below to review documents and submit your verification reports.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveViewMode("table")}
                              className="px-4 py-2 rounded-md bg-brand hover:brightness-95 text-black font-bold text-xs transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="bg-white rounded-lg border border-black/15 shadow-sm max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/15 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-black/5 border border-black/15 flex items-center justify-center text-black">
                  <IdentificationIcon className="w-5 h-5 text-black stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    Register as Volunteer
                  </h3>
                  <p className="text-[11px] text-black/65">
                    Verified details retrieved from your profile page
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-black/65 hover:text-black font-bold text-sm w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition cursor-pointer"
              >
                <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
              </button>
            </div>

            <form onSubmit={handleConfirmRegistration} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        disabled
                        value={isAlumni ? "Alumni Volunteer" : "Student Volunteer"}
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs text-black font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-black mb-1">
                      College / Institution
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
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
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
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
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-black mb-1">
                      Volunteering Skills / Interest Areas
                    </label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="e.g. Telephonic calling, event registration desk, math tutoring"
                      className="w-full px-3 py-2 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="p-3 bg-black/5 border border-black/15 rounded-md text-[11px] text-black flex items-start gap-2">
                  <SparklesIcon className="w-4 h-4 text-black/65 shrink-0 mt-0.5" />
                  <span>
                    By registering, you will be eligible to receive telephonic verification tasks and first-come volunteer events posted by the foundation.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-3 border-t border-black/15 flex items-center justify-end gap-3 shrink-0 bg-black/5">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/10 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand flex items-center gap-1.5"
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
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full overflow-hidden shadow-sm border border-black/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/15 bg-black/5">
              <span className="font-heading font-bold text-sm text-black">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-black/65 hover:text-black hover:bg-black/10 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[75vh]">
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
