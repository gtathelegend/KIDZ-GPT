import React, { useState } from "react";
import { Mic, User, Volume2, Star, ChevronRight } from "lucide-react";
import logoImg from "@assets/kidz-gpt_1767288550163.jpeg";
import robotImage from "@assets/generated_images/cute_3d_robot_character.png";
import solarSystemImage from "@assets/generated_images/cartoon_solar_system_illustration.png";

export default function Home() {
  const [isListening, setIsListening] = useState(false);

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
            <div className="card flex-1 flex flex-col relative overflow-hidden border-4 border-[var(--border-soft)]">
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10"></div>
              
              <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                {/* Chat Message: Kid */}
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-[var(--bg-learning)] text-[var(--text-primary)] px-4 py-3 rounded-2xl rounded-tr-none max-w-[90%] text-lg font-medium shadow-sm">
                    Tell me about planets!
                  </div>
                </div>

                {/* Chat Message: AI */}
                <div className="flex flex-col items-start gap-1">
                  <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-3 rounded-2xl rounded-tl-none max-w-[90%] text-lg font-medium shadow-sm">
                    Planets are huge round balls made of rock or gas that float in space! 🌍
                  </div>
                </div>

                 {/* Chat Message: Kid */}
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-[var(--bg-learning)] text-[var(--text-primary)] px-4 py-3 rounded-2xl rounded-tr-none max-w-[90%] text-lg font-medium shadow-sm">
                    Are they hot?
                  </div>
                </div>

                {/* Chat Message: AI */}
                <div className="flex flex-col items-start gap-1">
                  <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-3 rounded-2xl rounded-tl-none max-w-[90%] text-lg font-medium shadow-sm">
                    Some are super hot like Venus 🔥, and some are freezing cold like Neptune! ❄️
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent z-10"></div>
            </div>

            {/* MIC BUTTON */}
            <div className="card p-4 flex justify-center items-center">
              <button 
                className={`button ${isListening ? 'button-voice' : 'bg-white border-2 border-[var(--cta-voice)] text-[var(--cta-voice)]'} w-full flex justify-center gap-2 items-center text-xl shadow-none hover:shadow-md`}
                onClick={() => setIsListening(!isListening)}
              >
                <Mic size={24} className={isListening ? "animate-pulse" : ""} />
                {isListening ? "Listening..." : "Tap to Speak"}
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
                "Some are super hot like Venus!"
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
