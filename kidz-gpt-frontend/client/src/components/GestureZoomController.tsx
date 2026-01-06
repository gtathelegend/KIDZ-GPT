import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBackendGestureDetection } from "@/hooks/useBackendGestureDetection";
import type { GestureDetectionResult } from "@/hooks/useBackendGestureDetection";

interface GestureZoomControllerProps {
  children: React.ReactNode;
  onZoomChange?: (zoomLevel: number) => void;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  enableDetection?: boolean;
  showFullscreenButton?: boolean;
  fullscreenBackgroundImageUrl?: string;
}

export const GestureZoomController: React.FC<GestureZoomControllerProps> = ({
  children,
  onZoomChange,
  minZoom = 0.5,
  maxZoom = 3,
  initialZoom = 1,
  enableDetection = true,
  showFullscreenButton = false,
  fullscreenBackgroundImageUrl,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const lastGestureApplyAtRef = useRef<number>(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isFullscreenRef = useRef<boolean>(false);

  const overlayRoot = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.body;
  }, []);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  const setFullscreenMode = useCallback(
    (next: boolean, reason: "manual" | "gesture") => {
      setIsFullscreen(next);
      onZoomChange?.(next ? maxZoom : initialZoom);
    },
    [onZoomChange, maxZoom, initialZoom]
  );

  // Handle gesture detection results from backend
  const handleGestureDetected = useCallback(
    (result: GestureDetectionResult) => {
      // NOTE: We receive results continuously (~10fps). A debounce that resets every frame
      // can prevent updates from ever applying. Use a small throttle instead.
      const now = Date.now();
      if (now - lastGestureApplyAtRef.current < 180) return;
      lastGestureApplyAtRef.current = now;

      // Requirement: fullscreen ONLY while the user shows an open palm.
      // Anything else (closed fist, no gesture, etc.) returns to normal view.
      const gestureRaw = String(result.gesture || "");
      const gestureNormalized = gestureRaw.trim().toLowerCase().replace(/[-\s]+/g, "_");
      const zoomAction = String(result.zoom_action || "").trim().toLowerCase();

      // Prefer the gesture label if present; otherwise fall back to zoom_action.
      // Backend currently maps open_palm -> zoom_out, so treat zoom_out as open palm.
      const isOpenPalm = gestureNormalized.includes("open_palm") || zoomAction === "zoom_out";

      // Log gesture handling (useful for debugging live camera jitter)
      console.log(
        `🎥 [Gesture Zoom Control] gesture=${gestureRaw || "(none)"} zoom_action=${zoomAction || "(none)"} => open_palm=${isOpenPalm}`
      );

      // Debounce to avoid flicker on noisy detections.
      const nextFullscreen = isOpenPalm;
      if (nextFullscreen === isFullscreenRef.current) return;

      if (nextFullscreen) {
        console.log("✋ [Gesture Zoom Control] Open palm → FULLSCREEN");
        setFeedbackMessage("✋ Fullscreen");
      } else {
        console.log("👋 [Gesture Zoom Control] Not open palm → NORMAL");
        setFeedbackMessage("Normal");
      }

      setFullscreenMode(nextFullscreen, "gesture");

      setShowFeedback(true);
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => setShowFeedback(false), 700);
    },
    [setFullscreenMode]
  );

  // Initialize backend gesture detection
  const { isInitialized, isDetecting, error } = useBackendGestureDetection({
    enabled: enableDetection,
    onGestureDetected: handleGestureDetected,
    detectionInterval: 100, // 10fps for gesture detection
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Lock page scroll while fullscreen is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isFullscreen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  // Close on Escape.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isFullscreen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenMode(false, "manual");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, setFullscreenMode]);

  // Focus close button when the overlay opens (accessibility + keyboard).
  useEffect(() => {
    if (!isFullscreen) return;
    const id = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isFullscreen]);

  const overlay = isFullscreen ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Animation fullscreen"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setFullscreenMode(false, "manual")}
        aria-hidden="true"
      />

      {/* Fullscreen surface */}
      <div className="relative z-[1] h-[92vh] w-[92vw] max-w-[1400px] overflow-hidden rounded-3xl border-2 border-[var(--border-soft)] bg-white shadow-2xl">
        <div className="relative h-full w-full">
          {fullscreenBackgroundImageUrl ? (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('${fullscreenBackgroundImageUrl}')` }}
              aria-hidden="true"
            />
          ) : null}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setFullscreenMode(false, "manual")}
            className="absolute right-4 top-4 z-[2] inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--border-soft)] bg-white text-[var(--text-primary)] shadow-md"
            aria-label="Close fullscreen"
            title="Close (Esc)"
          >
            ✕
          </button>

          <div className="relative z-[1] h-full w-full overflow-hidden">{children}</div>

          {showFeedback && (
            <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
              <div className="rounded-2xl bg-black/40 px-6 py-4 text-3xl font-extrabold text-white shadow-lg">
                {feedbackMessage}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Normal view (non-fullscreen) */}
      {!isFullscreen && (
        <div className="relative h-full w-full">
          <div className="h-full w-full overflow-hidden">{children}</div>

          {showFullscreenButton && (
            <button
              type="button"
              onClick={() => setFullscreenMode(!isFullscreenRef.current, "manual")}
              className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border-2 border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-bold text-[var(--text-primary)] shadow-md hover:shadow-lg transition-shadow"
              aria-label={isFullscreenRef.current ? "Exit fullscreen" : "Show animation fullscreen"}
              title={isFullscreenRef.current ? "Exit fullscreen" : "Fullscreen"}
            >
              <span aria-hidden="true">⛶</span>
              {isFullscreenRef.current ? "Exit fullscreen" : "Fullscreen"}
            </button>
          )}

          {showFeedback && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-black/40 px-6 py-4 text-2xl font-extrabold text-white shadow-lg">
                {feedbackMessage}
              </div>
            </div>
          )}
        </div>
      )}

      {overlayRoot && overlay ? createPortal(overlay, overlayRoot) : null}

      {/* Note: debug info can be re-enabled if needed. */}
      {false && (
        <div className="fixed bottom-4 right-4 z-[10000] rounded-lg bg-black/80 p-3 font-mono text-xs text-green-300">
          <div>Gesture Zoom</div>
          <div>Init: {isInitialized ? "✓" : "✗"}</div>
          <div>Detecting: {isDetecting ? "✓" : "✗"}</div>
          <div>Mode: {isFullscreen ? "FULL" : "INLINE"}</div>
          <div>min/max: {minZoom}/{maxZoom}</div>
          {error ? <div className="text-red-300">{error}</div> : null}
        </div>
      )}
    </>
  );
};

