import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  User,
  Volume2,
  Star,
  ChevronRight,
  AlertCircle,
  Settings,
  LogIn,
  ArrowLeft,
  Trophy,
  PartyPopper,
} from "lucide-react";
import logoImg from "@assets/kidz-gpt_1767288550163.jpeg";
import robotImage from "@assets/generated_images/cute_3d_robot_character.png";
import solarSystemImage from "@assets/generated_images/cartoon_solar_system_illustration.png";
import scienceExperimentImage from "@assets/generated_images/fun_science_experiment_illustration.png";
import oceanLifeImage from "@assets/generated_images/cute_3d_panda_toy_on_wheels.png";
import dinosaursImage from "@assets/generated_images/cute_3d_minion_toy_character.png";
import artImage from "@assets/generated_images/creative_art_and_drawing_illustration.png";
import ScenePlayer from "@/components/ScenePlayer";
import sceneData from "@/data/sampleScene.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type ExplainerPollResponse = {
  job_id?: string;
  status?: "pending" | "ready" | "fallback" | string;
  explainer?: BackendExplainer | null;
  error?: string | null;
};

type Scene = {
  scene_id?: number;
  animation?: {
    action?: string;
    loop?: boolean;
  };
  dialogue?: {
    text?: string;
  };
  duration?: number;
};

