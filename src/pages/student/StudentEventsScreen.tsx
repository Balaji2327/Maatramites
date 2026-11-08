"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  SparklesIcon,
  IdentificationIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import EventCard, { EventCardData } from "../../components/EventCard";
import { studentApi, getStoredUser } from "../../lib/api";

export default function StudentEventsScreen() {
  const [eventsList, setEventsList] = useState<EventCardData[]>([]);

  // Safe client hydration from cache on mount
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("maatram_student_events_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEventsList(parsed);
        }
      }
    } catch (e) {}
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // User Profile & Volunteer Registration state
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isRegisteredVolunteer, setIsRegisteredVolunteer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventCardData | null>(null);

  // Volunteer Registration Popup state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [volunteerFormData, setVolunteerFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    yearOfStudy: "1st Year",
    skills: "Telephonic Calling, Socio-economic verification, Event desk",
  });

  // Assigned Applicants Modal State (Admin Approved)
  const [assignedModalOpen, setAssignedModalOpen] = useState(false);
  const [assignedEventTitle, setAssignedEventTitle] = useState("");
  const [assignedApplicants, setAssignedApplicants] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const handleViewAssignedApplicants = async (event: EventCardData) => {
    try {
      setAssignedEventTitle(event.title);
      setAssignedModalOpen(true);
      setIsLoadingAssignments(true);

      const res = await studentApi.getEventAssignments(event.id, userEmail);
      if (res.success && Array.isArray(res.data?.assigned_applicants)) {
        setAssignedApplicants(res.data.assigned_applicants);
      } else {
        const local = event.volunteerAssignments?.[userEmail.trim().toLowerCase()] || [];
        setAssignedApplicants(local);
      }
    } catch (err) {
      console.error("Failed to load assigned applicants:", err);
      const local = event.volunteerAssignments?.[userEmail.trim().toLowerCase()] || [];
      setAssignedApplicants(local);
    } finally {
      setIsLoadingAssignments(false);
    }
  };


  // Fetch events from database
  const fetchEvents = async () => {
    try {
      const res = await studentApi.getEvents();
      if (res.success && Array.isArray(res.data)) {
        const formatted: EventCardData[] = res.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          date: item.event_date || item.date || "TBD",
          time: item.event_time || item.time || "",
          location: item.location || "Chennai",
          category: item.category || "Volunteer Drive",
          targetAudience: item.target_audience || "Scholars",
          imageUrl: item.image_url || "",
          status: item.status || "upcoming",
          mode: item.mode || "offline",
          studentVolunteersNeeded: item.student_volunteers_needed ?? item.studentVolunteersNeeded ?? 0,
          alumniVolunteersNeeded: item.alumni_volunteers_needed ?? item.alumniVolunteersNeeded ?? 0,
          taskToComplete: item.task_to_complete || item.taskToComplete || "",
          duration: item.duration || "",
          startTime: item.start_time || item.startTime || "",
          endTime: item.end_time || item.endTime || "",
          eligibleYears: item.eligible_years || item.eligibleYears || ["1", "2", "3", "4"],
          acceptedStudents: item.accepted_students || item.acceptedStudents || [],
          acceptedAlumni: item.accepted_alumni || item.acceptedAlumni || [],
          rejectedParticipants: item.rejected_participants || item.rejectedParticipants || [],
          volunteerAssignments: item.volunteer_assignments || item.volunteerAssignments || {},
        }));
        setEventsList(formatted);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("maatram_student_events_cache", JSON.stringify(formatted));
          } catch (e) {}
        }
      } else {
        setEventsList([]);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
      setEventsList([]);
    }
  };

  useEffect(() => {
    // Clean up any stale legacy global volunteer keys
    localStorage.removeItem("maatram_volunteer_student");
    localStorage.removeItem("maatram_volunteer_alumni");

    const storedUser = getStoredUser();
    const email = (storedUser?.email || "").trim().toLowerCase();
    const name = storedUser?.name || storedUser?.full_name || "";

    if (email) setUserEmail(email);
    if (name) setUserName(name);

    // Pre-populate volunteer registration form with user profile
    setVolunteerFormData({
      name: name || "",
      email: email || "",
      phone: storedUser?.phone || storedUser?.mobile_number || storedUser?.whatsapp || "+91 98765 43210",
      college: storedUser?.college || storedUser?.college_name || "Engineering College",
      department: storedUser?.department || storedUser?.degree || "Engineering",
      yearOfStudy: storedUser?.year || storedUser?.current_year || "1st Year",
      skills: "Telephonic Calling, Socio-economic verification, Event desk",
    });

    if (!email) {
      setIsRegisteredVolunteer(false);
      fetchEvents();
      return;
    }

    // Check user-scoped local cache
    const userVolKey = `maatram_volunteer_${email}`;
    const local = localStorage.getItem(userVolKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed) setIsRegisteredVolunteer(true);
      } catch {
        // ignore
      }
    } else {
      setIsRegisteredVolunteer(false);
    }

    // Always verify authoritatively against backend database
    studentApi
      .checkVolunteerStatus(email)
      .then((res) => {
        if (res.success && res.isRegistered) {
          setIsRegisteredVolunteer(true);
          localStorage.setItem(userVolKey, JSON.stringify(res.data || true));
        } else {
          setIsRegisteredVolunteer(false);
          localStorage.removeItem(userVolKey);
        }
      })
      .catch(() => { });

    fetchEvents();
  }, []);

  // Handle Volunteer Registration Submit from Popup
  const handleRegisterVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRegistration(true);

    const cleanEmail = (volunteerFormData.email || userEmail).trim().toLowerCase();
    const payload = {
      name: volunteerFormData.name || userName || "Scholar Volunteer",
      email: cleanEmail,
      phone: volunteerFormData.phone,
      college: volunteerFormData.college,
      department: volunteerFormData.department,
      year_of_study: volunteerFormData.yearOfStudy,
      skills: volunteerFormData.skills,
      role: "student",
    };

    try {
      const res = await studentApi.registerVolunteer(payload);
      const reg = res.success && res.data ? res.data : payload;

      setIsRegisteredVolunteer(true);
      localStorage.setItem(`maatram_volunteer_${cleanEmail}`, JSON.stringify(reg));
      setIsRegisterModalOpen(false);
      setToastType("success");
      setToastMessage("Successfully registered as a Maatram Volunteer! You can now accept incoming volunteer events.");
      await fetchEvents();
    } catch (err: any) {
      // Local fallback
      setIsRegisteredVolunteer(true);
      localStorage.setItem(`maatram_volunteer_${cleanEmail}`, JSON.stringify(payload));
      setIsRegisterModalOpen(false);
      setToastType("success");
      setToastMessage("Successfully registered as a Maatram Volunteer!");
      await fetchEvents();
    } finally {
      setIsSubmittingRegistration(false);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  // Handle Volunteer Accept
  const handleAcceptEvent = async (event: EventCardData) => {
    if (!isRegisteredVolunteer) {
      setIsRegisterModalOpen(true);
      return;
    }

    try {
      const res = await studentApi.respondToEvent(event.id, {
        email: userEmail,
        name: userName,
        role: "student",
        action: "accept",
      });

      if (res.success) {
        setToastType("success");
        setToastMessage(`🎉 Seat confirmed! You are accepted for "${event.title}" on a first-come basis.`);
        await fetchEvents();
      } else {
        setToastType("error");
        setToastMessage(res.message || "Quota full! First-come seats are filled.");
        await fetchEvents();
      }
      setTimeout(() => setToastMessage(""), 6000);
    } catch (err: any) {
      setToastType("error");
      setToastMessage(err.message || "Failed to accept event");
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  // Handle Volunteer Reject
  const handleRejectEvent = async (event: EventCardData) => {
    try {
      const res = await studentApi.respondToEvent(event.id, {
        email: userEmail,
        name: userName,
        role: "student",
        action: "reject",
      });

      if (res.success) {
        setToastType("success");
        setToastMessage(`Declined invitation for "${event.title}".`);
        await fetchEvents();
      }
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err: any) {
      setToastType("error");
      setToastMessage(err.message || "Failed to decline event");
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "Remote" && event.mode === "remote") ||
        (selectedCategory === "Offline" && event.mode === "offline") ||
        event.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [eventsList, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Dedicated Student Sidebar */}
      <StudentSidebar activeTab="events" sectionRole="student" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Volunteer Events & Drives
              </h1>
              <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                Participate in Remote calling tasks and Offline drives. Registration is on a first-come, first-served basis.
              </p>
            </div>

            {/* Volunteer Status Indicator */}
            <div>
              {isRegisteredVolunteer ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                  <span>Registered Volunteer</span>
                </span>
              ) : (
                <Link
                  href="/student/volunteer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-heading font-bold text-xs hover:bg-amber-400 transition shadow-xs"
                >
                  <IdentificationIcon className="w-4 h-4" />
                  <span>Register as Volunteer &rarr;</span>
                </Link>
              )}
            </div>
          </div>

          {/* Toast Message */}
          {toastMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border ${toastType === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-red-50 border-red-300 text-red-950"
                }`}
            >
              {toastType === "success" ? (
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          )}

          {/* First-Come Policy Notice */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>First-Come, First-Served Policy:</strong> Only the first participants to click <strong>Accept</strong> will be enrolled up to the student quota limit.
              </span>
            </div>
            {!isRegisteredVolunteer && (
              <Link
                href="/student/volunteer"
                className="text-[11px] font-bold text-amber-900 underline whitespace-nowrap"
              >
                Register in Volunteer Tab
              </Link>
            )}
          </div>

          {/* Filter & Search Bar */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events by title, task, or location..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/20 transition"
              />
            </div>
          </section>

          {/* Events Grid / Empty States */}
          {filteredEvents.length === 0 ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 space-y-3">
              <CalendarDaysIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-heading font-bold text-base text-slate-800">
                No Volunteer Events Available
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No events match your current filter. When the Foundation Admin posts a new volunteer event, you will receive an email notification and it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userRole="student"
                  userEmail={userEmail}
                  isRegisteredVolunteer={isRegisteredVolunteer}
                  onView={(ev) => setSelectedEvent(ev)}
                  onAccept={(ev) => handleAcceptEvent(ev)}
                  onReject={(ev) => handleRejectEvent(ev)}
                  onRegisterVolunteer={() => setIsRegisterModalOpen(true)}
                  onViewAssignedApplicants={handleViewAssignedApplicants}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* DETAIL VIEW POPUP MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {selectedEvent.imageUrl && (
              <div className="relative w-full h-44 bg-slate-100 shrink-0">
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedEvent.mode === "remote" ? "Remote Event" : "Offline Event"}
                </span>
                {(selectedEvent.acceptedStudents || []).some((s: any) => s.email?.toLowerCase() === userEmail.trim().toLowerCase()) ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span>Successfully Accepted</span>
                  </span>
                ) : selectedEvent.status === "completed" || selectedEvent.status === "cancelled" ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedEvent.status}
                  </span>
                ) : null}
              </div>

              <h2 className="font-heading font-bold text-xl text-slate-900">
                {selectedEvent.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed font-primary">
                {selectedEvent.description}
              </p>

              {/* Task Section */}
              {selectedEvent.taskToComplete && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <span className="font-bold text-slate-800">Task: </span>
                  <span>{selectedEvent.taskToComplete}</span>
                </div>
              )}

              {/* Quota Details */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Student Volunteers Needed
                  </span>
                  <span className="text-lg font-heading font-black text-slate-900">
                    {selectedEvent.acceptedStudents?.length || 0} / {selectedEvent.studentVolunteersNeeded || 0}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    First-Come, First-Served
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Alumni Volunteers Needed
                  </span>
                  <span className="text-lg font-heading font-black text-slate-900">
                    {selectedEvent.acceptedAlumni?.length || 0} / {selectedEvent.alumniVolunteersNeeded || 0}
                  </span>
                </div>
              </div>

              {/* Schedule / Venue */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-700">
                {selectedEvent.mode === "remote" ? (
                  <div className="flex items-center gap-2.5">
                    <ClockIcon className="w-4 h-4 text-slate-500 stroke-[2]" />
                    <span>Duration: <strong>{selectedEvent.duration || "Self-paced"}</strong></span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <CalendarDaysIcon className="w-4 h-4 text-slate-500 stroke-[2]" />
                      <span>Date & Time: <strong>{selectedEvent.date}</strong> ({selectedEvent.time})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPinIcon className="w-4 h-4 text-slate-500 stroke-[2]" />
                      <span>Location: <strong>{selectedEvent.location}</strong></span>
                    </div>
                  </>
                )}

                {selectedEvent.eligibleYears && (
                  <div className="flex items-center gap-2.5">
                    <UserGroupIcon className="w-4 h-4 text-slate-400 stroke-[2]" />
                    <span>Eligible Student Years: <strong>{selectedEvent.eligibleYears.map(y => `Year ${y}`).join(", ")}</strong></span>
                  </div>
                )}
              </div>

              {/* Already Accepted Confirmation Banner */}
              {(selectedEvent.acceptedStudents || []).some((s: any) => s.email?.toLowerCase() === userEmail.trim().toLowerCase()) && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-950">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 stroke-[2.2]" />
                  <div>
                    <span className="font-bold block">You have successfully accepted this event!</span>
                    <span className="text-emerald-800 text-[11px]">Your seat is confirmed as a student volunteer. The Foundation team has recorded your confirmation.</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-xs font-heading font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>

                {(selectedEvent.acceptedStudents || []).some((s: any) => s.email?.toLowerCase() === userEmail.trim().toLowerCase()) ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 font-heading font-bold text-xs border border-emerald-300">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                      <span>Successfully Accepted</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const ev = selectedEvent;
                        setSelectedEvent(null);
                        handleRejectEvent(ev);
                      }}
                      className="px-3 py-2 text-xs text-slate-500 hover:text-red-600 transition underline cursor-pointer"
                    >
                      Withdraw
                    </button>
                  </div>
                ) : isRegisteredVolunteer ? (
                  <button
                    type="button"
                    onClick={() => {
                      const ev = selectedEvent;
                      setSelectedEvent(null);
                      handleAcceptEvent(ev);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] transition cursor-pointer shadow-xs border border-[#e5ad0c]"
                  >
                    Accept Event Now &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(null);
                      setIsRegisterModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] transition cursor-pointer shadow-xs border border-[#e5ad0c] flex items-center gap-1.5"
                  >
                    <IdentificationIcon className="w-4 h-4" />
                    <span>Register as Volunteer to Participate &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VOLUNTEER REGISTRATION POPUP MODAL (ON CARD CLICK)       */}
      {/* ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                  <IdentificationIcon className="w-5 h-5 text-amber-700 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Register as Volunteer
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Complete one-time registration to accept and participate in foundation events
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterVolunteerSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Form Body */}
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
                        value={volunteerFormData.name}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, name: e.target.value })}
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
                        value="Student Volunteer"
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
                        value={volunteerFormData.email}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, email: e.target.value })}
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
                        value={volunteerFormData.phone}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, phone: e.target.value })}
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
                      value={volunteerFormData.college}
                      onChange={(e) => setVolunteerFormData({ ...volunteerFormData, college: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        Department / Branch
                      </label>
                      <input
                        type="text"
                        value={volunteerFormData.department}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                        Year of Study
                      </label>
                      <select
                        value={volunteerFormData.yearOfStudy}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, yearOfStudy: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-slate-700 mb-1">
                      Volunteering Skills / Interest Areas
                    </label>
                    <input
                      type="text"
                      value={volunteerFormData.skills}
                      onChange={(e) => setVolunteerFormData({ ...volunteerFormData, skills: e.target.value })}
                      placeholder="e.g. Telephonic calling, applicant verification, event registration"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                  <SparklesIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Once registered, the <strong>Accept</strong> and <strong>Reject</strong> buttons will be enabled on all volunteer event cards.
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
                  disabled={isSubmittingRegistration}
                  className="px-5 py-2.5 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-xs border border-[#e5ad0c] flex items-center gap-1.5"
                >
                  {isSubmittingRegistration ? (
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

      {/* ASSIGNED APPLICANTS POPUP MODAL (ADMIN APPROVED) */}
      {assignedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F7BC0F] flex items-center justify-center text-slate-950 shadow-xs">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900">
                    My Assigned Applicants ({assignedApplicants.length})
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    Event: <strong>{assignedEventTitle}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignedModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Admin approved your assignment! These applicants were matched to you by AI for telephonic verification and mentoring.
                </span>
              </div>

              {isLoadingAssignments ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Loading your assigned applicants...
                </div>
              ) : assignedApplicants.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  No applicants assigned yet.
                </div>
              ) : (
                assignedApplicants.map((app: any, idx: number) => (
                  <div
                    key={app.id || app.application_number || idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-[#F7BC0F] transition text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{app.name}</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            {app.application_number || `#${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {app.district || "Tamil Nadu"} • {app.stream || app.degree || "Higher Secondary"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                        {app.status || "Assigned"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      {app.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Contact:</span>
                          <a
                            href={`tel:${app.phone}`}
                            className="font-mono font-bold text-slate-900 hover:text-amber-600 transition"
                          >
                            {app.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400">Phone not provided</span>
                      )}

                      {app.match_reason && (
                        <span className="text-[11px] text-amber-800 font-medium italic">
                          Match: {app.match_reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignedModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-heading font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
