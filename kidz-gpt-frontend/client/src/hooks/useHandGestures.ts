import { useEffect, useRef, useState, useCallback } from "react";
import {
  FilesetResolver,
  GestureRecognizer,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";

export interface GestureData {
  gesture: string; // "closed_fist" (zoom out), "open_palm" (zoom in)
  confidence: number; // 0-1
  leftHandDetected: boolean;
  rightHandDetected: boolean;
  hand?: "left" | "right"; // Which hand detected the gesture
}

interface UseHandGesturesOptions {
  enabled?: boolean;
  onGestureDetected?: (gesture: GestureData) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export function useHandGestures(options: UseHandGesturesOptions = {}) {
  const {
    enabled = true,
    onGestureDetected,
    videoRef: externalVideoRef,
    canvasRef: externalCanvasRef,
  } = options;

  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(externalVideoRef?.current || null);
  const canvasRef = useRef<HTMLCanvasElement | null>(externalCanvasRef?.current || null);
  const animationFrameRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Initialize MediaPipe Gesture Recognizer
  const initializeGestureRecognizer = useCallback(async () => {
    if (!enabled) return;

    console.log("👐 [Gesture Detection] Initializing MediaPipe Gesture Recognizer...");

    try {
      console.log("📥 [Gesture Detection] Loading MediaPipe Vision library...");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );
      console.log("✅ [Gesture Detection] MediaPipe Vision library loaded");

      console.log("🤖 [Gesture Detection] Creating gesture recognizer model...");
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/latest/gesture_recognizer.task`,
        },
        runningMode: "VIDEO",
        numHands: 1, // Detect one hand
      });

      recognizerRef.current = recognizer;
      setIsInitialized(true);
      setError(null);
      console.log("✅ [Gesture Detection] Gesture Recognizer initialized successfully");
      console.log("👐 [Gesture Detection] Ready to detect hand gestures (Fist = Zoom Out, Open Hand = Zoom In)");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to initialize gesture recognizer: ${message}`);
      console.error("❌ [Gesture Detection] Initialization error:", err);
      console.error("📋 [Gesture Detection] Error details:", message);
    }
  }, [enabled]);

  // Request camera access
  const startCamera = useCallback(async () => {
    if (!enabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user",
        },
      });

      if (!videoRef.current) {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        videoRef.current = video;
      } else {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsDetecting(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Camera access denied: ${message}`);
      console.error("Camera access error:", err);
    }
  }, [enabled]);

  // Detect gestures from video frames
  const detectGestures = useCallback(async () => {
    if (!recognizerRef.current || !videoRef.current || !enabled) {
      return;
    }

    try {
      const video = videoRef.current;
      if (video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(detectGestures);
        return;
      }

      const result: GestureRecognizerResult = recognizerRef.current.recognizeForVideo(
        video,
        performance.now()
      );

      // Log detected hands
      const leftHandDetected = result.landmarks && result.landmarks[0];
      const rightHandDetected = result.landmarks && result.landmarks[1];

      if (
        result.gestures &&
        result.gestures.length > 0 &&
        result.gestures[0].length > 0
      ) {
        // Get the primary gesture from the most confident hand
        const primaryGesture = result.gestures[0][0];
        const categoryName = primaryGesture.categoryName;
        const confidence = primaryGesture.score;

        // **CONFIDENCE THRESHOLD: Only accept gestures with >= 70% confidence**
        // This filters out false positives and noise
        const CONFIDENCE_THRESHOLD = 0.7;
        if (confidence < CONFIDENCE_THRESHOLD) {
          console.log(
            `⚠️ [Gesture Rejected] ${categoryName} | Confidence: ${(confidence * 100).toFixed(1)}% (below ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% threshold)`,
            {
              mediapipeGesture: categoryName,
              confidence: (confidence * 100).toFixed(1) + "%",
              threshold: (CONFIDENCE_THRESHOLD * 100).toFixed(0) + "%",
            }
          );
          animationFrameRef.current = requestAnimationFrame(detectGestures);
          return;
        }

        // Normalize gesture names to match expected format
        // MediaPipe returns: "Open_Palm", "Closed_Fist", etc.
        // Convert to: "open_palm", "closed_fist"
        const normalizedGesture = categoryName
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_');
        
        // Log gesture detection with actual MediaPipe name and normalized name
        console.log(
          `✅ [Gesture Detected] ${categoryName} | Confidence: ${(confidence * 100).toFixed(1)}%`,
          {
            gesture: normalizedGesture,
            mediapipeGesture: categoryName,
            confidence: (confidence * 100).toFixed(1) + "%",
            leftHand: !!result.landmarks?.[0],
            rightHand: !!result.landmarks?.[1],
            handCount: (result.landmarks?.length || 0),
          }
        );

        // Determine which hand (left=index 0, right=index 1)
        let detectedHand: "left" | "right" = "left";
        if (result.gestures.length > 1 && result.gestures[1].length > 0) {
          const rightGesture = result.gestures[1][0];
          if (rightGesture.score > confidence) {
            detectedHand = "right";
          }
        }

        const gestureData: GestureData = {
          gesture: normalizedGesture,
          confidence,
          leftHandDetected: !!result.landmarks?.[0],
          rightHandDetected: !!result.landmarks?.[1],
          hand: detectedHand,
        };

        onGestureDetected?.(gestureData);
      }
    } catch (err) {
      console.error("❌ [Gesture Detection] Error during detection:", err);
    }

    animationFrameRef.current = requestAnimationFrame(detectGestures);
  }, [enabled, onGestureDetected]);

  // Initialize on mount
  useEffect(() => {
    if (!enabled) return;

    console.log("🚀 [Gesture Detection] Initializing gesture detection system...");

    const init = async () => {
      await initializeGestureRecognizer();
      await startCamera();
    };

    init();
  }, [enabled, initializeGestureRecognizer, startCamera]);

  // Start detection loop once initialized
  useEffect(() => {
    if (isInitialized && enabled) {
      console.log("▶️ [Gesture Detection] Starting gesture detection loop...");
      animationFrameRef.current = requestAnimationFrame(detectGestures);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isInitialized, enabled, detectGestures]);

  // Cleanup on unmount
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsDetecting(false);
  }, []);

  return {
    isInitialized,
    isDetecting,
    error,
    stopCamera,
    videoRef: videoRef.current,
  };
}
