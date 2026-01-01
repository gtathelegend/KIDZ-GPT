import React from "react";
import { Link } from "wouter";
import { Play, ChevronRight, Menu, Search, Sparkles, Brain, Rocket, Send, Star, Volume2 } from "lucide-react";
import logoImg from "@assets/kidz-gpt_1767288550163.jpeg";
import aiLearningImg from "@assets/generated_images/interactive_ai_learning_animation_for_kids.png";
import scienceChar from "@assets/generated_images/fun_educational_science_character.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col font-[Poppins] animate-in fade-in duration-1000">
      {/* ================= NAVIGATION ================= */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full slide-in-from-top-4 animate-in duration-500">
        <div className="flex items-center gap-2">
           <img src={logoImg} alt="KidzGPT Logo" className="h-12 md:h-16 object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-8 text-[var(--text-secondary)] font-bold">
          <Link href="/" className="relative group text-[var(--text-primary)] transition-colors">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
          </Link>
          <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
            How it Works
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
          </a>
          <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
            Parents
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
          </a>
          <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
            Blog
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
          </a>
          <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-[var(--text-primary)] hover:scale-110 transition-transform"><Search size={22}/></button>
          <button className="text-[var(--text-primary)] hover:scale-110 transition-transform"><Menu size={22}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full px-8 pb-20 space-y-32">
        
        {/* ================= HERO SECTION ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] leading-[1.1] font-[Comic Neue]">
              Your Best AI<br />
              Learning Friend<br />
              for Kids
            </h1>
            <div className="flex items-center gap-4 max-w-md">
               <div className="h-12 w-12 rounded-full bg-[var(--bg-secondary)] flex-shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-2xl">
                 🤖
               </div>
               <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                 Interactive animations and engaging experiences that bring children's questions to life with the power of AI.
               </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/learn">
                <button className="bg-[var(--cta-voice)] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2">
                  Get Started <ChevronRight size={20}/>
                </button>
              </Link>
              <button className="flex items-center gap-3 font-bold text-[var(--text-primary)] hover:text-[var(--cta-voice)] transition-colors group">
                <div className="h-10 w-10 rounded-full border-2 border-[var(--cta-voice)] flex items-center justify-center group-hover:bg-[var(--cta-voice)] group-hover:text-white transition-all">
                  <Play size={16} fill="currentColor" />
                </div>
                See it in Action
              </button>
            </div>

            {/* Stats Card */}
            <div className="bg-[var(--cta-voice)] rounded-[2rem] p-8 flex justify-between items-center text-white shadow-xl max-w-lg mt-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
               <div className="text-center z-10">
                 <div className="text-sm opacity-80 font-medium">Lessons</div>
                 <div className="text-3xl font-black">1000+</div>
               </div>
               <div className="h-10 w-[1px] bg-white/20"></div>
               <div className="text-center z-10">
                 <div className="text-sm opacity-80 font-medium">Explorers</div>
                 <div className="text-3xl font-black">20k+</div>
               </div>
               <div className="h-10 w-[1px] bg-white/20"></div>
               <div className="text-center z-10">
                 <div className="text-sm opacity-80 font-medium">Happy Kids</div>
                 <div className="text-3xl font-black">45k+</div>
               </div>
            </div>
          </div>

          <div className="relative">
             <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--bg-secondary)] rounded-full animate-bounce"></div>
             <div className="absolute bottom-20 -left-10 w-16 h-16 bg-[var(--accent-coral)] rounded-full animate-pulse opacity-50"></div>
             
             <img 
               src={aiLearningImg} 
               alt="Interactive Learning" 
               className="w-full max-w-[550px] mx-auto drop-shadow-2xl animate-float rounded-[3rem] border-8 border-white"
             />
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="space-y-16 animate-in fade-in zoom-in-95 duration-1000 delay-500">
          <div className="text-center space-y-4">
             <h2 className="text-5xl font-black text-[var(--text-primary)] font-[Comic Neue]">Magical Features</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Brain, title: "AI-Powered Answers", desc: "Every question answered with simple, fun explanations kids love.", bg: "bg-blue-100" },
              { icon: Sparkles, title: "Live Animations", desc: "Watch concepts come to life with magical interactive 3D visuals.", bg: "bg-purple-100" },
              { icon: Volume2, title: "Voice Interaction", desc: "Talk to your AI friend just like a real person. No typing needed!", bg: "bg-green-100" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-6 group">
                <div className={`w-full aspect-square rounded-[3rem] ${feature.bg} flex items-center justify-center p-8 transition-transform group-hover:-translate-y-4 duration-500 relative overflow-hidden`}>
                   <feature.icon size={80} className="text-[var(--text-primary)] opacity-80" />
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-2xl font-black text-[var(--text-primary)]">{feature.title}</h3>
                   <p className="text-[var(--text-secondary)] font-medium max-w-[250px] mx-auto">{feature.desc}</p>
                   <button className="bg-[var(--cta-voice)] text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all text-sm">
                     Learn More +
                   </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= ENGAGING EXPERIENCE ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-5xl font-black text-[var(--text-primary)] font-[Comic Neue] leading-tight">
                Engaging Learning<br />Experience
              </h2>
              <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-md">
                 Our platform provides interactive animations for every question, turning curiosity into a world of discovery.
              </p>
              <Link href="/learn">
                <button className="bg-[var(--cta-voice)] text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all">
                  Start Learning Now +
                </button>
              </Link>
           </div>
           <div className="bg-[var(--cta-voice)] rounded-[3rem] p-12 aspect-[4/3] flex items-center justify-center relative overflow-hidden order-1 lg:order-2 group">
              <img src={scienceChar} alt="Science Character" className="w-full h-full object-contain drop-shadow-2xl animate-float-slow" />
           </div>
        </section>

        {/* ================= NEWSLETTER ================= */}
        <section className="bg-[var(--info-teal)] rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 group">
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32"></div>
           <div className="md:w-1/3 flex justify-center">
              <img src={logoImg} alt="KidzGPT Mascot" className="w-48 h-48 object-contain drop-shadow-xl group-hover:scale-110 transition-transform bg-white/20 p-4 rounded-full" />
           </div>
           <div className="md:w-2/3 space-y-8 text-center md:text-left">
              <h2 className="text-5xl font-black text-white font-[Comic Neue]">Join the Adventure</h2>
              <p className="text-white/90 text-xl font-medium max-w-xl">
                 Stay updated with new lessons, magical animations, and learning tips for your little ones.
              </p>
              <div className="bg-white p-2 rounded-2xl flex items-center max-w-xl shadow-xl">
                 <input 
                   type="email" 
                   placeholder="Parents' email address" 
                   className="flex-1 px-6 py-3 outline-none text-[var(--text-primary)] font-medium"
                 />
                 <button className="bg-[var(--cta-voice)] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-all">
                   Subscribe <Send size={18} />
                 </button>
              </div>
           </div>
        </section>
      </main>

      <footer className="bg-white border-t border-[var(--border-soft)] py-12 px-8">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
               <img src={logoImg} alt="KidzGPT" className="h-8 object-contain" />
            </div>
            <div className="flex items-center gap-8 text-[var(--text-secondary)] font-bold">
               <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
                 Home
                 <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
               </a>
               <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
                 How it Works
                 <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
               </a>
               <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
                 Privacy
                 <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
               </a>
               <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
                 Contact
                 <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
               </a>
            </div>
            <div className="flex items-center gap-4">
               <div className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)]">
                 <Star size={16} fill="currentColor" />
               </div>
            </div>
         </div>
      </footer>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(-5deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
