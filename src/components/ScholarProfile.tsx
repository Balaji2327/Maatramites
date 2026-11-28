"use client";

import { useEffect, useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { apiClient } from "../lib/api";

type Sibling = Record<string, string | number>;
type EditValue = string | boolean | Sibling[];
type Profile = { sections: Record<string, string>; readOnly: string[]; values: Record<string, unknown> };

function label(key: string) {
  if (key.startsWith("marksheet_")) return key.replace("marksheet_", "Semester ").replace(/_/g, " ");
  const text = key.replace(/^document/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Value({ value }: { value: unknown }) {
  if (Array.isArray(value)) return <ul className="space-y-1">{value.map((item, i) => <li key={i}><Value value={item} /></li>)}</ul>;
  if (value && typeof value === "object") return <dl>{Object.entries(value).filter(([key]) => key !== "id").map(([key, v]) => <div key={key}>{label(key)}: <Value value={v} /></div>)}</dl>;
  return <>{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value ?? "")}</>;
}

export default function ScholarProfile({ endpoint }: { endpoint: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Record<string, EditValue>>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    setProfile(null);
    setDraft({});
    setEditingSection(null);
    setSavedSection(null);
    setMessage("");
    apiClient.get(endpoint).then(({ data }) => {
      if (active) setProfile(data.data);
    }).catch(() => { if (active) setMessage("Could not load the student profile. Reopen the profile to retry."); });
    return () => { active = false; };
  }, [endpoint]);

  async function download(key: string) {
    try {
      const { data } = await apiClient.get(endpoint + "/marksheets/" + encodeURIComponent(key), { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      const ext = data.type === "application/pdf" ? "pdf" : data.type === "image/png" ? "png" : "jpg";
      link.download = key + "." + ext;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setMessage("Could not retrieve the marksheet."); }
  }

  async function save(section: string, sectionKeys: string[]) {
    setSaving(true);
    setMessage("");
    const sectionChanges: Record<string, EditValue> = {};
    for (const k of sectionKeys) {
      if (k in draft) sectionChanges[k] = draft[k];
    }
    if (Object.keys(sectionChanges).length === 0) {
      setSaving(false);
      setEditingSection(null);
      return;
    }
    try {
      const { data } = await apiClient.patch(endpoint, { changes: sectionChanges });
      setProfile(data.data);
      setDraft((prev) => {
        const next = { ...prev };
        for (const k of sectionKeys) delete next[k];
        return next;
      });
      setEditingSection(null);
      setSavedSection(section);
      setTimeout(() => setSavedSection((curr) => (curr === section ? null : curr)), 3500);
    } catch {
      setMessage("Could not save the profile. Your edits are still here.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit(sectionKeys: string[]) {
    setDraft((prev) => {
      const next = { ...prev };
      for (const k of sectionKeys) delete next[k];
      return next;
    });
    setMessage("");
    setEditingSection(null);
  }

  if (!profile) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4">
          <h2 className="font-heading font-bold text-sm text-black">Scholar Profile</h2>
          <p className="font-primary text-xs text-black/65 mt-1">
            Your academic, personal, and family details linked to Maatram Foundation.
          </p>
        </div>
        <div className="lg:col-span-8 bg-white border border-black/15 rounded-xl p-6 lg:p-7">
          <p role="status" className="text-xs text-black/65 font-medium">
            {message || "Loading student profile..."}
          </p>
        </div>
      </div>
    );
  }

  const sectionDescriptions: Record<string, string> = {
    "College and enrollment": "Your college, degree branch, current year, and roll number.",
    "Personal details": "Your personal contact, identity, and demographic details.",
    "Family details": "Parent/guardian and household income information.",
    "Siblings": "Details of siblings and their current education.",
    "Address": "Permanent and current residential address details.",
    "Schooling": "10th, 11th, and 12th academic records.",
    "Semester marksheets": "Uploaded college semester marksheets.",
    "Application documents": "Supporting documents submitted with your application.",
  };

  return (
    <div className="space-y-8">
      {Object.entries(profile.sections).map(([section, keys]) => {
        const keyList = keys.split(" ").filter(Boolean);
        const isActionableSection =
          section !== "Semester marksheets" &&
          section !== "Application documents" &&
          keyList.some((k) => !profile.readOnly.includes(k));
        const isEditing = editingSection === section;

        return (
          <div key={section} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <h2 className="font-heading font-bold text-sm text-black">{section}</h2>
              <p className="font-primary text-xs text-black/65 mt-1">
                {sectionDescriptions[section] || `View and manage your ${section.toLowerCase()}.`}
              </p>
            </div>

            <div className="lg:col-span-8 bg-white border border-black/15 rounded-xl p-6 lg:p-7 space-y-4">
              {/* Card Header with Edit Button (matching Alumni Settings) */}
              <div className="flex items-center justify-between pb-3 border-b border-black/15">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-black">{section}</span>
                  {savedSection === section && (
                    <span className="text-[11px] font-bold text-black bg-brand/15 px-2.5 py-0.5 rounded-md border border-brand/60 animate-in fade-in">
                      Saved
                    </span>
                  )}
                </div>

                {isActionableSection && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (isEditing) {
                        cancelEdit(keyList);
                      } else {
                        setMessage("");
                        setEditingSection(section);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading font-bold transition cursor-pointer border ${
                      isEditing
                        ? "bg-brand/15 text-black border-brand/60"
                        : "bg-black/5 hover:bg-black/10 text-black border-black/15"
                    }`}
                    title={isEditing ? "Cancel editing" : "Click to Edit"}
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-brand" />
                    <span>{isEditing ? "Editing" : "Edit"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {keyList.map((key) => {
                  const value = draft[key] ?? profile.values[key];
                  const change = (next: EditValue) => {
                    setMessage("");
                    setDraft((prev) => ({ ...prev, [key]: next }));
                  };
                  if (key === "siblings") {
                    const siblings: Sibling[] = Array.isArray(value) ? value : [];
                    return (
                      <fieldset className="sm:col-span-2 space-y-3" key={key} disabled={!isEditing || saving}>
                        <legend className="font-heading font-bold text-xs text-black mb-1">Siblings</legend>
                        {siblings.length === 0 && !isEditing && (
                          <p className="text-xs text-black/65 italic">No siblings recorded.</p>
                        )}
                        {siblings.map((person, i) => (
                          <div key={i} className="grid gap-3 sm:grid-cols-3 rounded-lg border border-black/15 bg-black/5 p-3">
                            {["name", "relationship", "age", "education", "institution"].map((field) => (
                              <label key={field} className="text-[11px] font-bold text-black">
                                {label(field)}
                                <input
                                  value={person[field] ?? ""}
                                  disabled={!isEditing || saving}
                                  className={`mt-1 block w-full rounded-md border border-black/15 p-2 text-xs font-semibold text-black ${
                                    isEditing ? "bg-white focus:outline-none focus:border-brand" : "bg-black/5 cursor-not-allowed"
                                  }`}
                                  onChange={(e) =>
                                    change(
                                      siblings.map((item, n) => (n === i ? { ...item, [field]: e.target.value } : item))
                                    )
                                  }
                                />
                              </label>
                            ))}
                            {isEditing && (
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => change(siblings.filter((_, n) => n !== i))}
                                  className="px-3 py-2 text-[11px] font-bold text-black border border-black/15 bg-white hover:bg-black/5 rounded-md cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {isEditing && (
                          <button
                            type="button"
                            className="text-xs font-bold text-black underline cursor-pointer"
                            onClick={() => change([...siblings, { name: "" }])}
                          >
                            + Add sibling
                          </button>
                        )}
                      </fieldset>
                    );
                  }
                  const isFieldReadOnly = profile.readOnly.includes(key);
                  return (
                    <div key={key} className="min-w-0">
                      <label htmlFor={"scholar-" + key} className="block text-black font-bold mb-1">
                        {label(key)}
                      </label>
                      {section === "Semester marksheets" ? (
                        <button
                          type="button"
                          onClick={() => download(key)}
                          className="px-3 py-2 rounded-md border border-black/15 bg-black/5 hover:bg-black/10 font-bold text-black cursor-pointer"
                        >
                          Download marksheet
                        </button>
                      ) : section === "Application documents" ? (
                        typeof value === "string" && /^https?:\/\//i.test(value) ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block px-3 py-2 rounded-md border border-black/15 bg-black/5 hover:bg-black/10 font-bold text-black underline"
                          >
                            Open document
                          </a>
                        ) : (
                          <span className="inline-block p-2.5 text-black/65">Unavailable</span>
                        )
                      ) : isFieldReadOnly ? (
                        <div className="w-full p-2.5 rounded-md bg-black/5 border border-black/15 text-black font-semibold">
                          <Value value={value} />
                        </div>
                      ) : typeof value === "boolean" ? (
                        <select
                          id={"scholar-" + key}
                          value={String(value)}
                          disabled={!isEditing || saving}
                          onChange={(e) => change(e.target.value === "true")}
                          className={`w-full p-2.5 rounded-md border border-black/15 text-black font-semibold transition ${
                            isEditing
                              ? "bg-white focus:outline-none focus:border-brand cursor-pointer"
                              : "bg-black/5 cursor-not-allowed"
                          }`}
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          id={"scholar-" + key}
                          value={String(value ?? "")}
                          disabled={!isEditing || saving}
                          onChange={(e) => change(e.target.value)}
                          className={`w-full p-2.5 rounded-md border border-black/15 text-black font-semibold transition ${
                            isEditing
                              ? "bg-white focus:outline-none focus:border-brand"
                              : "bg-black/5 cursor-not-allowed"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {isEditing && (
                <div className="pt-3 border-t border-black/15 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                  <span role="status" className="text-[11px] text-black/65 font-medium">
                    {message || "Changes apply to your scholar profile."}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => cancelEdit(keyList)}
                      className="px-4 py-2 text-xs font-heading font-bold text-black border border-black/15 hover:bg-black/5 rounded-md transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving || !keyList.some((k) => k in draft)}
                      onClick={() => save(section, keyList)}
                      className="px-5 py-2 bg-brand hover:brightness-95 text-black font-heading font-bold text-xs rounded-md transition cursor-pointer border border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
