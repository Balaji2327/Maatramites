"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import AskMarkBot from "./AskMarkBot";
import SignOutModal from "./SignOutModal";

export type StudentNavTab =
  | "dashboard"
  | "events"
  | "academic"
  | "posts"
  | "volunteer"
  | "settings"
  | "network";

interface StudentSidebarProps {
  activeTab?: StudentNavTab;
  onTabChange?: (tab: StudentNavTab) => void;
  sectionRole?: "student" | "alumni";
  onSectionRoleChange?: (role: "student" | "alumni") => void;
  studentName?: string;
}

export default function StudentSidebar({
  activeTab,
  onTabChange,
  sectionRole = "student",
  onSectionRoleChange,
  studentName = "Scholar",
}: StudentSidebarProps) {
  const pathname = usePathname();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Auto-detect role from URL if not explicitly provided
  const isAlumni = sectionRole === "alumni" || pathname?.startsWith("/alumni");

  // Auto-detect active tab from current URL pathname
  const currentTab: StudentNavTab = activeTab || (
    pathname?.includes("/settings")
      ? "settings"
      : pathname?.includes("/volunteer")
      ? "volunteer"
      : pathname?.includes("/events")
      ? "events"
      : pathname?.includes("/academic")
      ? "academic"
      : pathname?.includes("/network")
      ? "network"
      : pathname?.includes("/posts")
      ? "posts"
      : pathname?.includes("/alumni-network") || pathname?.includes("/student/alumni")
      ? "network"
      : "dashboard"
  );

  // Student Section Navigation Items
  const studentNavItems = [
    {
      id: "dashboard" as StudentNavTab,
      label: "DASHBOARD",
      href: "/student/dashboard",
      icon: Squares2X2Icon,
    },
    {
      id: "academic" as StudentNavTab,
      label: "ACADEMIC",
      href: "/student/academic",
      icon: AcademicCapIcon,
    },
    {
      id: "events" as StudentNavTab,
      label: "EVENTS",
      href: "/student/events",
      icon: CalendarDaysIcon,
    },
    {
      id: "posts" as StudentNavTab,
      label: "POSTS",
      href: "/student/posts",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: "volunteer" as StudentNavTab,
      label: "VOLUNTEER",
      href: "/student/volunteer",
      icon: UserGroupIcon,
    },
    {
      id: "network" as StudentNavTab,
      label: "ALUMNI",
      href: "/student/alumni",
      icon: UserGroupIcon,
    },
  ];

  // Alumni Section Navigation Items
  const alumniNavItems = [
    {
      id: "dashboard" as StudentNavTab,
      label: "DASHBOARD",
      href: "/alumni/dashboard",
      icon: Squares2X2Icon,
    },
    {
      id: "events" as StudentNavTab,
      label: "EVENTS",
      href: "/alumni/events",
      icon: CalendarDaysIcon,
    },
    {
      id: "network" as StudentNavTab,
      label: "NETWORK",
      href: "/alumni/network",
      icon: UserGroupIcon,
    },
    {
      id: "posts" as StudentNavTab,
      label: "POSTS",
      href: "/alumni/posts",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: "volunteer" as StudentNavTab,
      label: "VOLUNTEER",
      href: "/alumni/volunteer",
      icon: UserGroupIcon,
    },
  ];

  const mainNavItems = isAlumni ? alumniNavItems : studentNavItems;
  const settingsHref = isAlumni ? "/alumni/settings" : "/student/settings";

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("maatram_student_token");
      localStorage.removeItem("maatram_student_user");
      window.location.href = "/login";
    }
  };


  return (
    <>
      <aside className="w-[72px] bg-white text-slate-800 shrink-0 flex flex-col justify-between border-r border-slate-200/90 min-h-screen shadow-2xs sticky top-0 h-screen select-none z-30">
        {/* Top Branding Section & Nav */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top App Logo Box */}
          <div className="h-16 border-b border-slate-100 flex items-center justify-center p-2 shrink-0">
            <Link
              href={isAlumni ? "/alumni/dashboard" : "/student/dashboard"}
              className="flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
              title="Maatram Foundation"
            >
              <Image
                src="/assets/images/logo.png"
                alt="Maatram"
                width={40}
                height={40}
                priority
                className="w-9 h-9 object-contain"
              />
            </Link>
          </div>

          {/* Vertical Icon + Subtitle Navigation List */}
          <nav className="py-2 overflow-y-auto flex-1 flex flex-col items-center gap-0.5 scrollbar-none">
            {mainNavItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              const activeBg = "bg-amber-50/80";
              const activeText = "text-amber-800";
              const activeBar = "bg-[#F7BC0F]";

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onTabChange?.(item.id)}
                  className={`group relative w-full flex flex-col items-center justify-center py-2 px-1 transition-colors cursor-pointer ${
                    isActive
                      ? `${activeBg} ${activeText}`
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-50"
                  }`}
                  title={item.label}
                >
                  {/* Active Right Indicator Bar */}
                  {isActive && (
                    <span className={`absolute right-0 top-0 bottom-0 w-[3px] ${activeBar} rounded-l`} />
                  )}

                  {/* Icon */}
                  <Icon
                    className={`w-5 h-5 stroke-[1.8] transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? activeText : "text-slate-900"
                    }`}
                  />

                  {/* All-Caps Label Underneath */}
                  <span
                    className={`text-[8px] font-mono font-extrabold tracking-tight mt-1 uppercase text-center leading-tight line-clamp-1 max-w-[68px] ${
                      isActive ? `${activeText} font-black` : "text-slate-800"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section (Settings & Sign Out) */}
        <div className="border-t border-slate-100 flex flex-col items-center py-1.5 shrink-0">
          {/* Settings Tab */}
          <Link
            href={settingsHref}
            onClick={() => onTabChange?.("settings")}
            className={`group relative w-full flex flex-col items-center justify-center py-2 px-1 transition-colors cursor-pointer ${
              currentTab === "settings"
                ? "bg-amber-50/80 text-amber-800"
                : "text-slate-700 hover:text-slate-950 hover:bg-slate-50"
            }`}
            title="Settings"
          >
            {currentTab === "settings" && (
              <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#F7BC0F] rounded-l" />
            )}
            <Cog6ToothIcon
              className={`w-5 h-5 stroke-[1.8] transition-transform duration-200 group-hover:scale-110 ${
                currentTab === "settings" ? "text-amber-800" : "text-slate-900"
              }`}
            />
            <span
              className={`text-[8px] font-mono font-extrabold tracking-tight mt-1 uppercase text-center leading-tight ${
                currentTab === "settings" ? "text-amber-800 font-black" : "text-slate-800"
              }`}
            >
              SETTINGS
            </span>
          </Link>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => setIsSignOutModalOpen(true)}
            className="group w-full flex flex-col items-center justify-center py-2 px-1 text-slate-500 hover:text-red-600 hover:bg-red-50/60 transition cursor-pointer mt-0.5"
            title="Sign Out"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4 stroke-[2] text-slate-600 group-hover:text-red-600 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[8px] font-mono font-extrabold tracking-tight mt-1 uppercase text-center text-slate-600 group-hover:text-red-600">
              LOGOUT
            </span>
          </button>
        </div>

        {/* Floating Ask Mark AI Bot */}
        <AskMarkBot />
      </aside>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
        title="Sign Out Confirmation"
        description={`Are you sure you want to sign out of the Maatram ${isAlumni ? "Alumni" : "Scholar"} Portal?`}
      />
    </>
  );
}
