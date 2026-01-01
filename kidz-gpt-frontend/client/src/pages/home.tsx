import React, { useState, useEffect, useRef } from "react";
import { Mic, User, Volume2, Star, ChevronRight, AlertCircle } from "lucide-react";
import logoImg from "@assets/kidz-gpt_1767288550163.jpeg";
import robotImage from "@assets/generated_images/cute_3d_robot_character.png";
import solarSystemImage from "@assets/generated_images/cartoon_solar_system_illustration.png";

interface ChatMessage {
  actor: "kid" | "ai";
  text: string;
}

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("Welcome! Tap the microphone to start learning! 🎤");
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll to bottom when chat history changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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

          try {
            setCurrentSubtitle("Sending to AI...");
            const response = await fetch("http://localhost:8000/process", {
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

            // Add user message
            if (data.original_text) {
              setChatHistory((prev) => [
                ...prev,
                { actor: "kid", text: data.original_text },
              ]);
            }

            // Process scenes sequentially
            if (data.scenes && Array.isArray(data.scenes)) {
              for (let i = 0; i < data.scenes.length; i++) {
                const scene = data.scenes[i];
                
                // Update subtitle
                if (scene.dialogue) {
                  setCurrentSubtitle(scene.dialogue);
                }

                // Add AI message to chat
                setChatHistory((prev) => [
                  ...prev,
                  { actor: "ai", text: scene.dialogue },
                ]);

                // Play audio if available
                if (scene.audio) {
                  try {
                    // TTS generates WAV files, so use audio/wav instead of audio/mpeg
                    const audio = new Audio(`data:audio/wav;base64,${scene.audio}`);
                    
                    // Set up event handlers before playing
                    const playPromise = new Promise<void>((resolve, reject) => {
                      const timeout = setTimeout(() => {
                        reject(new Error("Audio playback timeout"));
                      }, 30000); // 30 second timeout
                      
                      audio.onended = () => {
                        clearTimeout(timeout);
                        resolve();
                      };
                      
                      audio.onerror = (e) => {
                        clearTimeout(timeout);
                        const error = audio.error;
                        const errorMsg = error 
                          ? `Audio error: ${error.code} - ${error.message}`
                          : "Audio playback failed";
                        console.error("Audio playback error:", errorMsg, e);
                        reject(new Error(errorMsg));
                      };
                      
                      audio.oncanplaythrough = () => {
                        // Audio is ready to play
                      };
                      
                      // Start playback
                      audio.play().catch((playError) => {
                        clearTimeout(timeout);
                        console.error("Audio play() error:", playError);
                        reject(playError);
                      });
                    });
                    
                    await playPromise;
                  } catch (audioError) {
                    console.warn("Audio playback failed (continuing anyway):", audioError);
                    // Continue even if audio fails - don't block the conversation
                  }
                }

                // Small delay between scenes for better UX
                if (i < data.scenes.length - 1) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              }
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

        <button 
          className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-[var(--border-soft)]"
          aria-label="User Profile"
        >
          <span className="font-bold text-[var(--text-primary)] hidden md:block">Hi, Alex!</span>
          <div className="h-10 w-10 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-[var(--text-on-yellow)]">
            <User size={20} />
          </div>
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-6">
        
        {/* ================= UPPER SECTION: CHAT & ANIMATION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] animate-in slide-in-from-bottom-6 duration-700 delay-100">
          
          {/* LEFT: CHAT TRANSCRIPT */}
          <section className="lg:col-span-4 flex flex-col gap-4 h-full">
            <div className="card flex-1 flex flex-col relative overflow-y-auto border-4 border-[var(--border-soft)] max-h-[calc(100vh-280px)]">

              
              <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                {chatHistory.map((chat, i) => (
                  <div
                    key={i}
                    className={`flex flex-col gap-1 ${
                      chat.actor === "kid" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`${
                        chat.actor === "kid"
                          ? "bg-[var(--bg-learning)] rounded-tr-none"
                          : "bg-[var(--bg-secondary)] rounded-tl-none"
                      } text-[var(--text-primary)] px-4 py-3 rounded-2xl max-w-[90%] text-lg font-medium shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      {chat.text}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-start gap-2 animate-pulse">
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
                    : "bg-white border-2 border-[var(--cta-voice)] text-[var(--cta-voice)]"
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

              {/* Main Character */}
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                <img 
                  src={robotImage} 
                  alt="Friendly Robot Tutor" 
                  className="max-h-[300px] object-contain drop-shadow-2xl"
                />
              </div>

              {/* Floating Subtitle Bubble */}
              <div className="subtitle absolute bottom-6 z-20 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-700">
                "{currentSubtitle}"
              </div>

              {/* Reward Badge (Floating) */}
              <div className="absolute top-4 right-4 reward-badge shadow-lg animate-bounce">
                <Star fill="#5D4037" size={24} />
                <span className="ml-2 font-bold">+10 XP</span>
              </div>
            </div>

            {/* HIGHLIGHT BAR */}
            <div className="bg-white rounded-full px-6 py-4 flex items-center gap-4 shadow-[var(--shadow-soft)] border-2 border-[var(--border-soft)]">
              <div className="bg-[var(--bg-learning)] p-3 rounded-full text-[var(--cta-voice)]">
                <Volume2 size={24} />
              </div>
              <div className="flex-1 overflow-hidden whitespace-nowrap mask-linear-fade">
                <span className="text-xl text-[var(--text-secondary)] font-medium">
                  <span className="text-[var(--cta-voice)] font-bold">Planets</span> revolve around the <span className="text-[var(--accent-coral)] font-bold">Sun</span>...
                </span>
              </div>
            </div>

          </section>
        </div>

        {/* ================= MIDDLE SECTION: EXPLANATION ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* IMAGE CARD */}
          <div className="md:col-span-1 card p-2 flex items-center justify-center bg-white border-4 border-[var(--bg-secondary)] overflow-hidden">
            <img 
              src={solarSystemImage} 
              alt="Solar System" 
              className="w-full h-full object-cover rounded-xl hover:scale-110 transition-transform duration-700"
            />
          </div>

          {/* TEXT EXPLANATION CARD */}
          <div className="md:col-span-2 card flex flex-col justify-center gap-4 relative overflow-hidden">
             {/* Decor */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--bg-learning)] rounded-full opacity-50 pointer-events-none"></div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[Comic Neue]">
              What is a Solar System?
            </h2>
            <p className="text-xl leading-relaxed text-[var(--text-secondary)] font-[Poppins]">
              Imagine a big family in space! The <span className="font-bold text-[var(--accent-coral)]">Sun</span> is the parent in the middle, and all the <span className="font-bold text-[var(--cta-voice)]">planets</span> (like Earth!) are the kids running in circles around it. 🏃‍♂️💨
            </p>
            
            <div className="flex gap-2 mt-2">
               <span className="bg-[var(--bg-learning)] text-[var(--cta-voice)] px-3 py-1 rounded-full text-sm font-bold">#Space</span>
               <span className="bg-[var(--bg-learning)] text-[var(--cta-voice)] px-3 py-1 rounded-full text-sm font-bold">#Science</span>
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
