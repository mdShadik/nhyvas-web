"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Dialog } from "@/components/ui/dialog";
import { FlipHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type CameraCaptureProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  busy?: boolean;
};

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, payload] = dataUrl.split(",", 2);
  const mime = meta?.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
  const byteString = atob(payload ?? "");
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export function CameraCapture({ open, onClose, onCapture, busy = false }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCapturedImage(null);
      setError(null);
      setFacingMode("environment");
    }
  }, [open]);

  const videoConstraints = useMemo(() => {
    return { facingMode };
  }, [facingMode]);

  const capture = useCallback(() => {
    if (busy) return;
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("Unable to capture photo. Please try again.");
      return;
    }
    setCapturedImage(imageSrc);
  }, [busy]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (busy) return;
    if (!capturedImage) {
      capture();
      return;
    }
    const file = dataUrlToFile(capturedImage, `walkthrough-${Date.now()}.jpg`);
    onCapture(file);
  }, [busy, capture, capturedImage, onCapture]);

  return (
    <Dialog
      open={open}
      title="Take photo"
      description="Capture a photo for your 24-hour walkthrough story."
      confirmLabel={capturedImage ? "Use photo" : "Capture"}
      cancelLabel="Close"
      busy={busy}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-black">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
          ) : open ? (
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={facingMode === "user"}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={videoConstraints}
              className={cn("h-full w-full object-cover")}
              onUserMediaError={() => setError("Unable to access camera. Please allow camera permissions.")}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={busy || Boolean(capturedImage)}
            onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800",
              (busy || Boolean(capturedImage)) && "opacity-60"
            )}
          >
            <FlipHorizontal className="h-4 w-4" />
            Switch
          </button>

          {capturedImage ? (
            <button
              type="button"
              disabled={busy}
              onClick={retake}
              className={cn(
                "rounded-lg border border-border bg-bg-input px-3 py-2 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800",
                busy && "opacity-60"
              )}
            >
              Retake
            </button>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
