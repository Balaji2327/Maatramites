"use client";

import { useEffect, useState } from "react";
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
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    setProfile(null);
    setDraft({});
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

  async function save() {
    setSaving(true);
    try {
      const { data } = await apiClient.patch(endpoint, { changes: draft });
      setProfile(data.data);
      setDraft({});
      setMessage("Profile saved.");
    } catch { setMessage("Could not save the profile. Your edits are still here."); }
    finally { setSaving(false); }
  }

  if (!profile) return <p role="status">{message || "Loading student profile..."}</p>;
  return <div className="space-y-4">
    {Object.entries(profile.sections).map(([section, keys], index) => (
      <details key={section} open={index === 0} className="rounded-lg border border-black/15 bg-white p-5">
        <summary className="cursor-pointer font-bold text-black">{section}</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {keys.split(" ").map(key => {
            const value = draft[key] ?? profile.values[key];
            const change = (next: EditValue) => { setMessage(""); setDraft(prev => ({ ...prev, [key]: next })); };
            if (key === "siblings") {
              const siblings: Sibling[] = Array.isArray(value) ? value : [];
              return <fieldset className="sm:col-span-2 space-y-3" key={key} disabled={saving}>
                <legend className="font-semibold">Siblings</legend>
                {siblings.map((person, i) => <div key={i} className="grid gap-2 sm:grid-cols-3 rounded-lg border p-3">
                  {["name","relationship","age","education","institution"].map(field => <label key={field} className="text-sm">{label(field)}
                    <input value={person[field] ?? ""} className="block w-full rounded border p-2" onChange={e =>
                      change(siblings.map((item, n) => n === i ? { ...item, [field]: e.target.value } : item))} />
                  </label>)}
                  <button type="button" onClick={() => change(siblings.filter((_, n) => n !== i))}>Remove sibling</button>
                </div>)}
                <button type="button" className="text-sm underline" onClick={() => change([...siblings, { name: "" }])}>Add sibling</button>
              </fieldset>;
            }
            return <div key={key} className="min-w-0 text-sm text-black">
              <label htmlFor={"scholar-" + key} className="mb-1 block font-semibold">{label(key)}</label>
              {section === "Semester marksheets" ? <button type="button" onClick={() => download(key)} className="underline">Download marksheet</button> : section === "Application documents" ? (
                typeof value === "string" && /^https?:\/\//i.test(value) ? <a href={value} target="_blank" rel="noreferrer" className="underline">Open document</a> : <span>Unavailable</span>
              ) : profile.readOnly.includes(key) ? <Value value={value} /> : typeof value === "boolean" ? (
                <select id={"scholar-" + key} value={String(value)} disabled={saving} onChange={e => change(e.target.value === "true")} className="w-full rounded-lg border p-2">
                  <option value="true">Yes</option><option value="false">No</option>
                </select>
              ) : <input id={"scholar-" + key} value={String(value ?? "")} disabled={saving} onChange={e => change(e.target.value)} className="w-full rounded-lg border border-black/15 p-2" />}
            </div>;
          })}
        </div>
      </details>
    ))}
    <div className="flex items-center justify-end gap-4">
      <span role="status" className="text-sm">{message}</span>
      <button type="button" disabled={saving || !Object.keys(draft).length} onClick={save} className="rounded-md bg-black px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button>
    </div>
  </div>;
}
