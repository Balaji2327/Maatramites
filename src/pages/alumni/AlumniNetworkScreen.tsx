"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  LinkIcon,
  XMarkIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import { studentApi } from "../../lib/api";

interface AlumniMember {
  id: string;
  name: string;
  batch: string;
  degree: string;
  college: string;
  company: string;
  role: string;
  location: string;
  experience?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  industry?: string;
  rollNumber?: string;
}

interface AlumniNetworkScreenProps {
  sectionRole?: "student" | "alumni";
}

const alumniCacheKey = "maatram_student_alumni_directory";

const mapAlumniRecords = (records: any[]): AlumniMember[] =>
  records.map((item: any) => ({
    id: item.id || item.user_id,
    name: item.full_name || "Alumni Scholar",
    batch: item.grad_batch?.replace("Class of ", "") || item.metadata?.grad_batch?.replace("Class of ", "") || "2021",
    degree: item.grad_degree || item.metadata?.grad_degree || "Engineering",
    college: item.grad_college || item.metadata?.grad_college || "Affiliated College",
    company: item.company || item.metadata?.company || "Leading Organization",
    role: item.designation || item.metadata?.designation || "Professional",
    experience: item.experience_years || item.metadata?.experience_years || "",
    location: item.current_city || item.metadata?.current_city || "Chennai, Tamil Nadu",
    email: item.email,
    phone: item.phone || item.whatsapp || item.metadata?.phone || item.metadata?.whatsapp || "",
    linkedin: item.linkedin || item.metadata?.linkedin || "",
    industry: item.industry_domain || item.metadata?.industry_domain || "",
    rollNumber: item.roll_number || item.metadata?.roll_number || "",
  }));

export default function AlumniNetworkScreen({ sectionRole = "student" }: AlumniNetworkScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [alumniList, setAlumniList] = useState<AlumniMember[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMember | null>(null);

  // Fetch real alumni records exclusively from the backend database
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(alumniCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setAlumniList(parsed);
      }
    } catch (err) {
      console.warn("Could not restore cached alumni directory:", err);
    }

    const fetchRealAlumni = async () => {
      try {
        const res = await studentApi.getAlumni();
        if (res && res.success && Array.isArray(res.data)) {
          const mapped = mapAlumniRecords(res.data);
          setAlumniList(mapped);
          try {
            sessionStorage.setItem(alumniCacheKey, JSON.stringify(mapped));
          } catch (err) {
            console.warn("Could not cache alumni directory:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching alumni from backend:", err);
      }
    };

    fetchRealAlumni();
  }, []);

  const filteredAlumni = useMemo(() => {
    return alumniList.filter((alu) => {
      return (
        !searchTerm.trim() ||
        alu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alu.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alu.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alu.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alu.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alu.email && alu.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [alumniList, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Sidebar configured for student or alumni role */}
      <StudentSidebar activeTab="network" sectionRole={sectionRole} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Maatram Alumni Directory
              </h1>
              <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                Verified Maatram Foundation alumni database and professional network.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Registered Alumni: <span className="font-bold text-slate-900">{alumniList.length}</span>
            </div>
          </div>

          {/* Search Bar Section */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alumni by name, company, role, or college..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/20 transition"
              />
            </div>
          </section>

          {/* Alumni Table (Normal List View instead of Cards Grid) */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-heading text-[11px] uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3.5 px-5">Alumni Scholar</th>
                    <th className="py-3.5 px-4">Role & Organization</th>
                    <th className="py-3.5 px-4">College & Graduation</th>
                    <th className="py-3.5 px-4">Location & Contact</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAlumni.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <AcademicCapIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                        <p className="text-sm font-semibold text-slate-600">No Alumni Records Found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          No registered alumni found matching your criteria.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAlumni.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition">
                        {/* Alumni Scholar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-900 font-heading font-black flex items-center justify-center text-xs shrink-0">
                              {a.name?.charAt(0) || "A"}
                            </div>
                            <div>
                              <p className="font-heading font-bold text-slate-900 text-xs sm:text-sm">{a.name}</p>
                              {a.rollNumber && (
                                <span className="font-mono text-[10px] text-slate-400">{a.rollNumber}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role & Organization */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <BuildingOffice2Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{a.company}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {a.role} {a.experience ? `• ${a.experience}` : ""}
                          </p>
                        </td>

                        {/* College & Degree */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{a.college}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mr-1.5">
                              Batch {a.batch}
                            </span>
                            {a.degree}
                          </p>
                        </td>

                        {/* Location & Contact */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {a.location}
                          </span>
                          {a.email && (
                            <a
                              href={`mailto:${a.email}`}
                              className="text-slate-500 hover:text-amber-600 flex items-center gap-1 font-mono text-[11px] mt-0.5 truncate max-w-[200px]"
                            >
                              <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{a.email}</span>
                            </a>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedAlumni(a)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-slate-700 bg-slate-100 hover:bg-[#F7BC0F] hover:text-slate-950 transition cursor-pointer"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Alumni Details Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-heading font-black flex items-center justify-center text-sm">
                  {selectedAlumni.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">{selectedAlumni.name}</h3>
                  {selectedAlumni.rollNumber && (
                    <p className="text-xs text-slate-400 font-mono">{selectedAlumni.rollNumber}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlumni(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Organization & Role</p>
                <p className="font-heading font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <BuildingOffice2Icon className="w-4 h-4 text-emerald-600" />
                  {selectedAlumni.company}
                </p>
                <p className="text-slate-700 font-semibold">{selectedAlumni.role} {selectedAlumni.experience ? `• ${selectedAlumni.experience}` : ""}</p>
                {selectedAlumni.industry && <p className="text-slate-500">{selectedAlumni.industry}</p>}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Graduation & College</p>
                <p className="font-semibold text-slate-800">{selectedAlumni.college}</p>
                <p className="text-slate-600">{selectedAlumni.degree} (Batch {selectedAlumni.batch})</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact & Location</p>
                {selectedAlumni.email && (
                  <p className="text-slate-800 flex items-center gap-2 font-mono">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                    {selectedAlumni.email}
                  </p>
                )}
                {selectedAlumni.phone && (
                  <p className="text-slate-800 flex items-center gap-2">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                    {selectedAlumni.phone}
                  </p>
                )}
                <p className="text-slate-600 flex items-center gap-2">
                  <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                  {selectedAlumni.location}
                </p>
                {selectedAlumni.linkedin && (
                  <p className="text-blue-600 font-mono text-[11px] pt-1 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{selectedAlumni.linkedin}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => alert(`Message request sent to ${selectedAlumni.name}!`)}
                className="px-4 py-2 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-2xs"
              >
                Connect / Message
              </button>
              <button
                type="button"
                onClick={() => setSelectedAlumni(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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
