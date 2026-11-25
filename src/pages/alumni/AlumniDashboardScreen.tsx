"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  UserGroupIcon,
  BriefcaseIcon,
  HeartIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";

export default function AlumniDashboardScreen() {
  const alumniName = "Sundararaman M";
  const alumniBatch = "Batch of 2021 • B.E Computer Science";
  const currentCompany = "Zoho Corporation • Senior Software Engineer";

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Sidebar configured for Alumni section */}
      <StudentSidebar activeTab="dashboard" sectionRole="alumni" studentName={alumniName} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-7 flex-1">
          {/* Header Banner */}
          <div className="border-b border-black/20 pb-6 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-brand/15 text-black font-heading font-bold text-xs rounded-md border border-brand/60">
                  Maatram Alumni Chapter
                </span>
                <span className="text-xs font-mono font-bold text-black/65">
                  MF-ALU-2021-008
                </span>
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                {alumniName}
              </h1>
              <p className="text-xs sm:text-sm text-black font-medium">
                {currentCompany} • {alumniBatch}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
              <Link
                href="/alumni/posts"
                className="px-3.5 py-2.5 bg-black/5 hover:bg-black/10 border border-black/15 rounded-md text-xs font-heading font-bold text-black transition cursor-pointer flex items-center gap-1.5"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-black" />
                <span>Posts & Referrals</span>
              </Link>
              <Link
                href="/alumni/network"
                className="px-3.5 py-2.5 bg-black/5 hover:bg-black/10 border border-black/15 rounded-md text-xs font-heading font-bold text-black transition cursor-pointer flex items-center gap-1.5"
              >
                <UserGroupIcon className="w-4 h-4 text-black" />
                <span>Alumni Network</span>
              </Link>
              <Link
                href="/alumni/events"
                className="px-3.5 py-2.5 bg-brand hover:brightness-95 text-black rounded-md text-xs font-heading font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <CalendarDaysIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Alumni Events</span>
              </Link>
            </div>


          </div>

          {/* Alumni Impact Stats */}
          <div className="summary-strip grid grid-cols-2 lg:grid-cols-4">
            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Junior Scholars Mentored
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-2xl text-black">4 Scholars</span>
              </div>
              <p className="text-[11px] text-black font-medium mt-1">SVCE & SSN Colleges</p>
            </div>

            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Job Referrals Offered
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-2xl text-black">12 Referrals</span>
              </div>
              <p className="text-[11px] text-black/65 mt-1">Zoho, TCS & Cognizant</p>
            </div>

            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Alumni Network Size
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-2xl text-black">1,840+</span>
              </div>
              <p className="text-[11px] text-black/65 mt-1">Across 12 Countries</p>
            </div>

            <div className="bg-white border border-black/15 rounded-lg p-5">
              <span className="text-[10px] font-heading font-bold uppercase text-black/65 tracking-wider">
                Giving Back Drive
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-bold text-lg text-black">Active Supporter</span>
              </div>
              <p className="text-[11px] text-black/65 mt-1">Sponsoring Laptop Fund</p>
            </div>
          </div>

          {/* Giving Back & Mentorship Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mentorship Opportunities */}
            <div className="bg-white border border-black/15 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/15">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-black stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-black">
                    Mentorship for Final-Year Scholars
                  </h3>
                </div>
                <Link
                  href="/alumni/network"
                  className="text-xs font-bold text-black hover:text-brand hover:underline flex items-center gap-1"
                >
                  <span>View All Mentees</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-black/5 rounded-lg border border-black/15 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-black">Aravindhan K (B.Tech IT, Final Year)</h4>
                    <p className="text-black/65 text-[11px]">Preparing for Zoho & Freshworks technical interviews</p>
                  </div>
                  <span className="px-2.5 py-1 bg-brand/15 text-black rounded-md font-bold text-[10px]">
                    Mentee Active
                  </span>
                </div>

                <div className="p-3.5 bg-black/5 rounded-lg border border-black/15 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-black">Deepa S (B.E ECE, 3rd Year)</h4>
                    <p className="text-black/65 text-[11px]">Embedded systems & IoT projects guidance</p>
                  </div>
                  <span className="px-2.5 py-1 bg-brand/15 text-black rounded-md font-bold text-[10px]">
                    Mentee Active
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Alumni Meets */}
            <div className="bg-white border border-black/15 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/15">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-black stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-black">
                    Alumni Gatherings & Reunion
                  </h3>
                </div>
                <Link
                  href="/alumni/events"
                  className="text-xs font-bold text-black hover:text-brand hover:underline flex items-center gap-1"
                >
                  <span>Calendar</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-black/5 rounded-lg border border-black/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">Maatram Alumni Annual Summit 2026</span>
                    <span className="text-[10px] px-2 py-0.5 bg-brand/15 text-black rounded-md font-bold">18th Dec 2026</span>
                  </div>
                  <p className="text-black text-[11px]">ITC Grand Chola, Chennai • Networking dinner & keynote</p>
                </div>

                <div className="p-3.5 bg-black/5 rounded-lg border border-black/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">Virtual Tech Talk: Scaling AI Workloads</span>
                    <span className="text-[10px] px-2 py-0.5 bg-black/10 text-black rounded-md font-bold">Online</span>
                  </div>
                  <p className="text-black/65 text-[11px]">Host: Sundararaman (Zoho) & Priya (Google Cloud)</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
