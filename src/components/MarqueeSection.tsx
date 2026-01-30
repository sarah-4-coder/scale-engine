import { useRevealAnimation } from '@/hooks/useRevealAnimation';

const niches = [
  { title: 'Fashion', subtitle: 'Lookbooks & Outfit Inspiration' },
  { title: 'Gaming', subtitle: 'Gameplay & Live Streams' },
  { title: 'Technology', subtitle: 'Unboxing & Deep Reviews' },
  { title: 'Beauty', subtitle: 'Makeup & Skincare Routines' },
  { title: 'Fitness', subtitle: 'Workouts & Diet Tips' },
  { title: 'Travel', subtitle: 'Vlogs & Destination Guides' },
  { title: 'Education', subtitle: 'Tutorials & Skill Dev' },
  { title: 'Automobile', subtitle: 'Reviews & Feature Highlights' },
];

const MarqueeSection = () => {
  const { ref, isVisible } = useRevealAnimation();

  return (
    <section className="py-24 bg-[#030303] border-y border-white/5 relative z-10 overflow-hidden">
      <h3
        ref={ref}
        className={`font-heading text-3xl font-black mb-16 uppercase text-center tracking-tighter transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        Niche <span className="text-primary">Authority Modules</span>
      </h3>

      <div
        className="flex overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <div className="flex shrink-0 gap-8 py-8 animate-marquee hover:[animation-play-state:paused]">
          {[...niches, ...niches].map((niche, index) => (
            <div
              key={index}
              className="glass px-10 py-6 rounded-2xl border-white/5 flex flex-col min-w-[300px]"
            >
              <h5 className="text-primary text-xs font-black mb-2 uppercase tracking-widest">
                {niche.title}
              </h5>
              <p className="text-[9px] text-muted-foreground uppercase">{niche.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarqueeSection;
