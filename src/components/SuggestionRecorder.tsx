"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api";

interface Props {
  applicationId: string;
  phase: "tele" | "physical";
  onText: (text: string) => void;
  onBusy: (busy: boolean) => void;
}

export default function SuggestionRecorder({ applicationId, phase, onText, onBusy }: Props) {
  const [stage, setStage] = useState<"idle" | "permission" | "recording" | "transcribing">("idle");
  const [message, setMessage] = useState("");
  const session = useRef<AbortController | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => () => { session.current?.abort(); onBusy(false); }, [onBusy]);

  async function start() {
    if (session.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage("Microphone recording is unavailable in this browser. You can type your suggestion.");
      return;
    }
    const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) { setMessage("This browser does not support recording in a compatible format."); return; }
    const request = new AbortController();
    session.current = request;
    onBusy(true);
    setStage("permission");
    setMessage("");
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const release = () => {
      clearTimeout(timer);
      stream?.getTracks().forEach(track => track.stop());
    };
    const finish = () => {
      release();
      recorder.current = null;
      session.current = null;
      setStage("idle");
      onBusy(false);
    };
    request.signal.addEventListener("abort", release, { once: true });
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (request.signal.aborted) { release(); return; }
      const mic = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      recorder.current = mic;
      const chunks: Blob[] = [];
      mic.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      mic.onerror = () => {
        if (request.signal.aborted) return;
        request.abort();
        setMessage("Recording was interrupted. Try again.");
        finish();
      };
      mic.onstop = async () => {
        release();
        if (request.signal.aborted) return;
        setStage("transcribing");
        try {
          const { data } = await apiClient.post(
            "/admin/applications/" + encodeURIComponent(applicationId) + "/suggestion-transcript/" + phase,
            new Blob(chunks, { type: mimeType }),
            { headers: { "Content-Type": mimeType }, timeout: 65000, signal: request.signal }
          );
          if (!request.signal.aborted) {
            onText(data.text);
            setMessage("Transcript added. Review it before saving.");
          }
        } catch (error) {
          if (!request.signal.aborted) setMessage((axios.isAxiosError(error) && error.response?.data?.message) || "Transcription failed. Record again or type your suggestion.");
        } finally {
          if (!request.signal.aborted) finish();
        }
      };
      mic.start();
      setStage("recording");
      timer = setTimeout(() => { if (mic.state === "recording") mic.stop(); }, 60000);
    } catch {
      release();
      if (!request.signal.aborted) {
        setMessage("Could not access the microphone. Check microphone permissions or type your suggestion.");
        finish();
      }
    }
  }

  return <div className="my-2 flex flex-wrap items-center gap-2 text-xs">
    <button type="button" className="cursor-pointer rounded-md border border-black/20 px-3 py-2 font-semibold hover:bg-brand disabled:cursor-wait"
      disabled={stage === "permission" || stage === "transcribing"}
      onClick={() => { if (stage === "idle") void start(); else if (recorder.current?.state === "recording") recorder.current.stop(); }}>
      {{ idle: "Dictate suggestion", permission: "Opening microphone…", recording: "Stop and transcribe", transcribing: "Transcribing…" }[stage]}
    </button>
    <span role="status">{message || (stage === "recording" ? "Recording… stops automatically after 1 minute." : "Up to 1 minute. Audio is sent to Gemini for transcription.")}</span>
  </div>;
}
