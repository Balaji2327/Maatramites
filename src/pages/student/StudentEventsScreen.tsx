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
        setToastMessage(`Seat confirmed! You are accepted for "${event.title}" on a first-come basis.`);
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
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Dedicated Student Sidebar */}
      <StudentSidebar activeTab="events" sectionRole="student" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Volunteer Events & Drives
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Participate in Remote calling tasks and Offline drives. Registration is on a first-come, first-served basis.
              </p>
            </div>

            {/* Volunteer Status Indicator */}
            <div>
              {isRegisteredVolunteer ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand/15 text-black border border-brand/60 text-xs font-bold">
                  <CheckCircleIcon className="w-4 h-4 text-black stroke-[2.2]" />
                  <span>Registered Volunteer</span>
                </span>
              ) : (
                <Link
                  href="/student/volunteer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand text-black font-heading font-bold text-xs hover:bg-brand transition"
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
              className={`p-4 rounded-lg text-xs font-bold flex items-center gap-2.5 animate-in fade-in border ${toastType === "success"
                ? "bg-brand/15 border-brand/60 text-black"
                : "bg-brand/15 border-brand/60 text-black"
                }`}
            >
              {toastType === "success" ? (
                <CheckCircleIcon className="w-5 h-5 text-black shrink-0" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-black shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          )}

          {/* First-Come Policy Notice */}
          <div className="p-3.5 bg-brand/15 border border-brand/60 rounded-lg text-xs text-black flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-black shrink-0" />
              <span>
                <strong>First-Come, First-Served Policy:</strong> Only the first participants to click <strong>Accept</strong> will be enrolled up to the student quota limit.
              </span>
            </div>
            {!isRegisteredVolunteer && (
              <Link
                href="/student/volunteer"
                className="text-[11px] font-bold text-black underline whitespace-nowrap"
              >
                Register in Volunteer Tab
              </Link>
            )}
          </div>

          {/* Filter & Search Bar */}
          <section className="bg-white border border-black/15 rounded-lg p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-black/65" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events by title, task, or location..."
                className="w-full bg-black/5 border border-black/15 rounded-md pl-10 pr-4 py-2.5 text-xs text-black placeholder-black/65 focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>
          </section>

          {/* Events Grid / Empty States */}
          {filteredEvents.length === 0 ? (
            <div className="py-20 text-center bg-white border border-black/15 rounded-xl p-8 space-y-3">
              <CalendarDaysIcon className="w-12 h-12 text-black/65 mx-auto" />
              <h3 className="font-heading font-bold text-base text-black">
                No Volunteer Events Available
              </h3>
              <p className="text-xs text-black/65 max-w-md mx-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="bg-white rounded-lg border border-black/15 shadow-sm max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {selectedEvent.imageUrl && (
              <div className="relative w-full h-44 bg-black/5 shrink-0">
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center transition cursor-pointer"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/5 text-black border border-black/15">
                  {selectedEvent.mode === "remote" ? "Remote Event" : "Offline Event"}
                </span>
                {(selectedEvent.acceptedStudents || []).some((s: any) => s.email?.toLowerCase() === userEmail.trim().toLowerCase()) ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-brand/15 text-black border border-brand/60 flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span>Successfully Accepted</span>
                  </span>
                ) : selectedEvent.status === "completed" || selectedEvent.status === "cancelled" ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/5 text-black border border-black/15">
                    {selectedEvent.status}
                  </span>
                ) : null}
              </div>

              <h2 className="font-heading font-bold text-xl text-black">
                {selectedEvent.title}
              </h2>

              <p className="text-xs text-black leading-relaxed font-primary">
                {selectedEvent.description}
              </p>

              {/* Task Section */}
              {selectedEvent.taskToComplete && (
                <div className="p-3 bg-black/5 border border-black/15 rounded-md text-xs text-black">
                  <span className="font-bold text-black">Task: </span>
                  <span>{selectedEvent.taskToComplete}</span>
                </div>
              )}

              {/* Quota Details */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-black/5 border border-black/15 rounded-md">
                  <span className="text-[10px] text-black/65 font-bold uppercase block">
                    Student Volunteers Needed
                  </span>
                  <span className="text-lg font-heading font-bold text-black">
                    {selectedEvent.acceptedStudents?.length || 0} / {selectedEvent.studentVolunteersNeeded || 0}
                  </span>
                  <span className="text-[10px] text-black/65 font-medium block mt-0.5">
                    First-Come, First-Served
                  </span>
                </div>

                <div className="p-3 bg-black/5 border border-black/15 rounded-md">
                  <span className="text-[10px] text-black/65 font-bold uppercase block">
                    Alumni Volunteers Needed
                  </span>
                  <span className="text-lg font-heading font-bold text-black">
                    {selectedEvent.acceptedAlumni?.length || 0} / {selectedEvent.alumniVolunteersNeeded || 0}
                  </span>
                </div>
              </div>

              {/* Schedule / Venue */}
              <div className="space-y-2 pt-3 border-t border-black/15 text-xs text-black">
                {selectedEvent.mode === "remote" ? (
                  <div className="flex items-center gap-2.5">
                    <ClockIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                    <span>Duration: <strong>{selectedEvent.duration || "Self-paced"}</strong></span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <CalendarDaysIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                      <span>Date & Time: <strong>{selectedEvent.date}</strong> ({selectedEvent.time})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPinIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                      <span>Location: <strong>{selectedEvent.location}</strong></span>
                    </div>
                  </>
                )}

                {selectedEvent.eligibleYears && (
                  <div className="flex items-center gap-2.5">
                    <UserGroupIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                    <span>Eligible Student Years: <strong>{selectedEvent.eligibleYears.map(y => `Year ${y}`).join(", ")}</strong></span>
                  </div>
                )}
              </div>

              {/* Already Accepted Confirmation Banner */}
              {(selectedEvent.acceptedStudents || []).some((s: any) => s.email?.toLowerCase() === userEmail.trim().toLowerCase()) && (
                <div className="p-3.5 bg-brand/15 border border-brand/60 rounded-md flex items-center gap-2.5 text-xs text-black">
                  <CheckCircleIcon className="w-5 h-5 text-black shrink-0 stroke-[2.2]" />
                  <div>
                    <span className="font-bold block">You have successfully accepted this event!</span>
                    <span className="text-black text-[11px]">Your seat is confirmed as a student volunteer. The Foundation team has recorded your confirmation.</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/5 rounded-md transition cursor-pointer"
                >
                  Close
                </button>

                {(selectedEvent.acceptedStudents || []).some((s: any) => s.email?.toLowerCase() === userEmail.trim().toLowerCase()) ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand/15 text-black font-heading font-bold text-xs border border-brand/60">
                      <CheckCircleIcon className="w-4 h-4 text-black stroke-[2.5]" />
                      <span>Successfully Accepted</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const ev = selectedEvent;
                        setSelectedEvent(null);
                        handleRejectEvent(ev);
                      }}
                      className="px-3 py-2 text-xs text-black/65 hover:text-black transition underline cursor-pointer"
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
                    className="px-5 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition cursor-pointer border border-brand"
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
                    className="px-5 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition cursor-pointer border border-brand flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="bg-white rounded-lg border border-black/15 shadow-sm max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/15 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-brand/15 border border-brand/60 flex items-center justify-center text-black">
                  <IdentificationIcon className="w-5 h-5 text-black stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    Register as Volunteer
                  </h3>
                  <p className="text-[11px] text-black/65">
                    Complete one-time registration to accept and participate in foundation events
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-black/65 hover:text-black font-bold text-sm w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition cursor-pointer"
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
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={volunteerFormData.name}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, name: e.target.value })}
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
                        value="Student Volunteer"
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
                        value={volunteerFormData.email}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, email: e.target.value })}
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
                        value={volunteerFormData.phone}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, phone: e.target.value })}
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
                      value={volunteerFormData.college}
                      onChange={(e) => setVolunteerFormData({ ...volunteerFormData, college: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
                        Department / Branch
                      </label>
                      <input
                        type="text"
                        value={volunteerFormData.department}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-black mb-1">
                        Year of Study
                      </label>
                      <select
                        value={volunteerFormData.yearOfStudy}
                        onChange={(e) => setVolunteerFormData({ ...volunteerFormData, yearOfStudy: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-black/15 bg-black/5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:border-black"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-black mb-1">
                      Volunteering Skills / Interest Areas
                    </label>
                    <input
                      type="text"
                      value={volunteerFormData.skills}
                      onChange={(e) => setVolunteerFormData({ ...volunteerFormData, skills: e.target.value })}
                      placeholder="e.g. Telephonic calling, applicant verification, event registration"
                      className="w-full px-3 py-2 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-3 bg-brand/15 border border-brand/60 rounded-md text-[11px] text-black flex items-start gap-2">
                  <SparklesIcon className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>
                    Once registered, the <strong>Accept</strong> and <strong>Reject</strong> buttons will be enabled on all volunteer event cards.
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
                  disabled={isSubmittingRegistration}
                  className="px-5 py-2.5 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl border border-black/15 shadow-sm max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-brand/15">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-black">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    My Assigned Applicants ({assignedApplicants.length})
                  </h3>
                  <p className="text-xs text-black line-clamp-1">
                    Event: <strong>{assignedEventTitle}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignedModalOpen(false)}
                className="p-1.5 text-black/65 hover:text-black rounded-md hover:bg-black/5 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="p-3 bg-brand/15 border border-brand/60 rounded-md text-xs text-black flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-black shrink-0" />
                <span>
                  Admin approved your assignment! These applicants were matched to you by AI for telephonic verification and mentoring.
                </span>
              </div>

              {isLoadingAssignments ? (
                <div className="p-8 text-center text-black/65 text-xs">
                  Loading your assigned applicants...
                </div>
              ) : assignedApplicants.length === 0 ? (
                <div className="p-8 text-center text-black/65 text-xs bg-black/5 rounded-lg border border-black/15">
                  No applicants assigned yet.
                </div>
              ) : (
                assignedApplicants.map((app: any, idx: number) => (
                  <div
                    key={app.id || app.application_number || idx}
                    className="p-4 rounded-lg bg-white border border-black/15 hover:border-brand transition text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-black text-sm">{app.name}</span>
                          <span className="font-mono text-[10px] bg-black/5 text-black px-2 py-0.5 rounded-md font-semibold">
                            {app.application_number || `#${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-black/65 mt-0.5">
                          {app.district || "Tamil Nadu"} • {app.stream || app.degree || "Higher Secondary"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand/15 text-black border border-brand/60 uppercase">
                        {app.status || "Assigned"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/15 text-xs text-black">
                      {app.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-black/65">Contact:</span>
                          <a
                            href={`tel:${app.phone}`}
                            className="font-mono font-bold text-black hover:text-black transition"
                          >
                            {app.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-black/65">Phone not provided</span>
                      )}

                      {app.match_reason && (
                        <span className="text-[11px] text-black font-medium italic">
                          Match: {app.match_reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-black/15 bg-black/5 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignedModalOpen(false)}
                className="px-5 py-2 rounded-md text-xs font-heading font-bold text-black bg-white hover:bg-black/5 border border-black/15 transition cursor-pointer"
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
