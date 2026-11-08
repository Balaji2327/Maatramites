"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";

export interface EventCardData {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  targetAudience?: string;
  imageUrl?: string;
  status?: "upcoming" | "completed" | "cancelled";
  // Volunteer specific attributes
  mode?: "remote" | "offline";
  studentVolunteersNeeded?: number;
  alumniVolunteersNeeded?: number;
  taskToComplete?: string;
  duration?: string;
  startTime?: string;
  endTime?: string;
  eligibleYears?: string[];
  acceptedStudents?: any[];
  acceptedAlumni?: any[];
  rejectedParticipants?: string[];
  volunteerAssignments?: Record<string, any[]>;
  isRegistered?: boolean;
}

interface EventCardProps {
  event: EventCardData;
  userRole?: "student" | "alumni";
  userEmail?: string;
  isRegisteredVolunteer?: boolean;
  onView?: (event: EventCardData) => void;
  onAccept?: (event: EventCardData) => void;
  onReject?: (event: EventCardData) => void;
  onRegisterVolunteer?: (event?: EventCardData) => void;
  onViewAssignedApplicants?: (event: EventCardData) => void;
}

export default function EventCard({
  event,
  userRole = "student",
  userEmail = "",
  isRegisteredVolunteer = false,
  onView,
  onAccept,
  onReject,
  onRegisterVolunteer,
  onViewAssignedApplicants,
}: EventCardProps) {
  const isRemote = event.mode === "remote";
  const isAlumni = userRole === "alumni";

  const cleanEmail = (userEmail || "").trim().toLowerCase();

  // Acceptance status for this user
  const acceptedList = isAlumni ? (event.acceptedAlumni || []) : (event.acceptedStudents || []);
  const myAcceptedEntry = acceptedList.find(
    (u: any) => u.email?.toLowerCase() === cleanEmail
  );
  const isAcceptedByUser = !!myAcceptedEntry;
  const isAssignmentApproved = !!myAcceptedEntry?.assignment_approved;

  // Rejection status for this user
  const isRejectedByUser = (event.rejectedParticipants || []).includes(cleanEmail);

  // Quotas
  const sAcceptedCount = event.acceptedStudents?.length || 0;
  const sNeededCount = event.studentVolunteersNeeded || 0;
  const aAcceptedCount = event.acceptedAlumni?.length || 0;
  const aNeededCount = event.alumniVolunteersNeeded || 0;

  // First-Come Check for this user's category
  const myAcceptedCount = isAlumni ? aAcceptedCount : sAcceptedCount;
  const myNeededCount = isAlumni ? aNeededCount : sNeededCount;
  const isQuotaFull = !isAcceptedByUser && myNeededCount > 0 && myAcceptedCount >= myNeededCount;

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-[#F7BC0F] transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div
        onClick={() => {
          if (!isRegisteredVolunteer && onRegisterVolunteer) {
            onRegisterVolunteer(event);
          } else {
            onView?.(event);
          }
        }}
        className="cursor-pointer"
      >
        {/* Optional Event Image */}
        {event.imageUrl ? (
          <div className="relative w-full h-44 bg-slate-100 overflow-hidden shrink-0">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span
                className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-2xs backdrop-blur-xs flex items-center gap-1.5 ${
                  isRemote ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {isRemote ? (
                  <>
                    <GlobeAltIcon className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
                    <span>Remote</span>
                  </>
                ) : (
                  <>
                    <MapPinIcon className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
                    <span>Offline</span>
                  </>
                )}
              </span>
            </div>
            <div className="absolute top-3 right-3">
              {isAcceptedByUser ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-xs bg-emerald-600 text-white border-emerald-500 flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Accepted</span>
                </span>
              ) : event.status === "completed" || event.status === "cancelled" ? (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-xs ${
                    event.status === "completed"
                      ? "bg-slate-900/90 text-white border-slate-800"
                      : "bg-red-500/90 text-white border-red-600"
                  }`}
                >
                  {event.status}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="p-5 pb-0 flex items-center justify-between">
            <span
              className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                isRemote
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {isRemote ? (
                <>
                  <GlobeAltIcon className="w-3.5 h-3.5 text-blue-600 stroke-[2.2] shrink-0" />
                  <span>Remote</span>
                </>
              ) : (
                <>
                  <MapPinIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2] shrink-0" />
                  <span>Offline</span>
                </>
              )}
            </span>
            {isAcceptedByUser ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>Accepted</span>
              </span>
            ) : event.status === "completed" || event.status === "cancelled" ? (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  event.status === "completed"
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {event.status}
              </span>
            ) : null}
          </div>
        )}

        {/* Content Details */}
        <div className="p-5 space-y-3">
          <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-amber-900 transition line-clamp-1">
            {event.title}
          </h3>

          <p className="text-xs text-slate-600 font-primary line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Volunteer Task Highlight */}
          {event.taskToComplete && (
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold">Task: </span>
                <span className="line-clamp-1">{event.taskToComplete}</span>
              </div>
            </div>
          )}

          {/* Key Event Details Grid */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
            {/* Remote Duration vs Offline Schedule */}
            {isRemote ? (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-[#F7BC0F] shrink-0 stroke-[2]" />
                <span className="font-medium text-slate-800">
                  Duration: {event.duration || "Self-paced"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-[#F7BC0F] shrink-0 stroke-[2]" />
                <span className="font-medium text-slate-800">{event.date}</span>
                {event.time && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1 text-slate-600">
                      <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Offline Venue Location */}
            {!isRemote && event.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-[#F7BC0F] shrink-0 stroke-[2]" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            {/* Volunteer Quotas (Separate student and alumni counts) */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
              <div
                className={`p-2 rounded-xl border ${
                  !isAlumni
                    ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Students {!isAlumni && "● Your Quota"}
                  </span>
                </div>
                <span className="font-extrabold text-slate-900 font-heading text-xs mt-0.5 block">
                  {sAcceptedCount} / {sNeededCount} <span className="font-normal text-slate-500">accepted</span>
                </span>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isAlumni
                    ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Alumni {isAlumni && "● Your Quota"}
                  </span>
                </div>
                <span className="font-extrabold text-slate-900 font-heading text-xs mt-0.5 block">
                  {aAcceptedCount} / {aNeededCount} <span className="font-normal text-slate-500">accepted</span>
                </span>
              </div>
            </div>

            {/* Eligible Student Years */}
            {event.eligibleYears && event.eligibleYears.length > 0 && (
              <div className="text-[11px] text-slate-500 pt-1">
                <span className="font-bold text-slate-700">Eligible: </span>
                {event.eligibleYears.map((yr) => `Year ${yr}`).join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FOOTER: ACCEPT & REJECT WORKFLOW (ONLY FOR REGISTERED VOLUNTEERS) */}
      {/* ======================================================== */}
      {isRegisteredVolunteer ? (
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100">
          {isAcceptedByUser ? (
            /* User has ACCEPTED */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-heading font-bold border border-emerald-300">
                  <CheckCircleIcon className="w-4 h-4 stroke-[2.2]" />
                  <span>Accepted (Participating)</span>
                </span>

                <button
                  type="button"
                  onClick={() => onReject?.(event)}
                  className="text-xs text-slate-500 hover:text-red-600 transition underline cursor-pointer"
                >
                  Withdraw
                </button>
              </div>

              {/* Assignment Approval Status & View Applicants Button */}
              {isAssignmentApproved ? (
                <div className="pt-1.5 flex items-center justify-between bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-1.5 text-xs text-amber-950 font-semibold">
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-amber-600 stroke-[2.2]" />
                    <span>Admin Approved: {myAcceptedEntry?.assigned_count ?? 10} Applicants Assigned</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAssignedApplicants?.(event);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 text-xs font-heading font-bold transition cursor-pointer shadow-2xs border border-amber-500"
                  >
                    View Applicants
                  </button>
                </div>
              ) : (
                <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-100/70 px-2.5 py-1.5 rounded-xl">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                  <span>Pending Admin Assignment Approval (AI will assign 10 applicants upon approval)</span>
                </div>
              )}
            </div>
          ) : isRejectedByUser ? (
            /* User has REJECTED */
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-heading font-semibold">
                <XCircleIcon className="w-4 h-4 text-slate-400" />
                <span>Declined</span>
              </span>

              {!isQuotaFull && (
                <button
                  type="button"
                  onClick={() => onAccept?.(event)}
                  className="text-xs text-amber-700 font-bold hover:underline transition cursor-pointer"
                >
                  Accept Now
                </button>
              )}
            </div>
          ) : isQuotaFull ? (
            /* Quota is FULL */
            <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-heading font-bold text-center">
              <span>Quota Full ({myNeededCount}/{myNeededCount} First-Come Seats Filled)</span>
            </div>
          ) : (
            /* ACCEPT & REJECT BUTTONS (AVAILABLE TO PARTICIPATE) */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAccept?.(event)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 border border-[#e5ad0c] text-xs font-heading font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1"
              >
                <CheckCircleIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Accept Event</span>
              </button>

              <button
                type="button"
                onClick={() => onReject?.(event)}
                className="py-2 px-3 rounded-xl bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-heading font-semibold transition cursor-pointer"
              >
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* When NOT registered: only event alone is shown, no accept and reject show */
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onRegisterVolunteer) {
              onRegisterVolunteer(event);
            } else {
              onView?.(event);
            }
          }}
          className="px-5 py-3 bg-amber-50/50 hover:bg-amber-100/70 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-950 font-semibold cursor-pointer transition group/hint"
        >
          <span className="flex items-center gap-1.5">
            <IdentificationIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Click to register as volunteer</span>
          </span>
          <span className="text-amber-800 font-bold text-[11px] group-hover/hint:translate-x-0.5 transition-transform">&rarr;</span>
        </div>
      )}
    </div>
  );
}
