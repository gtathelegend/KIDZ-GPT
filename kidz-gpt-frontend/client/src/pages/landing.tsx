import React from "react";
import { Link } from "wouter";
import { Play, ChevronRight, Sparkles, Brain, Send, Star, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const blogPosts = [
    {
      id: "better-questions",
      title: "Helping kids ask better questions",
      desc: "Simple prompts that unlock deeper curiosity.",
      image: solarSystemImg,
      accent: "bg-[var(--cta-explore)]",
      content: {
        intro:
          "Kids learn faster when they ask clear, curious questions. Here are a few easy ways to guide them (without giving the answer away).",
        bullets: [
          "Start with “What do you notice?” to warm up their thinking.",
          "Try “Why do you think that happens?” to invite reasoning.",
          "Ask “What if we change one thing?” to explore cause-and-effect.",
          "Finish with “How could we check?” to build a science mindset.",
        ],
        outro:
          "Tip: praise the question, not just the answer — it builds confidence and curiosity.",
      },
    },
    {
      id: "screen-time-smarter",
      title: "Screen time, but smarter",
      desc: "How to use interactive learning responsibly.",
      image: drawingImg,
      accent: "bg-[var(--accent-soft-purple)]",
      content: {
        intro:
          "Not all screen time is the same. Interactive learning can be a win when it's short, guided, and balanced.",
        bullets: [
          "Keep sessions short (5-10 minutes) for younger kids.",
          "Use “1 question, 1 takeaway” so the lesson feels complete.",
          "Ask your child to explain it back in their own words.",
          "Pair with an offline activity (draw it, act it out, build it).",
        ],
        outro:
          "Tip: make it social — join them for the first minute and let them lead.",
      },
    },
    {
      id: "new-features",
      title: "New lessons & features",
      desc: "What we're building next for KidzGPT.",
      image: jackInBoxImg,
      accent: "bg-[var(--info-teal)]",
      content: {
        intro:
          "We're focused on making learning more playful, clearer, and more supportive for parents and schools.",
        bullets: [
          "More kid-friendly lesson packs (space, animals, volcanoes, and more).",
          "Better character reactions that match the explanation.",
          "Parent tips that suggest follow-up questions and mini activities.",
          "Smoother experience across devices.",
        ],
        outro:
          "Have a feature request? Send us a message in the Contact section below.",
      },
    },
  ] as const;

  const [isBlogModalOpen, setIsBlogModalOpen] = React.useState(false);
  const [activeBlogId, setActiveBlogId] = React.useState<string | null>(null);
  const activeBlog = blogPosts.find((p) => p.id === activeBlogId) ?? null;

  const openBlog = (id: string) => {
    setActiveBlogId(id);
    setIsBlogModalOpen(true);
  };

  const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent("KidzGPT Contact");
    const body = encodeURIComponent(
      [`Name: ${name || "(not provided)"}`, `Email: ${email || "(not provided)"}`, "", message || "(no message)"]
        .join("\n")
        .trim(),
    );

    window.location.href = `mailto:hello@kidzgpt.com?subject=${subject}&body=${body}`;
    form.reset();
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
                 <div className="text-sm opacity-80 font-medium">Languages</div>
                 <div className="text-3xl font-black">15</div>
               </div>
               <div className="h-10 w-[1px] bg-white/20"></div>
               <div className="text-center z-10">
                 <div className="text-sm opacity-80 font-medium">Ages</div>
                 <div className="text-3xl font-black">5-12</div>
               </div>
               <div className="h-10 w-[1px] bg-white/20"></div>
               <div className="text-center z-10">
                 <div className="text-sm opacity-80 font-medium">Characters</div>
                 <div className="text-3xl font-black">3</div>
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
                image: cuteRobotImg,
                imageAlt: "Cute robot helper",
              },
              {
                icon: Brain,
                title: "Get a Kid-Friendly Answer",
                desc: "Short, clear explanations with simple examples.",
                bg: "bg-[var(--bg-learning)]",
                image: scienceExperimentImg,
                imageAlt: "Fun science experiment illustration",
              },
              {
                icon: Sparkles,
                title: "Watch it Come Alive",
                desc: "The character reacts and animates while explaining.",
                bg: "bg-[var(--bg-success)]",
                image: kidsLearningHeroImg,
                imageAlt: "Kids learning with AI",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-[var(--bg-learning)] rounded-[3rem] border-4 border-[var(--border-soft)] border-b-8 border-[var(--cta-voice)] p-10 shadow-[var(--shadow-soft)] flex flex-col gap-6 group relative overflow-hidden"
              >
                {/* Vibrant background blobs (token-based colors) */}
                <div className="pointer-events-none absolute -top-14 -right-14 w-44 h-44 rounded-full bg-[var(--cta-explore)] opacity-30 blur-sm"></div>
                <div className="pointer-events-none absolute top-24 -left-16 w-56 h-56 rounded-full bg-[var(--info-teal)] opacity-20 blur-sm"></div>
                <div className="pointer-events-none absolute -bottom-20 right-6 w-64 h-64 rounded-full bg-[var(--accent-coral)] opacity-20 blur-sm"></div>

                {/* Inner surface for readability */}
                <div className="pointer-events-none absolute inset-3 rounded-[2.3rem] bg-white/80"></div>

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
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-[3rem] border-4 border-[var(--border-soft)] p-10 shadow-[var(--shadow-soft)] overflow-hidden">
                <div className="space-y-4">
                  <div className={`w-full rounded-[2rem] ${post.accent} bg-opacity-20 p-4 border-2 border-[var(--border-soft)]`}>
                    <div className="bg-white/60 rounded-[1.5rem] p-4">
                      <img src={post.image} alt="" className="w-full h-40 object-contain" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[var(--text-primary)]">{post.title}</h3>
                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{post.desc}</p>
                  <div className="pt-2">
                    <button
                      onClick={() => openBlog(post.id)}
                      className="bg-[var(--cta-voice)] text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all text-sm"
                    >
                      Learn More +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Post Modal */}
        <Dialog
          open={isBlogModalOpen}
          onOpenChange={(open) => {
            setIsBlogModalOpen(open);
            if (!open) setActiveBlogId(null);
          }}
        >
          <DialogContent className="max-w-2xl bg-white border-4 border-[var(--border-soft)] rounded-[2.5rem]">
            {activeBlog ? (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black text-[var(--text-primary)] font-[Comic Neue]">
                    {activeBlog.title}
                  </DialogTitle>
                  <DialogDescription className="text-[var(--text-secondary)] font-semibold">
                    {activeBlog.desc}
                  </DialogDescription>
                </DialogHeader>

                <div className={`w-full rounded-[2rem] ${activeBlog.accent} bg-opacity-20 p-4 border-2 border-[var(--border-soft)]`}>
                  <div className="bg-white/70 rounded-[1.5rem] p-4">
                    <img src={activeBlog.image} alt="" className="w-full h-56 object-contain" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                    {activeBlog.content.intro}
                  </p>

                  <div className="bg-[var(--bg-learning)] rounded-[2rem] border-2 border-[var(--border-soft)] p-6">
                    <ul className="list-disc pl-6 space-y-2 text-[var(--text-secondary)] font-semibold">
                      {activeBlog.content.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                    {activeBlog.content.outro}
                  </p>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* ================= CONTACT + NEWSLETTER (SINGLE BOX) ================= */}
        <section
          id="contact"
          className="bg-white rounded-[3rem] p-12 md:p-20 border-4 border-[var(--border-soft)] shadow-[var(--shadow-soft)] relative overflow-hidden scroll-mt-24"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--bg-secondary)] rounded-full translate-x-32 -translate-y-32 opacity-60"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[var(--info-teal)] rounded-full opacity-15"></div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* LEFT: CONTACT FORM */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-5xl font-black text-[var(--text-primary)] font-[Comic Neue]">Contact</h2>
                <p className="text-[var(--text-secondary)] font-medium text-xl leading-relaxed max-w-xl">
                  Have a question, feedback, or a school inquiry? Send us a message.
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[var(--text-secondary)] font-bold">Your Name</label>
                    <input
                      name="name"
                      type="text"
                      placeholder="Alex"
                      className="w-full bg-[var(--bg-learning)] border-2 border-[var(--border-soft)] rounded-2xl px-5 py-3 outline-none text-[var(--text-primary)] font-medium shadow-[var(--shadow-soft)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[var(--text-secondary)] font-bold">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full bg-[var(--bg-learning)] border-2 border-[var(--border-soft)] rounded-2xl px-5 py-3 outline-none text-[var(--text-primary)] font-medium shadow-[var(--shadow-soft)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[var(--text-secondary)] font-bold">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell us what you need help with..."
                    className="w-full bg-[var(--bg-learning)] border-2 border-[var(--border-soft)] rounded-2xl px-5 py-3 outline-none text-[var(--text-primary)] font-medium shadow-[var(--shadow-soft)] resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="submit"
                    className="bg-[var(--cta-voice)] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all text-center"
                  >
                    Send Message
                  </button>
                  <Link href="/learn">
                    <button
                      type="button"
                      className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-8 py-3 rounded-xl font-bold border-2 border-[var(--border-soft)] hover:shadow-lg transition-all"
                    >
                      Try KidzGPT
                    </button>
                  </Link>
                </div>
              </form>
            </div>

            {/* RIGHT: SUPPORT + NEWSLETTER INSIDE SAME OUTER BOX */}
            <div className="space-y-8">
              <div className="bg-[var(--info-teal)] rounded-[3rem] p-10 text-white shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Star size={22} fill="currentColor" />
                  </div>
                  <div>
                    <div className="text-2xl font-black">Support</div>
                    <div className="text-white/90 font-medium">We typically reply within 24-48 hours.</div>
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

              <div className="bg-[var(--info-teal)] rounded-[3rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-56 h-56 bg-white/10 rounded-full -translate-x-24 -translate-y-24"></div>
                <div className="relative space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                      <img src={logoImg} alt="KidzGPT" className="h-10 object-contain" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">Join the Adventure</div>
                      <div className="text-white/90 font-medium">Get updates and learning tips.</div>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-2xl flex items-center gap-2 shadow-xl">
                    <input
                      type="email"
                      placeholder="Parents' email address"
                      className="flex-1 px-4 py-3 outline-none text-[var(--text-primary)] font-medium rounded-xl"
                    />
                    <button className="bg-[var(--cta-voice)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all">
                      Subscribe <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
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
