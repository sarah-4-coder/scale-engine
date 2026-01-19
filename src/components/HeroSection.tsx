import { useEffect, useRef } from "react";

const HeroSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const reveals = sectionRef.current?.querySelectorAll(".reveal");
    reveals?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative pt-32 pb-20 px-6 md:px-12 flex flex-col items-center text-center min-h-screen justify-center z-10"
    >
      <div className="max-w-5xl">
        <span className="reveal inline-block py-1.5 px-4 rounded-full border border-primary/30 text-primary text-[10px] font-black mb-8 tracking-ultra uppercase bg-primary/5">
          Scale-First Architecture
        </span>
        <h1 className="reveal text-6xl md:text-[9rem] font-black leading-[0.9] mb-10 tracking-tighter">
          The Logistics <br /> <span className="text-gradient">Engine</span>
        </h1>
        <p className="reveal text-muted-foreground text-lg md:text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
          Infrastructure built for mass-influence. We handle the complexity of{" "}
          <span className="text-foreground">500+ creator campaigns</span> while
          others get stuck at 50.
        </p>
        <div className="reveal flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 justify-center">
          <a
            href="#work"
            className="btn-primary px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest"
          >
            Case Studies
          </a>
          <button
            onClick={scrollToContact}
            className="glass px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest border-border hover:bg-muted/50 transition-all"
          >
            Get Proposal
          </button>
        </div>
      </div>

      {/* Floating Stats Bar */}
      <div className="reveal relative grid grid-cols-2 md:grid-cols-4 gap-12 mt-32 w-full max-w-6xl glass p-10 rounded-4xl border-border shadow-2xl">
        <div className="md:border-r border-border/50">
          <div className="text-5xl font-black text-primary tracking-tighter">
            1000+
          </div>
          <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-2">
            Vetted Network
          </div>
        </div>
        <div className="md:border-r border-border/50">
          <div className="text-5xl font-black text-primary tracking-tighter">
            598
          </div>
          <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-2">
            Max Execution
          </div>
        </div>
        <div className="md:border-r border-border/50">
          <div className="text-5xl font-black text-primary tracking-tighter">
            ₹5M+
          </div>
          <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-2">
            Payout Volume
          </div>
        </div>
        <div>
          <div className="text-5xl font-black text-primary tracking-tighter">
            24h
          </div>
          <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-2">
            SLA Tracking
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
