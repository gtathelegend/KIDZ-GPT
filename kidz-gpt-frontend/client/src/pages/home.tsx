import React, { useState, useEffect, useRef } from "react";
import { Mic, User, Volume2, Star, ChevronRight, AlertCircle } from "lucide-react";
import logoImg from "@assets/kidz-gpt_1767288550163.jpeg";
import robotImage from "@assets/generated_images/cute_3d_robot_character.png";
import solarSystemImage from "@assets/generated_images/cartoon_solar_system_illustration.png";
import scienceExperimentImage from "@assets/generated_images/fun_science_experiment_illustration.png";
import oceanLifeImage from "@assets/generated_images/cute_3d_panda_toy_on_wheels.png";
import dinosaursImage from "@assets/generated_images/cute_3d_minion_toy_character.png";
import artImage from "@assets/generated_images/creative_art_and_drawing_illustration.png";
import ScenePlayer from "@/components/ScenePlayer";
import sceneData from "@/data/sampleScene.json";

interface ChatMessage {
  actor: "kid" | "ai";
  text: string;
}

interface TopicExplainer {
  title: string;
  question?: string;
  answer: string;
  points: string[];
  tags: string[];
  imageSrc: string;
  imageAlt: string;
}

type BackendExplainer = {
  title?: string;
  summary?: string;
  points?: string[];
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("Welcome! Tap the microphone to start learning! 🎤");
  // "auto" lets the backend (Whisper) detect language from input.
  const [language, setLanguage] = useState("auto");
  const [speakingDialogueIndex, setSpeakingDialogueIndex] = useState<number | null>(null);
  
  // Voice settings for browser TTS - clear, professional male voice
  const [voiceSettings] = useState({
    pitch: 0.9,  // Slightly lower pitch tends to sound more masculine (0-2)
    rate: 0.95,   // Slightly faster than before, but still very clear and professional (0.1-10)
    volume: 1.0,  // Max volume for clarity
    preferFemale: false
  });

  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const topicExplainerRef = useRef<HTMLDivElement>(null);

  const [topicExplainer, setTopicExplainer] = useState<TopicExplainer>({
    title: "What is a Solar System?",
    question: "Tell me about planets!",
    answer:
      "Imagine a big family in space! The Sun is the parent in the middle, and all the planets (like Earth!) are the kids running in circles around it.",
    points: [
      "The Sun is in the middle.",
      "Planets move around the Sun.",
      "Earth is one of the planets.",
    ],
    tags: ["Space", "Science"],
    imageSrc: solarSystemImage,
    imageAlt: "Solar System",
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      actor: "kid",
      text: "Tell me about planets!",
    },
    {
      actor: "ai",
      text: "Planets are huge round balls made of rock or gas that float in space! 🌍",
    },
    {
      actor: "kid",
      text: "Are they hot?",
    },
    {
      actor: "ai",
      text: "Some are super hot like Venus 🔥, and some are freezing cold like Neptune! ❄️",
    },
  ]);

  // Auto-scroll to bottom when chat history changes (with debounce to prevent glitches)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [chatHistory]);

  const toSpeechLangTag = (lang: string): string => {
    const normalized = (lang || "").trim();
    if (!normalized || normalized.toLowerCase() === "auto") return "en-IN";

    // Backend may return ISO-639 like "en", "hi"; the Web Speech API prefers BCP-47.
    const lower = normalized.toLowerCase();
    if (lower === "en") return "en-IN";
    if (lower === "hi") return "hi-IN";
    if (lower === "bn") return "bn-IN";
    if (lower === "ta") return "ta-IN";
    if (lower === "te") return "te-IN";

    // If it's already a BCP-47-ish tag (en-IN), keep it.
    if (normalized.includes("-")) return normalized;

    return `${normalized}-IN`;
  };

  const scoreVoice = (voice: SpeechSynthesisVoice, langTag: string, preferFemale: boolean = true) => {
    const vLang = (voice.lang || "").toLowerCase();
    const wanted = (langTag || "").toLowerCase();
    const wantedPrimary = wanted.split("-")[0];

    let score = 0;
    
    // Language matching (highest priority)
    if (vLang === wanted) score += 200;
    if (wantedPrimary && vLang.startsWith(wantedPrimary)) score += 120;
    
    // If language doesn't match at all, heavily penalize
    if (wantedPrimary && !vLang.startsWith(wantedPrimary)) score -= 100;

    const name = (voice.name || "").toLowerCase();
    
    // FEMALE VOICE PREFERENCE (high priority for sweet, clear voice)
    if (preferFemale) {
      // Strong indicators of female voices
      if (name.includes("female") || name.includes("woman") || name.includes("girl")) score += 200;
      if (name.includes("zira") || name.includes("samantha") || name.includes("karen") || 
          name.includes("susan") || name.includes("linda") || name.includes("heather") ||
          name.includes("hazel") || name.includes("tessa") || name.includes("veena") ||
          name.includes("priya") || name.includes("neela") || name.includes("sophia") ||
          name.includes("olivia") || name.includes("emma") || name.includes("ava")
      ) score += 180;
      
      // Avoid male voices
      if (name.includes("male") || name.includes("man") || name.includes("boy") || name.includes("david") ||
          name.includes("mark") || name.includes("richard") || name.includes("james") ||
          name.includes("daniel") || name.includes("thomas") || name.includes("alex")) score -= 100;
    } else {
      // MALE VOICE PREFERENCE
      if (name.includes("male") || name.includes("man") || name.includes("boy")) score += 200;

      // Common male voice names across platforms
      if (
        name.includes("david") ||
        name.includes("mark") ||
        name.includes("george") ||
        name.includes("james") ||
        name.includes("daniel") ||
        name.includes("thomas") ||
        name.includes("alex") ||
        name.includes("ravi")
      ) {
        score += 180;
      }

      // De-prioritize common female voices
      if (name.includes("female") || name.includes("woman") || name.includes("girl")) score -= 120;
      if (
        name.includes("zira") ||
        name.includes("samantha") ||
        name.includes("karen") ||
        name.includes("susan") ||
        name.includes("linda") ||
        name.includes("heather") ||
        name.includes("hazel") ||
        name.includes("tessa") ||
        name.includes("veena") ||
        name.includes("priya") ||
        name.includes("neela") ||
        name.includes("sophia") ||
        name.includes("olivia") ||
        name.includes("emma") ||
        name.includes("ava")
      ) {
        score -= 100;
      }
    }

    // HIGH-QUALITY VOICE INDICATORS (professional, clear)
    if (name.includes("neural")) score += 80;  // Neural voices are usually high quality
    if (name.includes("natural")) score += 70;
    if (name.includes("premium")) score += 60;
    if (name.includes("enhanced")) score += 55;
    if (name.includes("hd")) score += 50;
    if (name.includes("crystal") || name.includes("clear")) score += 45;
    
    // Platform-specific high-quality voices
    if (name.includes("google") && (name.includes("neural") || name.includes("wavenet"))) score += 90;
    if (name.includes("microsoft") && (name.includes("neural") || name.includes("zira"))) score += 85;
    if (name.includes("amazon") && name.includes("neural")) score += 85;
    if (name.includes("apple") && (name.includes("samantha") || name.includes("karen"))) score += 80;
    
    // Language-specific high-quality voices
    if (wantedPrimary === "hi" && (name.includes("hi") || name.includes("hindi"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }
    if (wantedPrimary === "bn" && (name.includes("bn") || name.includes("bengali"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }
    if (wantedPrimary === "ta" && (name.includes("ta") || name.includes("tamil"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }
    if (wantedPrimary === "te" && (name.includes("te") || name.includes("telugu"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }

    // AVOID low-quality voices
    if (name.includes("default") && !name.includes("neural")) score -= 50;
    if (name.includes("android") && !name.includes("neural")) score -= 40;
    if (name.includes("espeak")) score -= 100;  // Very robotic
    if (name.includes("system") && !name.includes("neural")) score -= 30;
    if (name.includes("basic")) score -= 40;
    if (name.includes("sapi")) score -= 20;  // Older SAPI voices

    // Some engines flag the default voice (small bonus, but prefer named voices)
    if ((voice as any).default && !name.includes("neural") && !name.includes("premium")) {
      score += 5;  // Very small bonus
    }

    return score;
  };

  const ensureVoicesReady = (): Promise<void> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.resolve();
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Log available voices for debugging (only first time)
      if (!(window as any).__voicesLogged) {
        console.log(`🎙️ Available voices (${voices.length}):`, 
          voices.map(v => `${v.name} (${v.lang})`).slice(0, 10)
        );
        (window as any).__voicesLogged = true;
      }
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        const loadedVoices = window.speechSynthesis.getVoices();
        if (loadedVoices.length > 0 && !(window as any).__voicesLogged) {
          console.log(`🎙️ Available voices (${loadedVoices.length}):`, 
            loadedVoices.map(v => `${v.name} (${v.lang})`).slice(0, 10)
          );
          (window as any).__voicesLogged = true;
        }
        resolve();
      };

      window.speechSynthesis.addEventListener("voiceschanged", handler);
      // Safety timeout: resolve even if voices never load.
      setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve();
      }, 1500);
    });
  };

  const speakText = async (text: string, lang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text || text.trim() === "") return;

    await ensureVoicesReady();

    const utterance = new SpeechSynthesisUtterance(text);
    const langTag = toSpeechLangTag(lang);
    utterance.lang = langTag;

    // Get all available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Filter voices that match the language (at least primary language)
    const langPrimary = langTag.split("-")[0]?.toLowerCase();
    const matchingVoices = voices.filter((v) => {
      const vLang = (v.lang || "").toLowerCase();
      return vLang.startsWith(langPrimary) || vLang === langTag;
    });

    // Score and select the best voice based on preferences
    const scoredVoices = (matchingVoices.length > 0 ? matchingVoices : voices)
      .filter((v) => !!v.lang)
      .map((v) => ({
        voice: v,
        score: scoreVoice(v, langTag, voiceSettings.preferFemale) // Use preference setting
      }))
      .sort((a, b) => b.score - a.score);

    const selectedVoice = scoredVoices[0]?.voice;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🎤 Using voice: ${selectedVoice.name} (${selectedVoice.lang}) for language: ${langTag}`);
    } else {
      console.warn(`⚠️ No suitable voice found for ${langTag}, using default`);
    }

    // Apply voice settings
    const primary = langTag.split("-")[0]?.toLowerCase();
    
    utterance.volume = voiceSettings.volume;
    utterance.pitch = voiceSettings.pitch;
    
    // Adjust rate based on language for optimal clarity
    if (primary === "hi") {
      utterance.rate = Math.min(voiceSettings.rate, 0.88);  // Hindi: slightly slower for clarity
    } else if (primary === "bn" || primary === "ta" || primary === "te") {
      utterance.rate = Math.min(voiceSettings.rate, 0.90);  // Other Indian languages: clear pace
    } else {
      utterance.rate = voiceSettings.rate;  // Use setting for English
    }

    await new Promise<void>((resolve) => {
      utterance.onend = () => {
        console.log("✅ Speech completed");
        resolve();
      };
      utterance.onerror = (e) => {
        console.error("❌ Speech error:", e);
        resolve();  // Don't block on errors
      };
      
      // Cancel any ongoing speech before starting new one
      window.speechSynthesis.cancel();
      
      // Small delay to ensure cancellation is processed
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    });
  };

  const pickTopicExplainer = (args: {
    topic?: string;
    question?: string;
    backendExplainer?: BackendExplainer | null;
  }): TopicExplainer => {
    const rawTopic = (args.topic || "").trim();
    const title = rawTopic ? rawTopic : "Your Topic";

    const be = args.backendExplainer || null;
    const answer = (be?.summary || "").trim() || "Here are the main ideas in a simple way.";

    const points = Array.isArray(be?.points)
      ? be!.points.map((p) => String(p || "").trim()).filter(Boolean).slice(0, 3)
      : ["It has a simple meaning.", "It has important parts or steps.", "It helps us understand how something works."];

    const normalized = rawTopic.toLowerCase();

    const hasAny = (needles: string[]) => needles.some((n) => normalized.includes(n));

    let imageSrc = scienceExperimentImage;
    let imageAlt = "Learning";

    if (hasAny(["space", "planet", "solar", "sun", "moon", "star", "galaxy"])) {
      imageSrc = solarSystemImage;
      imageAlt = "Space";
    } else if (hasAny(["ocean", "sea", "fish", "whale", "shark", "coral"])) {
      imageSrc = oceanLifeImage;
      imageAlt = "Ocean";
    } else if (hasAny(["dinosaur", "dinosaurs", "t-rex", "trex", "jurassic"])) {
      imageSrc = dinosaursImage;
      imageAlt = "Dinosaurs";
    } else if (hasAny(["draw", "drawing", "art", "paint", "color", "colour"])) {
      imageSrc = artImage;
      imageAlt = "Art";
    }

    const tags: string[] = [];
    if (rawTopic) {
      const primary = rawTopic.split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
      if (primary) tags.push(primary);
    }
    if (tags.length < 2) tags.push("Learning");

    return {
      title: (be?.title || title).trim(),
      question: args.question,
      answer,
      points,
      tags,
      imageSrc,
      imageAlt,
    };
  };

  const fetchTopicImage = async (query: string): Promise<string | null> => {
    const q = (query || "").trim();
    if (!q) return null;
    try {
      console.log(`🖼️ Fetching topic image for: "${q}"`);
      const resp = await fetch(`/topic-image?query=${encodeURIComponent(q)}`);
      if (!resp.ok) {
        console.warn(`⚠️ Topic image fetch failed: ${resp.status} ${resp.statusText}`);
        return null;
      }
      const data = await resp.json();
      const imageUrl = typeof data?.imageUrl === "string" ? data.imageUrl : "";
      if (imageUrl) {
        console.log(`✅ Topic image found: ${imageUrl.substring(0, 80)}...`);
      } else {
        console.warn(`⚠️ No image URL in response for "${q}"`);
      }
      return imageUrl ? imageUrl : null;
    } catch (e) {
      console.error(`❌ Topic image fetch error for "${q}":`, e);
      return null;
    }
  };

  const handleMicClick = async () => {
    if (isListening) {
      mediaRecorder?.stop();
      setIsListening(false);
      setIsProcessing(true);
      setError(null);
      setCurrentSubtitle("Processing your question...");
    } else {
      try {
        setError(null);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;

          if (audioChunks.length === 0) {
            setIsProcessing(false);
            setError("No audio recorded. Please try again.");
            setCurrentSubtitle("Ready to listen!");
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          // Hint language to backend. Default is "auto" for best matching to spoken input.
          formData.append("language", language);

          try {
            setCurrentSubtitle("Sending to AI...");
            const response = await fetch("/process", {
              method: "POST",
              body: formData,
            });

            // Check content-type before parsing
            const contentType = response.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");

            if (!response.ok) {
              let errorMessage = `Server error: ${response.status}`;
              if (isJson) {
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
                } catch (e) {
                  // If JSON parsing fails, use default message
                  console.error("Failed to parse error response:", e);
                }
              } else {
                // If response is HTML (error page), provide a helpful message
                const text = await response.text().catch(() => "");
                if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                  errorMessage = "Backend server returned an error page. Please ensure the backend is running on port 8000.";
                } else {
                  errorMessage = text || errorMessage;
                }
              }
              throw new Error(errorMessage);
            }

            // Parse JSON response, but handle non-JSON responses gracefully
            let data;
            if (isJson) {
              try {
                data = await response.json();
              } catch (jsonError) {
                const text = await response.text().catch(() => "");
                if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                  throw new Error("Backend server returned an HTML page instead of JSON. Please ensure the backend is running and accessible.");
                }
                throw new Error(`Failed to parse response: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`);
              }
            } else {
              // Response is not JSON - likely HTML error page
              const text = await response.text().catch(() => "");
              let errorMsg = `Backend returned ${contentType} instead of JSON.`;
              
              if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("404") || text.includes("Not Found")) {
                errorMsg = "Backend endpoint not found. Please ensure the backend server is running on port 8000 and the /process endpoint exists.";
              } else if (text.includes("500") || text.includes("Internal Server Error")) {
                errorMsg = "Backend server error. Please check the backend logs.";
              } else if (response.status === 502 || response.status === 503) {
                errorMsg = "Backend server is not available. Please ensure it's running on port 8000.";
              }
              
              console.error("Non-JSON response from backend:", {
                status: response.status,
                contentType,
                textPreview: text.substring(0, 200)
              });
              
              throw new Error(errorMsg);
            }

            // Handle error responses from backend
            if (data.error) {
              setError(data.message || data.error);
              setCurrentSubtitle("Oops! Please try a different question.");
              setIsProcessing(false);
              return;
            }

            // Use backend-detected language (from Whisper) for everything
            // This ensures responses and TTS match the input language
            let detectedLanguage = data.language || language;
            
            // Normalize language code (backend returns "hi", frontend needs "hi-IN")
            if (detectedLanguage && detectedLanguage !== "auto" && detectedLanguage !== "unknown") {
              // Extract base language code if it's a full tag
              const baseLang = detectedLanguage.split("-")[0].toLowerCase();
              
              // Map to proper BCP-47 tag for TTS
              const langMap: Record<string, string> = {
                "hi": "hi-IN",
                "bn": "bn-IN", 
                "ta": "ta-IN",
                "te": "te-IN",
                "en": "en-IN"
              };
              
              detectedLanguage = langMap[baseLang] || toSpeechLangTag(detectedLanguage);
              
              // Update language selector to match detected language
              setLanguage(detectedLanguage);
              
              console.log(`🌐 Language detected: ${data.language} → Using: ${detectedLanguage} for responses and TTS`);
            } else {
              // Fallback to current language setting
              detectedLanguage = language === "auto" ? "en-IN" : language;
            }
            
            const ttsLanguage = detectedLanguage;

            // Add user message first
            if (data.original_text) {
              setChatHistory((prev) => [
                ...prev,
                { actor: "kid", text: data.original_text },
              ]);
              // Small delay to allow UI to update
              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Process scenes sequentially
            if (data.scenes && Array.isArray(data.scenes)) {
              for (let i = 0; i < data.scenes.length; i++) {
                const scene = data.scenes[i];
                
                // Validate dialogue exists and is not empty
                const dialogue = (scene.dialogue || "").trim();
                if (!dialogue) {
                  console.warn(`⚠️ Skipping scene ${i + 1}: empty dialogue`);
                  continue;
                }
                
                // Update subtitle
                setCurrentSubtitle(dialogue);

                // Add AI message to chat (batch update to prevent glitches)
                const dialogueIndex = chatHistory.length + 1; // Track position
                setChatHistory((prev) => [
                  ...prev,
                  { actor: "ai", text: dialogue },
                ]);
                
                // Small delay to allow UI to render before playing audio
                await new Promise((resolve) => setTimeout(resolve, 200));

                // Highlight this dialogue while speaking
                setSpeakingDialogueIndex(dialogueIndex);

                // Runtime TTS in the browser using the detected language
                // This ensures audio matches the input language
                // Frontend handles all TTS - backend no longer generates audio
                await speakText(dialogue, ttsLanguage);

                // Remove highlight after speaking
                setSpeakingDialogueIndex(null);

                // Small delay between scenes for better UX
                if (i < data.scenes.length - 1) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              }
            }

            // Update the topic explainer section (image + summary) and scroll to it
            try {
              const rawTopic = data?.intent?.topic || data?.topic || "";
              const backendExplainer: BackendExplainer | null =
                (data?.explainer as BackendExplainer) ||
                (data?.explanation as BackendExplainer) ||
                null;
              const nextExplainer = pickTopicExplainer({
                topic: rawTopic,
                question: data?.original_text,
                backendExplainer,
              });
              setTopicExplainer(nextExplainer);

              // Fetch a real image from the web for this topic (non-blocking)
              const imageQuery = rawTopic || data?.original_text || "";
              const imageUrl = await fetchTopicImage(imageQuery);
              if (imageUrl) {
                setTopicExplainer((prev) => ({
                  ...prev,
                  imageSrc: imageUrl,
                  imageAlt: imageQuery ? String(imageQuery) : prev.imageAlt,
                }));
              }
            } finally {
              // Scroll after the interactive explanation finishes (after TTS loop)
              setTimeout(() => {
                topicExplainerRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 150);
            }

            setCurrentSubtitle("Ready for your next question!");
          } catch (error) {
            console.error("Processing error:", error);
            let errorMessage = "Failed to process audio. Please try again.";
            
            if (error instanceof Error) {
              // Clean up error messages for better UX
              const message = error.message;
              if (message.includes("JSON") || message.includes("<!DOCTYPE") || message.includes("HTML")) {
                errorMessage = "Unable to connect to the backend server. Please ensure the backend is running on port 8000.";
              } else if (message.includes("Failed to reach backend") || message.includes("502")) {
                errorMessage = "Backend server is not available. Please check if the backend service is running.";
              } else if (message.includes("NetworkError") || message.includes("fetch")) {
                errorMessage = "Network error. Please check your connection and try again.";
              } else if (message.includes("transcription") || message.includes("Transcription") || message.includes("STT") || message.includes("Speech-to-text")) {
                errorMessage = "Could not understand your audio. Please try speaking more clearly or check if the transcription service is running.";
              } else if (message.includes("empty text") || message.includes("empty audio")) {
                errorMessage = "No audio was detected. Please try speaking again.";
              } else {
                errorMessage = message;
              }
            }
            
            setError(errorMessage);
            setCurrentSubtitle("Something went wrong. Try again!");
            
            // Add error message to chat (but make it more friendly)
            const friendlyMessage = errorMessage.includes("backend") || errorMessage.includes("server")
              ? "I'm having trouble connecting to my brain right now. Please make sure the backend server is running! 🤖"
              : `Sorry, I encountered an error: ${errorMessage}`;
            
            setChatHistory((prev) => [
              ...prev,
              { actor: "ai", text: friendlyMessage },
            ]);
          } finally {
            setIsProcessing(false);
          }
        };
        
        setMediaRecorder(recorder);
        recorder.start();
        setIsListening(true);
        setCurrentSubtitle("Listening... Speak now!");
      } catch (error) {
        console.error("Microphone access error:", error);
        setError("Could not access microphone. Please check permissions.");
        setCurrentSubtitle("Microphone access needed!");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);


  return (
    <div className="min-h-screen flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* ================= HEADER ================= */}
      <header className="flex items-center justify-between py-2 border-b-2 border-[var(--border-soft)] md:border-none animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="KidzGPT Logo" className="h-10 md:h-12 object-contain" />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white px-4 py-2 rounded-full shadow-sm border-2 border-[var(--border-soft)] text-[var(--text-primary)] font-bold"
            aria-label="Select language"
          >
            <option value="auto">Auto (detect from voice)</option>
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi</option>
            <option value="bn-IN">Bengali</option>
            <option value="ta-IN">Tamil</option>
            <option value="te-IN">Telugu</option>
          </select>

          <button 
            className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-[var(--border-soft)]"
            aria-label="User Profile"
          >
            <span className="font-bold text-[var(--text-primary)] hidden md:block">Hi, Alex!</span>
            <div className="h-10 w-10 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-[var(--text-on-yellow)]">
              <User size={20} />
            </div>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6">
        
        {/* ================= UPPER SECTION: CHAT & ANIMATION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] animate-in slide-in-from-bottom-6 duration-700 delay-100">
          
          {/* LEFT: CHAT TRANSCRIPT */}
          <section className="lg:col-span-4 flex flex-col gap-4 h-full">
            <div className="card flex-1 flex flex-col relative border-4 border-[var(--border-soft)] max-h-[calc(100vh-280px)] min-h-[400px] overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 p-4 custom-scrollbar" style={{ scrollBehavior: 'smooth', willChange: 'scroll-position' }}>
                {chatHistory.map((chat, i) => {
                  // Colorful AI dialogues: mix of red, green, yellow
                  const aiColors = [
                    { bg: "bg-[#FFE5E5]", border: "border-[#FF8A65]", text: "text-[#D84315]" }, // Red
                    { bg: "bg-[#E8F5E9]", border: "border-[#81C784]", text: "text-[#388E3C]" }, // Green
                    { bg: "bg-[#FFF9E5]", border: "border-[#FFC107]", text: "text-[#F57C00]" }, // Yellow
                  ];
                  const colorIndex = chat.actor === "ai" ? i % 3 : 0;
                  const aiColor = aiColors[colorIndex];
                  const isSpeaking = speakingDialogueIndex === i;

                  return (
                    <div
                      key={`chat-${i}-${chat.text.substring(0, 10)}`}
                      className={`flex flex-col gap-1 ${
                        chat.actor === "kid" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`${
                          chat.actor === "kid"
                            ? "bg-[var(--bg-learning)] border-2 border-[var(--cta-voice)] rounded-tr-none"
                            : `${aiColor.bg} border-2 ${aiColor.border} ${aiColor.text} rounded-tl-none`
                        } ${
                          isSpeaking ? "ring-4 ring-[var(--cta-voice)] ring-opacity-50 scale-105" : ""
                        } text-[var(--text-primary)] px-4 py-3 rounded-2xl max-w-[90%] text-lg font-bold shadow-sm transition-all duration-300`}
                        style={{
                          animation: `fadeIn 0.3s ease-in ${i * 0.1}s both`
                        }}
                      >
                        {chat.text}
                      </div>
                    </div>
                  );
                })}
                {isProcessing && (
                  <div className="flex items-start gap-2">
                    <div className="bg-[var(--bg-secondary)] rounded-2xl rounded-tl-none px-4 py-3 text-[var(--text-primary)]">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* MIC BUTTON */}
            <div className="card p-4 flex flex-col gap-3 justify-center items-center">
              {error && (
                <div className="w-full bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-700 flex-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800 text-lg font-bold"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}
              <button
                className={`button ${
                  isListening
                    ? "button-voice"
                    : isProcessing
                    ? "bg-gray-200 border-2 border-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-white border-2 border-[var(--cta-voice)] text-[var(--cta-voice)] animate-pulse-glow"
                } w-full flex justify-center gap-2 items-center text-xl shadow-none hover:shadow-md transition-all duration-200`}
                onClick={handleMicClick}
                disabled={isProcessing}
              >
                <Mic
                  size={24}
                  className={isListening ? "animate-pulse" : ""}
                />
                {isProcessing
                  ? "Processing..."
                  : isListening
                  ? "Listening... Tap to Stop"
                  : "Tap to Speak"}
              </button>
            </div>
          </section>

          {/* RIGHT: ANIMATION & HIGHLIGHTS */}
          <section className="lg:col-span-8 flex flex-col gap-4 h-full">
            
            {/* CHARACTER / ANIMATION AREA */}
            <div className="character-container flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[350px]">
              {/* Decorative background circles */}
              <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-20 rounded-full blur-xl"></div>
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-[var(--bg-secondary)] opacity-30 rounded-full blur-2xl"></div>

              {/* Main Character (3D) */}
              <div className="relative z-10 w-full h-full px-4 py-4">
                <ScenePlayer scenes={sceneData.scenes} />
              </div>

              {/* Reward Badge (Floating) */}
              <div className="absolute top-4 right-4 reward-badge shadow-lg animate-bounce">
                <Star fill="#5D4037" size={24} />
                <span className="ml-2 font-bold">+10 XP</span>
              </div>
            </div>

          </section>
        </div>

        {/* ================= MIDDLE SECTION: EXPLANATION ================= */}
        <div ref={topicExplainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* IMAGE CARD */}
          <div className="md:col-span-1 card p-2 flex items-center justify-center bg-white border-4 border-[var(--bg-secondary)] overflow-hidden">
            <img 
              src={topicExplainer.imageSrc} 
              alt={topicExplainer.imageAlt} 
              className="w-full h-full object-cover rounded-xl hover:scale-110 transition-transform duration-700"
            />
          </div>

          {/* TEXT EXPLANATION CARD */}
          <div className="md:col-span-2 card flex flex-col justify-center gap-4 relative overflow-hidden">
             {/* Decor */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--bg-learning)] rounded-full opacity-50 pointer-events-none"></div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[Comic Neue]">
              {topicExplainer.title}
            </h2>

            {topicExplainer.question ? (
              <p className="text-base md:text-lg text-[var(--text-secondary)] font-bold">
                Q: <span className="font-[Poppins] font-medium">{topicExplainer.question}</span>
              </p>
            ) : null}

            <p className="text-xl leading-relaxed text-[var(--text-secondary)] font-[Poppins]">
              {topicExplainer.answer}
            </p>

            {/* Main points (visually highlighted using existing theme tokens) */}
            <div className="flex flex-wrap gap-2">
              {topicExplainer.points.slice(0, 3).map((point, idx) => {
                const dotBg =
                  idx === 0
                    ? "bg-[var(--cta-primary)]"
                    : idx === 1
                    ? "bg-[var(--accent-coral)]"
                    : "bg-[var(--reward-gold)]";

                const chipBg =
                  idx === 0
                    ? "bg-[var(--bg-success)]"
                    : idx === 1
                    ? "bg-[var(--bg-secondary)]"
                    : "bg-[var(--bg-secondary)]";

                const borderColor =
                  idx === 0
                    ? "border-[var(--cta-primary)]"
                    : idx === 1
                    ? "border-[var(--accent-coral)]"
                    : "border-[var(--reward-gold)]";

                return (
                  <div
                    key={`${idx}-${point.substring(0, 12)}`}
                    className={`${chipBg} ${borderColor} border-2 rounded-xl px-3 py-2 flex items-start gap-2 shadow-sm`}
                  >
                    <span className={`mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotBg}`} />
                    <span className="text-[var(--text-primary)] font-[Poppins] font-semibold">
                      {point}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-2 mt-2">
               {topicExplainer.tags.slice(0, 2).map((tag) => (
                 <span key={tag} className="bg-[var(--bg-learning)] text-[var(--cta-voice)] px-3 py-1 rounded-full text-sm font-bold">
                   #{tag}
                 </span>
               ))}
            </div>
          </div>

        </div>

        {/* ================= BOTTOM SECTION: RELATED TOPICS ================= */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Keep Exploring! 🚀</h3>
            <button className="text-[var(--cta-voice)] font-bold hover:underline flex items-center">
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x px-1 custom-scrollbar">
            {['Dinosaurs', 'Ocean Life', 'Volcanoes', 'Rainforest', 'Space Travel', 'Insects'].map((topic, i) => (
              <div 
                key={i} 
                className="min-w-[160px] md:min-w-[200px] h-32 md:h-40 bg-white rounded-2xl shadow-[var(--shadow-soft)] flex flex-col items-center justify-center gap-3 p-4 cursor-pointer hover:-translate-y-2 transition-transform duration-300 border-b-4 border-[var(--bg-secondary)] snap-start"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--bg-learning)] flex items-center justify-center text-2xl">
                  {['🦖', '🐳', '🌋', '🌴', '🚀', '🐞'][i]}
                </div>
                <span className="font-bold text-[var(--text-primary)] text-lg">{topic}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
