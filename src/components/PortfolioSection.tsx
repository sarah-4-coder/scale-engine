import { useEffect, useRef } from "react";
import { ShoppingBag, Shield, Smartphone } from "lucide-react";

const portfolioItems = [
  {
    icon: ShoppingBag,
    title: "Myntra Blitz",
    description:
      "598 influencers. 14 days. Seamless payment cycles and automated link verification for India's fashion giant.",
    tag: "Mass Scale",
    featured: false,
  },
  {
    icon: Shield,
    title: "Flipkart Elite",
    description:
      "Tier-1 management (100K+ followers). Securely processed ₹2.8M in negotiated and non-negotiated payouts.",
    tag: "High Value",
    featured: true,
  },
  {
    icon: Smartphone,
    title: "Nokia Tech",
    description:
      "250+ targeted niche tech profiles. Precise advocacy and specification-based storytelling across multiple quarters.",
    tag: "Niche Advocacy",
    featured: false,
  },
];

const PortfolioSection = () => {
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

  return (
    <section
      id="work"
      ref={sectionRef}
      className="py-32 px-6 md:px-12 z-10 relative"
    >
      <div className="flex flex-col md:flex-row justify-between items-end mb-24 reveal">
        <div className="max-w-2xl">
          <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter">
            Direct <span className="text-primary">Proof</span>
          </h2>
          <p className="text-muted-foreground text-xl">
            High-fidelity execution metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {portfolioItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`reveal glass p-10 rounded-4xl transition-all hover:scale-[1.02] ${
                item.featured
                  ? "border-primary/30 bg-primary/[0.02]"
                  : "border-border"
              }`}
            >
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 text-primary ${
                  item.featured ? "bg-primary/20" : "bg-primary/10"
                }`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tighter">
                {item.title}
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {item.description}
              </p>
              <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground px-4 py-1.5 rounded-full">
                {item.tag}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PortfolioSection;
