import { useCallback, useEffect, useRef, useState } from "react";

export interface GestureDetectionResult {
  zoom_action: "zoom_in" | "zoom_out" | null;  // zoom in = increase, zoom out = decrease
  gesture: "open_palm" | "closed_fist" | "pinch" | null;
  confidence: number;
  hand_detected: boolean;
  hand_count: number;
  error: string | null;
}

interface UseBackendGestureDetectionOptions {
  enabled?: boolean;
  onGestureDetected?: (result: GestureDetectionResult) => void;
  detectionInterval?: number; // ms between frame sends (default 100ms = 10fps)
  apiUrl?: string; // Backend API URL (default: http://localhost:8000)
}

export function useBackendGestureDetection({
  enabled = false,
  onGestureDetected,
  detectionInterval = 100,
  apiUrl = "http://localhost:8000",
}: UseBackendGestureDetectionOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user",
        },
        audio: false,
      });

      if (!videoRef.current) {
        const video = document.createElement("video");
        video.style.display = "none";
        document.body.appendChild(video);
        videoRef.current = video;
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      return new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error("Video element not found"));
          return;
        }

        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play().catch((err) => {
            console.error("❌ Error playing video:", err);
            reject(err);
          });
          resolve();
        };

        setTimeout(() => {
          reject(new Error("Camera initialization timeout"));
        }, 5000);
      });
    } catch (err) {
      const msg = `Failed to access camera: ${err instanceof Error ? err.message : String(err)}`;
      console.error("❌", msg);
      setError(msg);
      throw err;
    }
  }, []);

  // Capture frame from video and send to backend
  const captureAndDetect = useCallback(async () => {
    try {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      if (video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        console.warn("⏳ Video not ready yet");
        return;
      }

      // Get current time for throttling
      const now = Date.now();
      if (now - lastDetectionTimeRef.current < detectionInterval) {
        return;
      }
      lastDetectionTimeRef.current = now;

      // Draw video frame to canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Convert canvas to base64
      const frameData = canvas.toDataURL("image/jpeg", 0.7);

      // Send to backend
      console.log("📤 Sending frame to backend for gesture detection...");
      const response = await fetch(`${apiUrl}/detect-gesture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frame: frameData }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result: GestureDetectionResult = await response.json();

      // Log result
      if (result.gesture) {
        console.log(
          `👉 [Backend Gesture Detected] ${result.gesture} | Confidence: ${(result.confidence * 100).toFixed(1)}%`,
          result
        );
      } else if (result.hand_detected) {
        console.log(`👋 [Hand Detected] No gesture recognized yet (hand_count: ${result.hand_count})`);
      }

      // Call callback
      onGestureDetected?.(result);
    } catch (err) {
      const msg = `Gesture detection error: ${err instanceof Error ? err.message : String(err)}`;
      console.error("❌", msg);
      setError(msg);
    }
  }, [detectionInterval, apiUrl, onGestureDetected]);

  // Detection loop
  useEffect(() => {
    if (!enabled || !isInitialized) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    console.log("▶️ [Backend Gesture Detection] Starting detection loop...");
    setIsDetecting(true);

    const loop = async () => {
      await captureAndDetect();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsDetecting(false);
    };
  }, [enabled, isInitialized, captureAndDetect]);

  // Initialize on mount
  useEffect(() => {
    if (!enabled) return;

    console.log("🚀 [Backend Gesture Detection] Initializing...");

    const init = async () => {
      try {
        // Create hidden canvas for frame capture
        if (!canvasRef.current) {
          const canvas = document.createElement("canvas");
          canvas.style.display = "none";
          document.body.appendChild(canvas);
          canvasRef.current = canvas;
        }

        await startCamera();
        setIsInitialized(true);
        console.log("✅ [Backend Gesture Detection] Initialized successfully");
      } catch (err) {
        const msg = `Initialization failed: ${err instanceof Error ? err.message : String(err)}`;
        console.error("❌", msg);
        setError(msg);
        setIsInitialized(false);
      }
    };

    init();
  }, [enabled, startCamera]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current && videoRef.current.parentElement) {
        videoRef.current.parentElement.removeChild(videoRef.current);
      }
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.parentElement.removeChild(canvasRef.current);
      }
    };
  }, []);

  return {
    isInitialized,
    isDetecting,
    error,
  };
}
