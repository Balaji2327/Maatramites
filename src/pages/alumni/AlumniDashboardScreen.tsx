"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Sidebar configured for Alumni section */}
      <StudentSidebar activeTab="dashboard" sectionRole="alumni" studentName={alumniName} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-7 flex-1">
          {/* Header Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-950 font-heading font-black text-xs rounded-full border border-amber-300">
                  ★ Maatram Alumni Chapter
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  MF-ALU-2021-008
                </span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Welcome, {alumniName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {currentCompany} • {alumniBatch}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
              <Link
                href="/alumni/posts"
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-heading font-bold text-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-600" />
                <span>Posts & Referrals</span>
              </Link>
              <Link
                href="/alumni/network"
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-heading font-bold text-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <UserGroupIcon className="w-4 h-4 text-slate-600" />
                <span>Alumni Network</span>
              </Link>
              <Link
                href="/alumni/events"
                className="px-3.5 py-2.5 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 rounded-xl text-xs font-heading font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CalendarDaysIcon className="w-4 h-4 stroke-[2.2]" />
                <span>Alumni Events</span>
              </Link>
            </div>

            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-10 translate-y-10">
              <Image src="/assets/images/logo.png" alt="Maatram" width={300} height={300} />
            </div>
          </div>

          {/* Alumni Impact Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Junior Scholars Mentored
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-2xl text-slate-900">4 Scholars</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-1">SVCE & SSN Colleges</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Job Referrals Offered
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-2xl text-slate-900">12 Referrals</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Zoho, TCS & Cognizant</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Alumni Network Size
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-2xl text-slate-900">1,840+</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Across 12 Countries</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-heading font-black uppercase text-slate-400 tracking-wider">
                Giving Back Drive
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading font-black text-lg text-slate-900">Active Supporter</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Sponsoring Laptop Fund</p>
            </div>
          </div>

          {/* Giving Back & Mentorship Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mentorship Opportunities */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-amber-600 stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Mentorship for Final-Year Scholars
                  </h3>
                </div>
                <Link
                  href="/alumni/network"
                  className="text-xs font-bold text-slate-800 hover:text-[#F7BC0F] hover:underline flex items-center gap-1"
                >
                  <span>View All Mentees</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Aravindhan K (B.Tech IT, Final Year)</h4>
                    <p className="text-slate-500 text-[11px]">Preparing for Zoho & Freshworks technical interviews</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl font-bold text-[10px]">
                    Mentee Active
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Deepa S (B.E ECE, 3rd Year)</h4>
                    <p className="text-slate-500 text-[11px]">Embedded systems & IoT projects guidance</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl font-bold text-[10px]">
                    Mentee Active
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Alumni Meets */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-amber-600 stroke-[2]" />
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Alumni Gatherings & Reunion
                  </h3>
                </div>
                <Link
                  href="/alumni/events"
                  className="text-xs font-bold text-slate-800 hover:text-[#F7BC0F] hover:underline flex items-center gap-1"
                >
                  <span>Calendar</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Maatram Alumni Annual Summit 2026</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold">18th Dec 2026</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">ITC Grand Chola, Chennai • Networking dinner & keynote</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Virtual Tech Talk: Scaling AI Workloads</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md font-bold">Online</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Host: Sundararaman (Zoho) & Priya (Google Cloud)</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
