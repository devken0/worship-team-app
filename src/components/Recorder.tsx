"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/format";

type Phase = "idle" | "recording" | "preview" | "uploading";

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export default function Recorder({
  serviceId,
  userId,
}: {
  serviceId: string;
  userId: string;
}) {
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const mimeRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined" ||
      !pickMimeType()
    ) {
      setSupported(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      mimeRef.current = mime;
      const recorder = new MediaRecorder(stream, {
        mimeType: mime || undefined,
        audioBitsPerSecond: 96000,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mime || "audio/webm",
        });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("preview");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRef.current = recorder;
      setSeconds(0);
      setPhase("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setSupported(false);
      setError("Couldn't access the microphone. Use the link option below.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
    setSeconds(0);
    setPhase("idle");
  }

  async function uploadRecording() {
    const blob = blobRef.current;
    if (!blob) return;
    setPhase("uploading");
    setError(null);
    setProgress(10);

    const supabase = createClient();
    const ext = mimeRef.current.includes("mp4") ? "m4a" : "webm";
    const path = `${serviceId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("recordings")
      .upload(path, blob, {
        contentType: mimeRef.current || "audio/webm",
        upsert: false,
      });
    if (upErr) {
      setError(`Upload failed: ${upErr.message}`);
      setPhase("preview");
      return;
    }
    setProgress(70);

    const title = `Recording — ${new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      dateStyle: "medium",
      timeStyle: "short",
    })}`;
    const { error: insErr } = await supabase.from("recordings").insert({
      service_id: serviceId,
      title,
      storage_path: path,
      duration_seconds: seconds,
      created_by: userId,
    });
    if (insErr) {
      setError(`Saved file but couldn't list it: ${insErr.message}`);
      setPhase("preview");
      return;
    }

    setProgress(100);
    discard();
    setPhase("idle");
    router.refresh();
  }

  async function saveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    setSavingLink(true);
    setError(null);
    const supabase = createClient();
    const { error: insErr } = await supabase.from("recordings").insert({
      service_id: serviceId,
      title: linkTitle.trim() || "Recording link",
      external_url: linkUrl.trim(),
      created_by: userId,
    });
    setSavingLink(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setLinkUrl("");
    setLinkTitle("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {supported && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {phase === "idle" && (
            <button
              type="button"
              onClick={startRecording}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white active:opacity-90"
            >
              <span className="h-3 w-3 rounded-full bg-white" />
              Start recording
            </button>
          )}

          {phase === "recording" && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
                Recording… {formatDuration(seconds)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-xl bg-foreground px-4 py-2 font-semibold text-background"
              >
                Stop
              </button>
            </div>
          )}

          {phase === "preview" && previewUrl && (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Preview ({formatDuration(seconds)}) — upload to share it.
              </p>
              <audio controls src={previewUrl} className="w-full" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={uploadRecording}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground active:opacity-90"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={discard}
                  className="rounded-xl border border-border px-4 py-2.5 font-medium text-muted"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {phase === "uploading" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploading…</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link fallback — always available */}
      <details className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-medium">
          {supported
            ? "Or add a link (Google Drive / YouTube)"
            : "Recording isn't supported on this device — add a link instead"}
        </summary>
        <form onSubmit={saveLink} className="mt-3 space-y-2">
          <input
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Label (optional)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-primary"
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            type="url"
            required
            placeholder="https://drive.google.com/…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={savingLink}
            className="w-full rounded-xl bg-foreground px-4 py-2.5 font-semibold text-background disabled:opacity-60"
          >
            {savingLink ? "Saving…" : "Add link"}
          </button>
        </form>
      </details>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
