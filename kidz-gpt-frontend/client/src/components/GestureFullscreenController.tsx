import React, { useCallback, useEffect, useRef, useState } from "react";
import { useBackendGestureDetection } from "@/hooks/useBackendGestureDetection";
import { X } from "lucide-react";
import type { GestureDetectionResult } from "@/hooks/useBackendGestureDetection";

interface GestureFullscreenControllerProps {
  children: React.ReactNode;
  enableDetection?: boolean;
  apiUrl?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  debounceMs?: number;
}

export const GestureFullscreenController: React.FC<GestureFullscreenControllerProps> = ({
  children,
  enableDetection = true,
  apiUrl = "http://localhost:8000",
  onFullscreenChange,
  debounceMs = 500,  // Longer debounce for fullscreen to avoid flickering
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateChangeRef = useRef<boolean | null>(null);

  // Handle gesture detection results from backend
  // Import GestureDetectionResult type if not already imported
  // import type { GestureDetectionResult } from "@/hooks/useBackendGestureDetection";

  const handleGestureDetected = useCallback(
    (result: GestureDetectionResult) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Determine fullscreen state based on gesture type
      const shouldFullscreen =
        result.gesture === "open_palm"
          ? true
          : result.gesture === "closed_fist"
          ? false
          : null;

      // Log gesture handling
      if (shouldFullscreen !== null) {
        console.log(`🎥 [Fullscreen Control] Processing gesture: ${result.gesture} → ${shouldFullscreen ? "FULLSCREEN" : "NORMAL"}`);
      }

      // Apply debouncing to prevent rapid-fire fullscreen toggling
      debounceTimerRef.current = setTimeout(() => {
        if (shouldFullscreen === null) {
          // No change state - gesture not recognized
          return;
        }

        // Prevent redundant state changes
        if (lastStateChangeRef.current === shouldFullscreen) {
          console.log(`↩️ [Fullscreen Control] Skipping duplicate state: ${shouldFullscreen}`);
          return;
        }

        lastStateChangeRef.current = shouldFullscreen;

        // Apply fullscreen state
        setIsFullscreen(shouldFullscreen);
        onFullscreenChange?.(shouldFullscreen);

        // Show feedback
        if (shouldFullscreen) {
          console.log(`✋ [Fullscreen Control] Open palm detected → FULLSCREEN MODE`);
          setFeedbackMessage("✋ Fullscreen Mode");
        } else {
          console.log(`✊ [Fullscreen Control] Closed fist detected → NORMAL MODE`);
          setFeedbackMessage("✊ Normal Mode");
        }

        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 1200);
      }, debounceMs);
    },
    [onFullscreenChange, debounceMs]
  );

  // Initialize backend gesture detection
  const { isInitialized, isDetecting, error } = useBackendGestureDetection({
    enabled: enableDetection,
    onGestureDetected: handleGestureDetected,
    detectionInterval: 100,  // 10fps for gesture detection
    apiUrl,
  });

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Normal view (non-fullscreen) */}
      {!isFullscreen && (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Main content */}
          <div style={{ width: "100%", height: "100%" }}>
            {children}
          </div>

          {/* Gesture feedback overlay */}
          {showFeedback && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                borderRadius: "12px",
                pointerEvents: "none",
                animation: "fadeInOut 1.2s ease-in-out",
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  color: "rgba(255, 255, 255, 0.9)",
                  textShadow: "0 3px 10px rgba(0, 0, 0, 0.4)",
                  animation: "scaleIn 0.3s ease-out",
                }}
              >
                {feedbackMessage}
              </div>
            </div>
          )}

          {/* Debug info */}
          {false && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                padding: "8px 12px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "#0f0",
                fontSize: "12px",
                fontFamily: "monospace",
                borderRadius: "4px",
                zIndex: 1000,
                maxWidth: "200px",
              }}
            >
              <div>Gesture Fullscreen Control</div>
              <div>Init: {isInitialized ? "✓" : "✗"}</div>
              <div>Detecting: {isDetecting ? "✓" : "✗"}</div>
              <div>Fullscreen: {isFullscreen ? "YES" : "NO"}</div>
              {error && <div style={{ color: "#f00" }}>Error: {error}</div>}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen popup (overlay) */}
      {isFullscreen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "slideInScale 0.3s ease-out",
          }}
          onClick={() => {
            // Allow clicking outside to close (optional)
            // setIsFullscreen(false);
          }}
        >
          {/* Fullscreen popup container */}
          <div
            style={{
              position: "relative",
              width: "95vw",
              height: "95vh",
              maxWidth: "1200px",
              maxHeight: "800px",
              backgroundColor: "white",
              borderRadius: "24px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              border: "4px solid #4CAF50",
              overflow: "hidden",
              animation: "popupBounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Close button (pinch gesture or click) */}
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 10000,
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "#FF6B6B",
                border: "2px solid white",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3)",
                transition: "all 0.2s ease",
              }}
              title="Close fullscreen (or pinch gesture)"
              aria-label="Close fullscreen"
            >
              ✕
            </button>

            {/* Fullscreen content */}
            <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
              {children}
            </div>

            {/* Gesture feedback */}
            {showFeedback && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  animation: "fadeInOut 1.2s ease-in-out",
                }}
              >
                <div
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: "bold",
                    color: "rgba(255, 255, 255, 0.95)",
                    textShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                    animation: "scaleIn 0.4s ease-out",
                  }}
                >
                  {feedbackMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes scaleIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes slideInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes popupBounceIn {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};
