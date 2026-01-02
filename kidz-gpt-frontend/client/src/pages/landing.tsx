import React from "react";
import { Link } from "wouter";
import { Play, ChevronRight, Sparkles, Brain, Send, Star, Volume2 } from "lucide-react";
import logoImg from "@assets/kidz-gpt_1767288550163.jpeg";
import aiLearningImg from "@assets/generated_images/interactive_ai_learning_animation_for_kids.png";
import scienceChar from "@assets/generated_images/fun_educational_science_character.png";
import cuteRobotImg from "@assets/generated_images/cute_3d_robot_character.png";
import scienceExperimentImg from "@assets/generated_images/fun_science_experiment_illustration.png";
import kidsLearningHeroImg from "@assets/generated_images/kids_learning_with_ai_hero.png";
import solarSystemImg from "@assets/generated_images/cartoon_solar_system_illustration.png";
import drawingImg from "@assets/generated_images/creative_art_and_drawing_illustration.png";
import jackInBoxImg from "@assets/generated_images/fun_3d_toy_jack-in-the-box.png";

export default function Landing() {
  const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-learning)] flex flex-col font-[Poppins] animate-in fade-in duration-1000 relative overflow-hidden">
      {/* Background blobs (colorful, uses existing theme tokens) */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[var(--reward-gold)] opacity-25 blur-2xl"></div>
      <div className="pointer-events-none absolute top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[var(--info-teal)] opacity-20 blur-2xl"></div>
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-[var(--accent-coral)] opacity-15 blur-2xl"></div>
      {/* ================= NAVIGATION ================= */}
      <nav className="px-8 py-6 max-w-7xl mx-auto w-full slide-in-from-top-4 animate-in duration-500">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <a href="#home" onClick={scrollToSection("home")} className="flex items-center gap-2">
            <img src={logoImg} alt="KidzGPT Logo" className="h-14 md:h-20 object-contain" />
          </a>

          <div className="flex flex-wrap items-center justify-end gap-x-10 gap-y-3 text-[var(--text-secondary)] font-bold">
            <a
              href="#home"
              onClick={scrollToSection("home")}
              className="relative group text-[var(--text-primary)] transition-colors"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <a href="#how-it-works" onClick={scrollToSection("how-it-works")} className="relative group hover:text-[var(--text-primary)] transition-colors">
              How it Works
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <a href="#parents" onClick={scrollToSection("parents")} className="relative group hover:text-[var(--text-primary)] transition-colors">
              Parents
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <a href="#blog" onClick={scrollToSection("blog")} className="relative group hover:text-[var(--text-primary)] transition-colors">
              Blog
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <a href="#contact" onClick={scrollToSection("contact")} className="relative group hover:text-[var(--text-primary)] transition-colors">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full px-8 pb-20 space-y-32">
        
        {/* ================= HERO SECTION ================= */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 scroll-mt-24">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] leading-[1.1] font-[Comic Neue]">
              Your AI<br />
              Learning Friend
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
                <button className="bg-[var(--cta-voice)] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
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

        {/* ================= HOW IT WORKS ================= */}
        <section id="how-it-works" className="space-y-16 animate-in fade-in zoom-in-95 duration-1000 delay-500 scroll-mt-24">
          <div className="text-center space-y-4">
             <h2 className="text-5xl font-black text-[var(--text-primary)] font-[Comic Neue]">How it Works</h2>
             <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">
               Kids ask a question, KidzGPT explains it simply, and the character acts it out with fun animations.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: Volume2,
                title: "Ask by Voice",
                desc: "Tap the mic and speak — no typing needed.",
                bg: "bg-[var(--bg-secondary)]",
                accent: "border-[var(--cta-explore)]",
                image: cuteRobotImg,
                imageAlt: "Cute robot helper",
              },
              {
                icon: Brain,
                title: "Get a Kid-Friendly Answer",
                desc: "Short, clear explanations with simple examples.",
                bg: "bg-[var(--bg-learning)]",
                accent: "border-[var(--cta-voice)]",
                image: scienceExperimentImg,
                imageAlt: "Fun science experiment illustration",
              },
              {
                icon: Sparkles,
                title: "Watch it Come Alive",
                desc: "The character reacts and animates while explaining.",
                bg: "bg-[var(--bg-success)]",
                accent: "border-[var(--accent-coral)]",
                image: kidsLearningHeroImg,
                imageAlt: "Kids learning with AI",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`bg-white rounded-[3rem] border-4 border-[var(--border-soft)] border-b-8 ${step.accent} p-10 shadow-[var(--shadow-soft)] flex flex-col gap-6 group relative overflow-hidden`}
              >
                <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[var(--bg-secondary)] opacity-35"></div>

                <div className="relative flex items-start justify-between gap-6">
                  <div className={`w-20 h-20 rounded-[2rem] ${step.bg} flex items-center justify-center flex-shrink-0`}>
                    <step.icon size={40} className="text-[var(--text-primary)] opacity-80" />
                  </div>

                  <div className="hidden sm:block w-28 h-28 rounded-[2rem] bg-[var(--bg-learning)] border-2 border-[var(--border-soft)] p-3 shadow-[var(--shadow-soft)]">
                    <img src={step.image} alt={step.imageAlt} className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="relative space-y-3">
                  <h3 className="text-2xl font-black text-[var(--text-primary)]">{step.title}</h3>
                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{step.desc}</p>
                </div>

                {/* Mobile image */}
                <div className="sm:hidden relative w-full rounded-[2rem] bg-[var(--bg-learning)] border-2 border-[var(--border-soft)] p-4 shadow-[var(--shadow-soft)]">
                  <img src={step.image} alt={step.imageAlt} className="w-full h-40 object-contain" />
                </div>
              </div>
            ))}
          </div>

          {/* Keep the original “features” content style, now as an extra row */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-6">
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
          </div> */}
        </section>

        {/* ================= PARENTS ================= */}
        <section id="parents" className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center scroll-mt-24">
           <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-5xl font-black text-[var(--text-primary)] font-[Comic Neue] leading-tight">
                Parents Love It,
                <br />Kids Learn Faster
              </h2>
              <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-md">
                 Built for safe, kid-friendly learning — with simple explanations and playful interactions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                {[
                  "Short answers that stay on-topic",
                  "Voice-first: perfect for younger kids",
                  "Fun animations to keep attention",
                  "Learning habits that stick",
                ].map((text) => (
                  <div key={text} className="bg-white rounded-2xl border-2 border-[var(--border-soft)] px-5 py-4 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-[var(--bg-success)] flex items-center justify-center text-[var(--text-primary)] font-black">✓</div>
                      <p className="text-[var(--text-secondary)] font-semibold leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/learn">
                <button className="bg-[var(--cta-voice)] text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all">
                  Start Learning Now +
                </button>
              </Link>
           </div>
           <div className="bg-[var(--cta-voice)] rounded-[3rem] p-12 aspect-[4/3] flex items-center justify-center relative overflow-hidden order-1 lg:order-2 group">
              <img src={scienceChar} alt="Science Character" className="w-full h-full object-contain drop-shadow-2xl animate-float-slow" />
           </div>
        </section>

        {/* ================= BLOG ================= */}
        <section id="blog" className="space-y-16 scroll-mt-24">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-[var(--text-primary)] font-[Comic Neue]">Blog</h2>
            <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">
              Quick reads for parents — learning tips, activity ideas, and product updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Helping kids ask better questions",
                desc: "Simple prompts that unlock deeper curiosity.",
                image: solarSystemImg,
                accent: "bg-[var(--cta-explore)]",
              },
              {
                title: "Screen time, but smarter",
                desc: "How to use interactive learning responsibly.",
                image: drawingImg,
                accent: "bg-[var(--accent-soft-purple)]",
              },
              {
                title: "New lessons & features",
                desc: "What we’re building next for KidzGPT.",
                image: jackInBoxImg,
                accent: "bg-[var(--info-teal)]",
              },
            ].map((post) => (
              <div key={post.title} className="bg-white rounded-[3rem] border-4 border-[var(--border-soft)] p-10 shadow-[var(--shadow-soft)] overflow-hidden">
                <div className="space-y-4">
                  <div className={`w-full rounded-[2rem] ${post.accent} bg-opacity-20 p-4 border-2 border-[var(--border-soft)]`}>
                    <div className="bg-white/60 rounded-[1.5rem] p-4">
                      <img src={post.image} alt="" className="w-full h-40 object-contain" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[var(--text-primary)]">{post.title}</h3>
                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{post.desc}</p>
                  <div className="pt-2">
                    <button className="bg-[var(--cta-voice)] text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all text-sm">
                      Read More +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CONTACT ================= */}
        <section id="contact" className="bg-white rounded-[3rem] p-12 md:p-20 border-4 border-[var(--border-soft)] shadow-[var(--shadow-soft)] relative overflow-hidden scroll-mt-24">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--bg-secondary)] rounded-full translate-x-32 -translate-y-32 opacity-60"></div>
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-5xl font-black text-[var(--text-primary)] font-[Comic Neue]">Contact</h2>
              <p className="text-[var(--text-secondary)] font-medium text-xl leading-relaxed max-w-xl">
                Have a question, feedback, or a school inquiry? We’d love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:hello@kidzgpt.com"
                  className="bg-[var(--cta-voice)] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all text-center"
                >
                  Email Us
                </a>
                <Link href="/learn">
                  <button className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-8 py-3 rounded-xl font-bold border-2 border-[var(--border-soft)] hover:shadow-lg transition-all">
                    Try KidzGPT
                  </button>
                </Link>
              </div>
            </div>
            <div className="bg-[var(--info-teal)] rounded-[3rem] p-10 text-white shadow-xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Star size={22} fill="currentColor" />
                </div>
                <div>
                  <div className="text-2xl font-black">Support</div>
                  <div className="text-white/90 font-medium">We typically reply within 24–48 hours.</div>
                </div>
              </div>
              <div className="mt-8 space-y-4 text-white/95 font-semibold">
                <div className="flex items-center justify-between bg-white/10 rounded-2xl px-6 py-4">
                  <span>For parents</span>
                  <span className="font-black">Help & tips</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-2xl px-6 py-4">
                  <span>For schools</span>
                  <span className="font-black">Partnerships</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-2xl px-6 py-4">
                  <span>For creators</span>
                  <span className="font-black">Content ideas</span>
                </div>
              </div>
            </div>
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
                 <button className="bg-[var(--cta-voice)] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all">
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
               <a href="#home" onClick={scrollToSection("home")} className="relative group hover:text-[var(--text-primary)] transition-colors">
                 Home
                 <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
               </a>
               <a href="#how-it-works" onClick={scrollToSection("how-it-works")} className="relative group hover:text-[var(--text-primary)] transition-colors">
                 How it Works
                 <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
               </a>
               <a href="#" className="relative group hover:text-[var(--text-primary)] transition-colors">
                 Privacy
                 <span className="absolute -bottom-1 left-0 w-0 h-1 bg-[var(--cta-voice)] transition-all duration-300 group-hover:w-full rounded-full"></span>
               </a>
               <a href="#contact" onClick={scrollToSection("contact")} className="relative group hover:text-[var(--text-primary)] transition-colors">
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
