"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api";

interface Props {
  applicationId: string;
  phase: "tele" | "physical";
  onText: (text: string) => void;
  onBusy: (busy: boolean) => void;
}

function MicrophoneWaveform({ stream }: { stream: MediaStream }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    let frame = 0;
    let context: AudioContext | undefined;
    function release() {
      cancelAnimationFrame(frame);
      if (context && context.state !== "closed") void context.close().catch(() => {});
      context = undefined;
    }

    async function monitor() {
      const canvas = canvasRef.current;
      const pen = canvas?.getContext("2d");
      if (!canvas || !pen) throw new Error("Canvas unavailable");
      context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.minDecibels = -75;
      analyser.maxDecibels = -25;
      context.createMediaStreamSource(stream).connect(analyser);
      await context.resume();
      if (!active) return;
      const spectrum = new Uint8Array(analyser.frequencyBinCount);
      const binWidth = context.sampleRate / analyser.fftSize;
      const barCount = 16;
      const levels = new Float32Array(barCount);
      // Logarithmic bands give lower speech frequencies more space.
      const edges = Array.from({ length: barCount + 1 }, (_, i) =>
        Math.min(spectrum.length, Math.round(80 * (6000 / 80) ** (i / barCount) / binWidth)));
      const middle = canvas.height / 2;
      const spacing = canvas.width / barCount;
      pen.strokeStyle = "#713f12";
      pen.lineWidth = 8;
      pen.lineCap = "round";
      let lastDraw = performance.now() - 50;
      function draw(now: number) {
        if (!active || !pen || !canvas) return;
        frame = requestAnimationFrame(draw);
        const elapsed = now - lastDraw;
        if (elapsed < 50) return;
        lastDraw = now;
        analyser.getByteFrequencyData(spectrum);
        pen.clearRect(0, 0, canvas.width, canvas.height);
        pen.beginPath();
        for (let i = 0; i < barCount; i++) {
          let peak = 0;
          for (let bin = edges[i]; bin < edges[i + 1]; bin++) {
            peak = Math.max(peak, spectrum[bin]);
          }
          const target = peak / 255;
          const smoothingMs = target > levels[i] ? 220 : 550;
          levels[i] += (target - levels[i]) * (1 - Math.exp(-elapsed / smoothingMs));
          const x = spacing * (i + 0.5);
          const height = Math.max(0.5, levels[i] * (middle - pen.lineWidth));
          pen.moveTo(x, middle - height);
          pen.lineTo(x, middle + height);
        }
        pen.stroke();
      }
      draw(performance.now());
    }
    void monitor().catch(() => {
      release();
      if (active) setUnavailable(true);
    });
    return () => { active = false; release(); };
  }, [stream]);

  return unavailable ? <span>Audio preview unavailable</span> :
    <canvas ref={canvasRef} width={256} height={64} className="h-8 w-32 rounded-full bg-yellow-50" role="img" aria-label="Live microphone sound levels" />;
}

export default function SuggestionRecorder({ applicationId, phase, onText, onBusy }: Props) {
  const [stage, setStage] = useState<"idle" | "permission" | "recording" | "transcribing">("idle");
  const [message, setMessage] = useState("");
  const session = useRef<AbortController | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
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
      setRecordingStream(null);
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
            setMessage("Use your voice to add your suggestion.");
          }
        } catch (error) {
          if (!request.signal.aborted) setMessage((axios.isAxiosError(error) && error.response?.data?.message) || "Transcription failed. Record again or type your suggestion.");
        } finally {
          if (!request.signal.aborted) finish();
        }
      };
      mic.start();
      setRecordingStream(stream);
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

  const label = { idle: "Start suggestion dictation", permission: "Opening microphone", recording: "Stop dictation", transcribing: "Transcribing" }[stage];
  const Icon = stage === "recording" ? StopIcon : MicrophoneIcon;
  return <div className="my-2 flex flex-wrap items-center gap-2 text-xs">
    <button type="button" className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-yellow-400 text-black hover:bg-yellow-300 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait"
      disabled={stage === "permission" || stage === "transcribing"}
      aria-label={label} title={label}
      onClick={() => {
        if (stage === "idle") void start();
        else if (stage === "recording") {
          setStage("transcribing");
          if (recorder.current?.state === "recording") recorder.current.stop();
        }
      }}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
    {stage === "recording" && recordingStream && <MicrophoneWaveform stream={recordingStream} />}
    <span role="status">{message || { idle: "Speak Tamil, English, or both for up to 1 minute. Your suggestion will appear in English.", permission: "Opening microphone…", recording: "Listening… tap stop when finished.", transcribing: "Transcribing…" }[stage]}</span>
  </div>;
}