const normalizeTo3DScenes = (input: any): Scene[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((s, idx): Scene => {
      const dialogueText =
        (s?.dialogue && typeof s.dialogue === "object" ? s.dialogue.text : undefined) ||
        (typeof s?.dialogue === "string" ? s.dialogue : undefined) ||
        (typeof s?.text === "string" ? s.text : undefined) ||
        "";

      return {
        scene_id: s?.scene_id ?? s?.scene ?? idx + 1,
        animation: {
          action: s?.animation?.action ?? "neutral",
          loop: s?.animation?.loop ?? true,
        },
        dialogue: { text: dialogueText },
        duration: Number(s?.duration ?? 4),
      };
    })
    .filter((s) => Boolean((s.dialogue?.text || "").trim()));
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
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  
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

  const chatLenRef = useRef<number>(0);

  useEffect(() => {
    chatLenRef.current = chatHistory.length;
  }, [chatHistory.length]);
  const [scenes, setScenes] = useState<Scene[]>(sceneData.scenes);
  const [isSceneActive, setIsSceneActive] = useState(false);
  const [isScenePlaying, setIsScenePlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

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

  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | null> => {
    let timer: any;
    try {
      const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      });
      return (await Promise.race([promise, timeout])) as T | null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const pollExplainer = async (jobId: string): Promise<BackendExplainer | null> => {
    const id = String(jobId || "").trim();
    if (!id) return null;

    // Poll for up to ~20s. This runs while the animation/TTS is playing.
    for (let attempt = 0; attempt < 25; attempt++) {
      try {
        const resp = await fetch(`/explainer?job_id=${encodeURIComponent(id)}`);
        if (resp.status === 404) return null;
        if (!resp.ok) {
          await delay(600);
          continue;
        }
        const data = (await resp.json().catch(() => null)) as ExplainerPollResponse | null;
        const status = String(data?.status || "");
        const explainer = data?.explainer || null;
        if ((status === "ready" || status === "fallback") && explainer) return explainer;
      } catch {
        // ignore transient failures
      }
      await delay(800);
    }

    return null;
  };

  const toWikiLangCode = (lang: string): string => {
    const raw = String(lang || "").trim().toLowerCase();
    const primary = (raw.includes("-") ? raw.split("-")[0] : raw) || "en";
    const supported = new Set(["en", "hi", "bn", "ta", "te"]);
    return supported.has(primary) ? primary : "en";
  };

const cleanQuery = (query: string): string => {
    const stopwords = ["a", "an", "the", "is", "are", "was", "were"];
    const words = query.toLowerCase().split(" ");
    const cleanedWords = words.filter(word => !stopwords.includes(word));
    return cleanedWords.join(" ") || query;
  };

  const fetchTopicImage = async (query: string, langHint?: string): Promise<string | null> => {
    const q = (query || "").trim();
    if (!q) return null;

    const originalLang = toWikiLangCode(langHint || language || "en");
    let translatedQuery = q;

    if (originalLang !== "en") {
      try {
        const translateResponse = await fetch("/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: q, to_language: "en" }),
        });
        if (translateResponse.ok) {
          const data = await translateResponse.json();
          translatedQuery = data.translated_text;
          console.log(`📝 Translated "${q}" to "${translatedQuery}" for image search.`);
        }
      } catch (e) {
        console.error("Translation failed, falling back to original query.", e);
      }
    }

    const wikiLang = "en"; // Always search english wikipedia for better image results
    const wikiBase = `https://${wikiLang}.wikipedia.org`;
    
    const isSafeExplanationImage = async (url: string): Promise<boolean> => {
      const src = String(url || "").trim();
      if (!src) return false;

      // Only allow known Wikipedia/Wikimedia image hosts.
      const allowedHosts = ["upload.wikimedia.org", "commons.wikimedia.org"];
      try {
        const parsed = new URL(src);
        if (!allowedHosts.includes(parsed.hostname)) return false;
      } catch {
        return false;
      }

      // If the browser can't do face detection, don't fail closed, but log it.
      const FaceDetectorCtor = (window as any)?.FaceDetector;
      if (!FaceDetectorCtor) {
        console.warn("⚠️ FaceDetector API not available. Cannot check for faces in images, so skipping this safety check.");
        return true;
      }

      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.src = src;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
        });

        const canvas = document.createElement("canvas");
        const w = Math.min(512, img.naturalWidth || img.width || 0);
        const h = Math.min(512, img.naturalHeight || img.height || 0);
        if (!w || !h) return false;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;
        ctx.drawImage(img, 0, 0, w, h);

        const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(canvas);

        // If we detect a face, treat it as unsafe for the kids explanation image.
        return !Array.isArray(faces) || faces.length === 0;
      } catch {
        return false;
      }
    };
    try {
      console.log(`🖼️ Fetching topic image for: "${translatedQuery}"`);
      const resp = await fetch(`/topic-image?query=${encodeURIComponent(translatedQuery)}&lang=${encodeURIComponent(wikiLang)}`);
      if (!resp.ok) {
        console.warn(`⚠️ Topic image fetch failed: ${resp.status} ${resp.statusText}`);
        // continue to client-side fallback
      } else {
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await resp.json();
          const imageUrl = typeof data?.imageUrl === "string" ? data.imageUrl : "";
          if (imageUrl) {
            console.log(`✅ Topic image found: ${imageUrl.substring(0, 80)}...`);
          } else {
            console.warn(`⚠️ No image URL in response for "${translatedQuery}"`);
          }
          if (imageUrl && (await isSafeExplanationImage(imageUrl))) return imageUrl;
          return null;
        }

        // If we got HTML (e.g., Vite dev server index.html), avoid JSON parsing.
        const preview = await resp.text().catch(() => "");
        if (preview.includes("<!DOCTYPE") || preview.includes("<html")) {
          // This typically happens when running the client-only dev server (vite) without the express server.
          // It's not fatal because we fall back to Wikipedia directly.
          if (!(window as any).__topicImageHtmlLogged) {
            console.info("ℹ️ /topic-image returned HTML; using client-side Wikipedia fallback");
            (window as any).__topicImageHtmlLogged = true;
          }
        }
      }

      // Client-side fallback: Use a two-step process for better relevance.
      // 1. Use opensearch to find the most relevant page title.
      // 2. Use that title to get the page image.
      const cleanedTranslatedQuery = cleanQuery(translatedQuery);
      const openSearchUrl = new URL(`${wikiBase}/w/api.php`);
      openSearchUrl.searchParams.set("action", "opensearch");
      openSearchUrl.searchParams.set("search", cleanedTranslatedQuery);
      openSearchUrl.searchParams.set("limit", "1");
      openSearchUrl.searchParams.set("namespace", "0");
      openSearchUrl.searchParams.set("format", "json");
      openSearchUrl.searchParams.set("origin", "*");

      const openSearchResp = await fetch(openSearchUrl.toString());
      if (!openSearchResp.ok) return null;
      const openSearchData = await openSearchResp.json().catch(() => null);
      
      const pageTitle = openSearchData?.[1]?.[0];
      if (!pageTitle) {
        console.warn(`⚠️ No relevant Wikipedia page title found for "${translatedQuery}"`);
        return null;
      }
      
      console.log(`✅ Found relevant page title: "${pageTitle}"`);

      const queryUrl = new URL(`${wikiBase}/w/api.php`);
      queryUrl.searchParams.set("action", "query");
      queryUrl.searchParams.set("format", "json");
      queryUrl.searchParams.set("origin", "*");
      queryUrl.searchParams.set("prop", "pageimages");
      queryUrl.searchParams.set("titles", pageTitle);
      queryUrl.searchParams.set("pithumbsize", "800");
      queryUrl.searchParams.set("utf8", "1");
      queryUrl.searchParams.set("redirects", "1");

      const queryResp = await fetch(queryUrl.toString());
      if (!queryResp.ok) return null;
      const queryData = await queryResp.json().catch(() => null);
      const pagesObj = queryData?.query?.pages || {};
      const pages = Object.values(pagesObj) as any[];
      const page = pages?.[0];
      const imageUrl = typeof page?.thumbnail?.source === "string" ? page.thumbnail.source : "";
      if (imageUrl && (await isSafeExplanationImage(imageUrl))) return imageUrl;
      return null;
    } catch (e) {
      console.error(`❌ Topic image fetch error for "${translatedQuery}":`, e);
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

            const normalizeDialogueKey = (input: string) =>
              String(input || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();

            // Add user message first
            const originalText = typeof data.original_text === "string" ? data.original_text.trim() : "";
            if (originalText) {
              setChatHistory((prev) => [...prev, { actor: "kid", text: originalText }]);
              chatLenRef.current += 1;
              // Small delay to allow UI to update
              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Start explainer processing/polling immediately (while animation plays)
            const rawTopic = data?.intent?.topic || data?.topic || "";
            const initialBackendExplainer: BackendExplainer | null =
              (data?.explainer as BackendExplainer) ||
              (data?.explanation as BackendExplainer) ||
              null;
            const jobId = typeof data?.job_id === "string" ? data.job_id : "";
            const explainerPromise = jobId ? pollExplainer(jobId) : Promise.resolve(initialBackendExplainer);

            // Process scenes sequentially
            const incoming3D =
              (data?.animation_scenes && Array.isArray(data.animation_scenes)
                ? data.animation_scenes
                : null) ||
              (data?.scenes && Array.isArray(data.scenes) ? data.scenes : null);

            const normalizedScenes = normalizeTo3DScenes(incoming3D);

            if (normalizedScenes.length > 0) {
              const seenDialogues = new Set<string>();
              setScenes(normalizedScenes);
              setIsSceneActive(true);
              for (let i = 0; i < normalizedScenes.length; i++) {
                const scene = normalizedScenes[i];
                setCurrentSceneIndex(i);
                
                // Validate dialogue exists and is not empty
                const dialogue = (scene.dialogue?.text || "").trim();
                if (!dialogue) {
                  console.warn(`⚠️ Skipping scene ${i + 1}: empty dialogue`);
                  continue;
                }

                // De-dupe identical lines (prevents repeated/garbled outputs when backend repeats itself)
                const dialogueKey = normalizeDialogueKey(dialogue);
                if (seenDialogues.has(dialogueKey)) {
                  console.warn(`⚠️ Skipping scene ${i + 1}: duplicate dialogue`);
                  continue;
                }
                seenDialogues.add(dialogueKey);
                
                // Update subtitle
                setCurrentSubtitle(dialogue);

                // Add AI message to chat (batch update to prevent glitches)
                const dialogueIndex = chatLenRef.current;
                setChatHistory((prev) => [...prev, { actor: "ai", text: dialogue }]);
                chatLenRef.current += 1;
                
                // Small delay to allow UI to render before playing audio
                await new Promise((resolve) => setTimeout(resolve, 200));

                // Highlight this dialogue while speaking
                setSpeakingDialogueIndex(dialogueIndex);
                setIsScenePlaying(true);

                // Runtime TTS in the browser using the detected language
                // This ensures audio matches the input language
                // Frontend handles all TTS - backend no longer generates audio
                await speakText(dialogue, ttsLanguage);

                // Remove highlight after speaking
                setSpeakingDialogueIndex(null);
                setIsScenePlaying(false);

                // Small delay between scenes for better UX
                if (i < normalizedScenes.length - 1) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              }
              setIsSceneActive(false);
            }

            // Update the topic explainer section (image + summary) and scroll to it
            try {
              // Prefer the deferred explainer (computed while animation played)
              const backendExplainer =
                (await withTimeout(explainerPromise, 8000)) || initialBackendExplainer;

              const nextExplainer = pickTopicExplainer({
                topic: rawTopic,
                question: data?.original_text,
                backendExplainer,
              });
              setTopicExplainer(nextExplainer);

              // Fetch a real image from the web for this topic (non-blocking)
              const imageQuery = rawTopic || data?.original_text || "";
              const imageUrl = await fetchTopicImage(imageQuery, ttsLanguage);
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

  const generateQuiz = async () => {
    const topic = topicExplainer.title || "this topic";
    
    try {
      setIsProcessing(true);
      
      // Fetch quiz questions from backend
      const response = await fetch("/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          explainer: {
            title: topicExplainer.title,
            summary: topicExplainer.answer,
            points: topicExplainer.points,
          },
          language: language,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }
      
      const data = await response.json();
      const questions = data.questions || [];
      
      if (questions.length === 0) {
        throw new Error("No questions generated");
      }
      
      setQuizQuestions(questions);
      setCurrentQuizQuestion(0);
      setQuizScore(0);
      setSelectedAnswer(null);
      setShowQuizResult(false);
      setIsQuizComplete(false);
      setShowQuiz(true);
      
      // Speak the first question
      setTimeout(() => {
        if (questions[0]) {
          speakText(questions[0].question, language);
        }
      }, 500);
    } catch (error) {
      console.error("Quiz generation error:", error);
      setError("Failed to generate quiz. Please try again!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuizAnswer = async (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === quizQuestions[currentQuizQuestion].correctAnswer;
    
    if (isCorrect) {
      setQuizScore(quizScore + 1);
      await speakText("Correct! Great job!", language);
      setShowQuizResult(true);
      
      // Move to next question or show final score
      setTimeout(async () => {
        if (currentQuizQuestion < quizQuestions.length - 1) {
          setCurrentQuizQuestion(currentQuizQuestion + 1);
          setSelectedAnswer(null);
          setShowQuizResult(false);
          
          // Speak next question
          setTimeout(() => {
            speakText(quizQuestions[currentQuizQuestion + 1].question, language);
          }, 300);
        } else {
          setIsQuizComplete(true);
          await speakText(`Amazing! You scored ${quizScore + 1} out of ${quizQuestions.length}! You're a champion!`, language);
        }
      }, 2000);
    } else {
      await speakText("Oops! Try again and think carefully.", language);
      setTimeout(() => {
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setQuizQuestions([]);
    setCurrentQuizQuestion(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setIsQuizComplete(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);


  return (
    <div className="min-h-screen w-full animate-in fade-in duration-700">
      {/* ================= HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 lg:px-8 py-2 border-b-2 border-[var(--border-soft)] md:border-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="KidzGPT Logo" className="h-12 md:h-14 object-contain" />
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-12 w-12 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow border-2 border-[var(--border-soft)] flex items-center justify-center"
                  aria-label="Settings"
                >
                  <Settings size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <label
                    className="block text-xs font-semibold opacity-70 mb-1"
                    htmlFor="learn-language"
                  >
                    Language
                  </label>
                  <select
                    id="learn-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white px-3 py-2 rounded-md shadow-sm border-2 border-[var(--border-soft)] text-[var(--text-primary)] font-bold"
                    aria-label="Select language"
                  >
                    <option value="auto">Auto (detect from voice)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="bn-IN">Bengali</option>
                    <option value="ta-IN">Tamil</option>
                    <option value="te-IN">Telugu</option>
                  </select>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    window.location.href = "/login";
                  }}
                >
                  <LogIn size={16} />
                  Login
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 pt-20 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <main className="flex-1 flex flex-col gap-6">
        
        {/* ================= UPPER SECTION: CHAT & ANIMATION ================= */}
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-[var(--border-soft)] p-4 md:p-6 animate-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px] lg:min-h-[75vh]">
          
          {/* LEFT: CHAT TRANSCRIPT */}
          <section className="lg:col-span-5 flex flex-col gap-4 h-full">
            {/* Back Button */}
            <div className="flex justify-start">
              <button
                onClick={() => window.location.href = "/"}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 border-2 border-[var(--border-soft)] text-[var(--text-primary)] font-bold hover:-translate-x-1"
              >
                <ArrowLeft size={18} />
                <span className="text-sm">Back to Home</span>
              </button>
            </div>
            
            <div className="card flex-1 flex flex-col relative border-4 border-[var(--border-soft)] max-h-[calc(100vh-220px)] min-h-[520px] overflow-hidden shadow-xl ring-4 ring-[var(--cta-voice)] ring-opacity-15">
              <div className="flex-1 overflow-y-auto space-y-5 p-6 custom-scrollbar" style={{ scrollBehavior: 'smooth', willChange: 'scroll-position' }}>
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
                    ? "button-voice shadow-lg ring-4 ring-[var(--cta-voice)] ring-opacity-20"
                    : isProcessing
                    ? "bg-gray-200 border-2 border-gray-400 text-gray-600 cursor-not-allowed"
                    : "button-primary shadow-xl ring-4 ring-[var(--cta-primary)] ring-opacity-25"
                } w-full flex justify-center gap-2 items-center text-xl transition-all duration-200`}
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
          <section className="lg:col-span-7 flex flex-col gap-4 h-full">
            
            {/* CHARACTER / ANIMATION AREA */}
            <div className="character-container flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[520px] lg:min-h-[560px]">
              {/* Decorative background circles */}
              <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-20 rounded-full blur-xl"></div>
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-[var(--bg-secondary)] opacity-30 rounded-full blur-2xl"></div>

              {/* Main Character (3D) */}
              <div className="relative z-10 w-full h-full px-4 py-4">
                <ScenePlayer
                  scenes={scenes.length > 0 ? [scenes[currentSceneIndex]] : []}
                  active={isSceneActive}
                  playing={isScenePlaying}
                />
              </div>

              {/* Reward Badge (Floating) */}
              {/* <div className="absolute top-4 right-4 reward-badge shadow-lg animate-bounce">
                <Star fill="#5D4037" size={24} />
                <span className="ml-2 font-bold">+10 XP</span>
              </div> */}
            </div>

          </section>
          </div>
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

        {/* ================= QUIZ CHALLENGE SECTION ================= */}
        <section className="mt-8 mb-4">
          <div className="relative bg-gradient-to-r from-[#FF6B6B] via-[#FFA500] to-[#FFD700] rounded-3xl p-8 shadow-2xl border-4 border-white overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <Trophy size={40} className="text-white animate-bounce" />
                  <h3 className="text-3xl md:text-4xl font-bold text-white font-[Comic Neue]">
                    Test Your Knowledge!
                  </h3>
                  <PartyPopper size={40} className="text-white animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
                <p className="text-xl text-white font-[Poppins] opacity-90">
                  Take a fun quiz and become a Super Learner! 🌟
                </p>
              </div>
              
              <button
                onClick={generateQuiz}
                disabled={isProcessing}
                className="bg-white text-[#FF6B6B] font-bold text-2xl py-5 px-10 rounded-full shadow-2xl hover:shadow-none hover:scale-110 transition-all duration-300 flex items-center gap-4 border-4 border-[#FFD700] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ animationDuration: "1.5s" }}
              >
                <span className="text-4xl">🎯</span>
                Start Quiz!
                <span className="text-4xl">✨</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM SECTION: RELATED TOPICS ================= */}
        <section className="mt-4">
          <div className="mb-6 px-2">
            <h3 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B6B] via-[#FFA500] to-[#4CAF50] bg-clip-text text-transparent font-[Comic Neue] flex items-center gap-3 animate-pulse">
              Keep Exploring! 🚀
            </h3>
          </div>
          
          <div 
            ref={(el) => {
              if (el && !el.dataset.carouselActive) {
                el.dataset.carouselActive = 'true';
                const scrollInterval = setInterval(() => {
                  if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
                    el.scrollTo({ left: 0, behavior: 'smooth' });
                  } else {
                    el.scrollBy({ left: 240, behavior: 'smooth' });
                  }
                }, 3000);
                
                el.addEventListener('mouseenter', () => clearInterval(scrollInterval));
                el.addEventListener('mouseleave', () => {
                  const newInterval = setInterval(() => {
                    if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
                      el.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                      el.scrollBy({ left: 240, behavior: 'smooth' });
                    }
                  }, 3000);
                  el.addEventListener('mouseenter', () => clearInterval(newInterval), { once: true });
                });
              }
            }}
            className="flex gap-6 overflow-x-auto pb-4 snap-x px-1 scrollbar-hide"
          >
            {[
              { topic: 'Dinosaurs', emoji: '🦖', gradient: 'from-[#FF6B6B] to-[#FF8A65]' },
              { topic: 'Ocean Life', emoji: '🐳', gradient: 'from-[#2196F3] to-[#81D4FA]' },
              { topic: 'Volcanoes', emoji: '🌋', gradient: 'from-[#FF5722] to-[#FFAB91]' },
              { topic: 'Rainforest', emoji: '🌴', gradient: 'from-[#4CAF50] to-[#81C784]' },
              { topic: 'Space Travel', emoji: '🚀', gradient: 'from-[#9C27B0] to-[#CE93D8]' },
              { topic: 'Insects', emoji: '🐞', gradient: 'from-[#FFD700] to-[#FFE082]' },
              { topic: 'Ancient Egypt', emoji: '🏺', gradient: 'from-[#DEB887] to-[#F4A460]' },
              { topic: 'Weather', emoji: '⛈️', gradient: 'from-[#87CEEB] to-[#B0E0E6]' },
              { topic: 'Human Body', emoji: '🫀', gradient: 'from-[#FF69B4] to-[#FFB6C1]' },
              { topic: 'Robots', emoji: '🤖', gradient: 'from-[#708090] to-[#A9A9A9]' },
              { topic: 'Antarctica', emoji: '🐧', gradient: 'from-[#E0FFFF] to-[#B0E2FF]' },
              { topic: 'Magic Tricks', emoji: '🎩', gradient: 'from-[#4B0082] to-[#8A2BE2]' },
              { topic: 'Castles', emoji: '🏰', gradient: 'from-[#CD853F] to-[#DEB887]' },
              { topic: 'Music', emoji: '🎵', gradient: 'from-[#FF1493] to-[#FF69B4]' },
              { topic: 'Planets', emoji: '🪐', gradient: 'from-[#191970] to-[#4169E1]' },
              { topic: 'Sports', emoji: '⚽', gradient: 'from-[#32CD32] to-[#98FB98]' }
            ].map((item, i) => (
              <div 
                key={i} 
                className={`min-w-[180px] md:min-w-[220px] h-40 md:h-48 bg-gradient-to-br ${item.gradient} rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-4 p-6 cursor-pointer hover:scale-110 hover:-translate-y-3 transition-all duration-300 border-4 border-white snap-start relative overflow-hidden group`}
              >
                {/* Decorative shine effect */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-20 rounded-full blur-xl group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full blur-lg"></div>
                
                <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-4xl md:text-5xl shadow-lg group-hover:scale-125 transition-transform duration-300">
                  {item.emoji}
                </div>
                <span className="relative z-10 font-bold text-white text-xl md:text-2xl drop-shadow-lg font-[Comic Neue] text-center">
                  {item.topic}
                </span>
              </div>
            ))}
          </div>
        </section>

        </main>
      </div>

      {/* ================= QUIZ MODAL ================= */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FFE5E5] via-[#FFF9E5] to-[#E8F5E9] border-4 border-[var(--cta-primary)] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-[var(--text-primary)] font-[Comic Neue] flex items-center justify-center gap-3">
              <Trophy size={32} className="text-[#FFD700]" />
              Quiz Time! 🎉
              <PartyPopper size={32} className="text-[#FF6B6B]" />
            </DialogTitle>
          </DialogHeader>

          {!isQuizComplete ? (
            <div className="space-y-6 p-6">
              {/* Progress Bar */}
              <div className="flex gap-2 justify-center">
                {quizQuestions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                      idx < currentQuizQuestion
                        ? "bg-green-500"
                        : idx === currentQuizQuestion
                        ? "bg-[#FFD700] animate-pulse"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Question Counter */}
              <div className="text-center text-lg font-bold text-[var(--text-primary)]">
                Question {currentQuizQuestion + 1} of {quizQuestions.length}
              </div>

              {/* Question */}
              {quizQuestions[currentQuizQuestion] && (
                <>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-[#FFA500]">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] text-center font-[Comic Neue]">
                      {quizQuestions[currentQuizQuestion].question}
                    </h3>
                  </div>

                  {/* Answer Options - 2 options */}
                  <div className="grid grid-cols-1 gap-4">
                    {quizQuestions[currentQuizQuestion].options.map((option: string, idx: number) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === quizQuestions[currentQuizQuestion].correctAnswer;
                      const showResult = selectedAnswer !== null;

                      const colors = [
                        { bg: "bg-[#E8F5E9]", border: "border-[#4CAF50]", hover: "hover:bg-[#C8E6C9]" },
                        { bg: "bg-[#FFE5E5]", border: "border-[#FF6B6B]", hover: "hover:bg-[#FFD0D0]" },
                      ];

                      const colorScheme = colors[idx % 2];

                      let className = `${colorScheme.bg} ${colorScheme.border} ${colorScheme.hover} border-4 rounded-2xl p-4 text-lg font-bold text-[var(--text-primary)] text-center cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl`;

                      if (showResult) {
                        if (isSelected && isCorrect) {
                          className = "bg-green-500 border-green-700 border-4 rounded-2xl p-4 text-lg font-bold text-white text-center scale-110 shadow-2xl animate-bounce";
                        } else if (isSelected && !isCorrect) {
                          className = "bg-red-500 border-red-700 border-4 rounded-2xl p-4 text-lg font-bold text-white text-center shake";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={selectedAnswer !== null}
                          className={className}
                        >
                          {option}
                          {showResult && isSelected && isCorrect && " ✓"}
                          {showResult && isSelected && !isCorrect && " ✗"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Result Message */}
                  {showQuizResult && selectedAnswer !== null && (
                    <div className="bg-green-100 border-4 border-green-500 rounded-2xl p-6 text-center animate-in slide-in-from-bottom-4 duration-500">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-2xl font-bold text-green-700 font-[Comic Neue]">
                        Correct! Great job! 🌟
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Quiz Complete - Show Prize */
            <div className="space-y-6 p-8 text-center">
              <div className="text-8xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-4xl font-bold text-[var(--text-primary)] font-[Comic Neue] mb-4">
                Amazing Work, Champion! 🎊
              </h2>
              <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-3xl p-8 shadow-2xl border-4 border-[#FF6B6B]">
                <p className="text-3xl font-bold text-white mb-4">
                  You scored {quizScore} out of {quizQuestions.length}!
                </p>
                <div className="flex justify-center gap-4 text-5xl mb-4">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>⭐</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>🎯</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>🎁</span>
                </div>
                <p className="text-2xl text-white font-[Poppins]">
                  You earned a Super Learner Badge! 🏅
                </p>
              </div>
              
              <button
                onClick={closeQuiz}
                className="mt-6 bg-[var(--cta-primary)] text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Continue Learning! 🚀
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
