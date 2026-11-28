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
    <div className="group @container min-w-0 bg-white rounded-lg border border-black/15 hover:shadow-sm transition-shadow flex flex-col justify-between overflow-hidden">
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
        <header className="space-y-4 border-b border-black/15 bg-black/5 p-5">
        {event.imageUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex items-center gap-1.5">
              <span
                className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                  isRemote ? "bg-black text-white" : "bg-black text-white"
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
            <div className="relative">
              {isAcceptedByUser ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-black text-white border-brand flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Accepted</span>
                </span>
              ) : event.status === "completed" || event.status === "cancelled" ? (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    event.status === "completed"
                      ? "bg-black/90 text-white border-black"
                      : "bg-black/90 text-white border-brand"
                  }`}
                >
                  {event.status}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                isRemote
                  ? "bg-brand/15 text-black border-brand/60"
                  : "bg-brand/15 text-black border-brand/60"
              }`}
            >
              {isRemote ? (
                <>
                  <GlobeAltIcon className="w-3.5 h-3.5 text-black stroke-[2.2] shrink-0" />
                  <span>Remote</span>
                </>
              ) : (
                <>
                  <MapPinIcon className="w-3.5 h-3.5 text-black stroke-[2.2] shrink-0" />
                  <span>Offline</span>
                </>
              )}
            </span>
            {isAcceptedByUser ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border bg-brand/15 text-black border-brand/60 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>Accepted</span>
              </span>
            ) : event.status === "completed" || event.status === "cancelled" ? (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                  event.status === "completed"
                    ? "bg-black/5 text-black border-black/15"
                    : "bg-brand/15 text-black border-brand/60"
                }`}
              >
                {event.status}
              </span>
            ) : null}
          </div>
        )}
          <div className="flex items-center gap-4">
            {event.imageUrl && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-black/5">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              unoptimized
              sizes="80px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-heading font-bold text-xl leading-tight tracking-tight text-black break-words">
            {event.title}
          </h3>
              <div className="grid gap-1.5 text-xs text-black">
            {/* Remote Duration vs Offline Schedule */}
            {isRemote ? (
              <div className="flex flex-wrap items-center gap-2">
                <ClockIcon className="w-4 h-4 text-brand shrink-0 stroke-[2]" />
                <span className="font-medium text-black">
                  Duration: {event.duration || "Self-paced"}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-brand shrink-0 stroke-[2]" />
                <span className="font-medium text-black">{event.date}</span>
                {event.time && (
                  <>
                    <span className="text-black/65">•</span>
                    <div className="flex items-center gap-1 text-black">
                      <ClockIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Offline Venue Location */}
            {!isRemote && event.location && (
              <div className="flex flex-wrap items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-brand shrink-0 stroke-[2]" />
                <span className="break-words">{event.location}</span>
              </div>
            )}
              </div>
            </div>
          </div>
        </header>
        <div className="grid gap-4 p-5 @min-[30rem]:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="min-w-0 space-y-3">
          <p className="text-sm text-black font-primary leading-relaxed break-words">
            {event.description}
          </p>
          {/* Volunteer Task Highlight */}
          {event.taskToComplete && (
            <div className="px-3 py-2.5 rounded-r-lg bg-brand/15 border-l-[3px] border-brand text-xs text-black flex items-start gap-2">
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold">Task: </span>
                <span className="break-words">{event.taskToComplete}</span>
              </div>
            </div>
          )}
          </div>
          <section aria-label="Volunteer places" className="space-y-2 border-t border-black/15 pt-3 @min-[30rem]:border-l @min-[30rem]:border-t-0 @min-[30rem]:pl-4 @min-[30rem]:pt-0">
            {/* Volunteer Quotas (Separate student and alumni counts) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`p-2 rounded-md border ${
                  !isAlumni
                    ? "bg-brand/15 border-brand/60 ring-1 ring-brand/40"
                    : "bg-black/5 border-black/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-black/65 font-bold uppercase">
                    Students {!isAlumni && "● Your Quota"}
                  </span>
                </div>
                <span className="font-bold text-black font-heading text-base mt-0.5 block">
                  {sAcceptedCount} / {sNeededCount} <span className="font-normal text-black/65">accepted</span>
                </span>
              </div>

              <div
                className={`p-2 rounded-md border ${
                  isAlumni
                    ? "bg-brand/15 border-brand/60 ring-1 ring-brand/40"
                    : "bg-black/5 border-black/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-black/65 font-bold uppercase">
                    Alumni {isAlumni && "● Your Quota"}
                  </span>
                </div>
                <span className="font-bold text-black font-heading text-base mt-0.5 block">
                  {aAcceptedCount} / {aNeededCount} <span className="font-normal text-black/65">accepted</span>
                </span>
              </div>
            </div>
            {/* Eligible Student Years */}
            {event.eligibleYears && event.eligibleYears.length > 0 && (
              <div className="text-[11px] text-black/65 pt-1">
                <span className="font-bold text-black">Eligible: </span>
                {event.eligibleYears.map((yr) => `Year ${yr}`).join(", ")}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FOOTER: ACCEPT & REJECT WORKFLOW (ONLY FOR REGISTERED VOLUNTEERS) */}
      {/* ======================================================== */}
      {isRegisteredVolunteer ? (
        <div className="px-5 py-3.5 bg-black/5 border-t border-black/15">
          {isAcceptedByUser ? (
            /* User has ACCEPTED */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand/15 text-black text-xs font-heading font-bold border border-brand/60">
                  <CheckCircleIcon className="w-4 h-4 stroke-[2.2]" />
                  <span>Accepted (Participating)</span>
                </span>

                <button
                  type="button"
                  onClick={() => onReject?.(event)}
                  className="text-xs text-black/65 hover:text-black transition underline cursor-pointer"
                >
                  Withdraw
                </button>
              </div>

              {/* Assignment Approval Status & View Applicants Button */}
              {isAssignmentApproved ? (
                <div className="pt-1.5 flex items-center justify-between bg-brand/15 p-2.5 rounded-md border border-brand/60">
                  <div className="flex items-center gap-1.5 text-xs text-black font-semibold">
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-black stroke-[2.2]" />
                    <span>Admin Approved: {myAcceptedEntry?.assigned_count ?? 10} Applicants Assigned</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAssignedApplicants?.(event);
                    }}
                    className="px-3 py-1 rounded-lg bg-brand hover:brightness-95 text-black text-xs font-heading font-bold transition cursor-pointer border border-brand"
                  >
                    View Applicants
                  </button>
                </div>
              ) : null}
            </div>
          ) : isRejectedByUser ? (
            /* User has REJECTED */
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-black/5 text-black text-xs font-heading font-semibold">
                <XCircleIcon className="w-4 h-4 text-black/65" />
                <span>Declined</span>
              </span>

              {!isQuotaFull && (
                <button
                  type="button"
                  onClick={() => onAccept?.(event)}
                  className="text-xs text-black font-bold hover:underline transition cursor-pointer"
                >
                  Accept Now
                </button>
              )}
            </div>
          ) : isQuotaFull ? (
            /* Quota is FULL */
            <div className="w-full py-2 px-3 rounded-md bg-black/5 text-black/65 border border-black/15 text-xs font-heading font-bold text-center">
              <span>Quota Full ({myNeededCount}/{myNeededCount} First-Come Seats Filled)</span>
            </div>
          ) : (
            /* ACCEPT & REJECT BUTTONS (AVAILABLE TO PARTICIPATE) */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAccept?.(event)}
                className="flex-1 py-2 px-3 rounded-md bg-brand hover:brightness-95 text-black border border-brand text-xs font-heading font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircleIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Accept Event</span>
              </button>

              <button
                type="button"
                onClick={() => onReject?.(event)}
                className="py-2 px-3 rounded-md bg-white hover:bg-brand/15 text-black hover:text-black border border-black/15 hover:border-brand/60 text-xs font-heading font-semibold transition cursor-pointer"
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
          className="px-5 py-3 bg-brand/15 hover:bg-brand/15 border-t border-brand/60 flex items-center justify-between text-xs text-black font-semibold cursor-pointer transition group/hint"
        >
          <span className="flex items-center gap-1.5">
            <IdentificationIcon className="w-4 h-4 text-black shrink-0" />
            <span>Click to register as volunteer</span>
          </span>
          <span className="text-black font-bold text-[11px] group-hover/hint:translate-x-0.5 transition-transform">&rarr;</span>
        </div>
      )}
    </div>
  );
}
