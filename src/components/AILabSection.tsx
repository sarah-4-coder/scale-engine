import { useState, useEffect, useRef } from "react";
import { Zap, Globe } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

const AILabSection = () => {
  const [niche, setNiche] = useState("");
  const [budget, setBudget] = useState("5-10 Lakhs");
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<{ title: string; content: string }[]>([]);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
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

  const callGemini = async (prompt: string) => {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "No response generated.";
  };

  const generateStrategy = async () => {
    if (!niche) {
      alert("Please specify brand context.");
      return;
    }

    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      alert("Please configure your API key to use the AI Lab.");
      return;
    }

    setShowPlaceholder(false);
    setIsLoading(true);
    setOutput([]);

    const prompt = `Act as DotFluence Head of Scale.
    Brand Niche: ${niche}
    Budget: ${budget}
    
    Provide a tight 4-point strategy for MASS SCALE execution:
    MIX: Nano/Micro/Macro split.
    PLATFORMS: Primary channels.
    IMPACT: Expected ROI metric.
    LOGISTICS: Mention how our Myntra/Flipkart scale engine handles this volume.
    
    Format strictly:
    MIX: [content]
    PLATFORMS: [content]
    IMPACT: [content]
    LOGISTICS: [content]
    
    Keep the response under 100 words. Straight to the point. No intro.`;

    try {
      const result = await callGemini(prompt);
      if (result) {
        const sections = result.split(/(?=MIX:|PLATFORMS:|IMPACT:|LOGISTICS:)/g);
        const parsed: { title: string; content: string }[] = [];

        sections.forEach((s: string) => {
          const titleMatch = s.match(/^(MIX:|PLATFORMS:|IMPACT:|LOGISTICS:)/);
          if (titleMatch) {
            const title = titleMatch[0].replace(":", "");
            const content = s.replace(titleMatch[0], "").trim();
            parsed.push({ title, content });
          }
        });

        setOutput(parsed);
      }
    } catch (error) {
      alert("Logistics link failed. Ensure API key is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="ai-lab"
      ref={sectionRef}
      className="py-32 px-6 md:px-12 bg-card relative z-10"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 reveal">
          <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
            Strategic <span className="text-primary">Lab ✨</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Instant logic-based campaign mapping.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 reveal">
          <div className="glass p-10 rounded-4xl border-primary/10 flex flex-col space-y-8">
            <h3 className="text-xl font-black uppercase tracking-widest flex items-center text-primary">
              <Globe className="w-5 h-5 mr-3" /> Parameters
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                  Niche
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Fintech Startup"
                  className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:border-primary outline-none text-foreground transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                  Target Budget
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:border-primary outline-none text-foreground appearance-none cursor-pointer"
                >
                  <option value="5-10 Lakhs">₹5 - 10 Lakhs</option>
                  <option value="10-25 Lakhs">₹10 - 25 Lakhs</option>
                  <option value="25-50 Lakhs">₹25 - 50 Lakhs</option>
                  <option value="50 Lakhs+">₹50 Lakhs +</option>
                </select>
              </div>
              <button
                onClick={generateStrategy}
                disabled={isLoading}
                className="btn-primary w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                <span>Compute</span>
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 glass rounded-4xl min-h-[500px] flex flex-col p-1 bg-gradient-to-br from-primary/5 to-transparent relative">
            {showPlaceholder && (
              <div className="m-auto text-center p-12">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 opacity-20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m2-1l-2-1m2 1v2.5M4 7l2-1M4 7l2 1M4 7v2.5M10 4L8 5m2-1l-2-1m2 1v2.5M8 18l-2 1m2-1l-2-1m2 1v2.5"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  Awaiting parameters to initialize strategy engine.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="m-auto text-center p-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin-slow mx-auto mb-6" />
                <p className="animate-pulse-slow text-primary text-[10px] font-black uppercase tracking-ultra">
                  Synching Market Nodes...
                </p>
              </div>
            )}

            {!isLoading && output.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-10 overflow-y-auto custom-scrollbar">
                {output.map((item, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 border border-border p-6 rounded-2xl flex flex-col space-y-3"
                  >
                    <div className="text-primary text-[9px] font-black uppercase tracking-wide-custom opacity-80">
                      {item.title}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AILabSection;
