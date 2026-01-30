import {useRevealAnimation} from '@/hooks/useRevealAnimation';
import { Link } from 'react-router-dom';

interface CTASectionProps {
  onOpenBrandForm: () => void;
}

const CTASection = ({ onOpenBrandForm }: CTASectionProps) => {
  const { ref, isVisible } = useRevealAnimation();

  return (
    <section id="join" className="py-48 px-6 text-center relative overflow-hidden z-10">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto relative z-10 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <h2 className="font-heading text-6xl md:text-[8rem] font-black leading-none mb-12 tracking-tighter italic uppercase">
          Scale <br /> <span className="text-primary">Initiated.</span>
        </h2>
        <p className="text-muted-foreground text-lg md:text-2xl mb-16 max-w-2xl mx-auto font-light leading-relaxed">
          Access the SaaS infrastructure. Choose your portal entrance to begin.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div
            className="glass p-12 rounded-[2.5rem] border-primary/20 text-left hover:bg-primary/5 transition cursor-pointer group"
            onClick={onOpenBrandForm}
          >
            <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 text-primary">
              For Brands
            </h4>
            <p className="text-sm text-muted-foreground mb-10 leading-relaxed font-medium">
              Automate your influencer logistics. Request a campaign blueprint and full portal
              access.
            </p>
            <button className="btn-protocol w-full py-5 rounded-sm text-[10px]">
              Request Brand Access
            </button>
          </div>
          <div className="glass p-12 rounded-[2.5rem] border-white/10 text-left hover:bg-white/5 transition cursor-pointer group">
            <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">
              For Influencers
            </h4>
            <p className="text-sm text-muted-foreground mb-10 leading-relaxed font-medium">
              Join the high-scale network. Receive automated briefs, specifications, and secure
              outcomes.
            </p>
            <button className="bg-foreground text-background font-black w-full py-5 rounded-sm text-[10px] uppercase tracking-widest hover:bg-foreground/90 transition">
            <Link to="/login">
              Sign Up to Protocol
            </Link>
            </button>
          </div>
        </div>
        <p className="mt-24 text-[10px] uppercase font-black text-muted-foreground tracking-[0.5em]">
          Direct Operations: <span className="text-white">dotfluencee@gmail.com</span>
        </p>
      </div>
    </section>
  );
};

export default CTASection;
