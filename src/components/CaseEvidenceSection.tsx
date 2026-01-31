import { useRevealAnimation } from '@/hooks/useRevealAnimation';
import { useCounter } from '@/hooks/useCounter';

const CaseEvidenceSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useRevealAnimation();
  const { ref: flipkartRef, isVisible: flipkartVisible } = useRevealAnimation();
  const { ref: myntraRef, isVisible: myntraVisible } = useRevealAnimation();

  const flipkartCreators = useCounter(1000, flipkartVisible);
  const flipkartDays = useCounter(14, flipkartVisible);
  const flipkartROI = useCounter(216, flipkartVisible);
  const myntraNodes = useCounter(598, myntraVisible);

  return (
    <section id="proof" className="py-40 px-6 md:px-12 bg-black relative z-10">
      <div className="max-w-7xl mx-auto">
        <div
          ref={headerRef}
          className={`text-center mb-24 transition-all duration-1000 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h2 className="font-heading text-6xl md:text-[8rem] font-black mb-6 tracking-tighter italic uppercase">
            Case <span className="text-primary">Evidence.</span>
          </h2>
          <p className="text-muted-foreground uppercase tracking-[0.5em] text-[10px] font-black">
            Managed Network Output
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Flipkart Case */}
          <div
            ref={flipkartRef}
            className={`glass p-16 rounded-[3rem] border-primary/10 hover:bg-primary/[0.02] transition-all relative overflow-hidden group duration-1000 ${
              flipkartVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="absolute top-0 right-0 p-10 text-[10px] font-black text-primary">
              TYPE: MULTI-TIER ACTIVATION
            </div>
            <h4 className="text-5xl font-black mb-8 uppercase tracking-tighter">Flipkart</h4>
            <p className="text-muted-foreground text-lg mb-12 leading-relaxed font-light">
              Executed a <span className="text-white font-bold">1,000+ creator activation</span>{' '}
              within 14 days. Spread across specific categories (50K+ and 100K+ tiers) with
              structured orchestration.
            </p>
            <div className="grid md:grid-cols-3 gap-6 border-t border-white/10 pt-10">
              <div>
                <p className="text-3xl font-black text-white">
                  {flipkartCreators.toLocaleString()}+
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                  Creators
                </p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">{flipkartDays}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                  Days
                </p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">{flipkartROI}%</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                  ROI
                </p>
              </div>
            </div>
          </div>

          {/* Myntra Case */}
          <div
            ref={myntraRef}
            className={`glass p-16 rounded-[3rem] hover:bg-white/[0.03] transition-all relative overflow-hidden group duration-1000 ${
              myntraVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="absolute top-0 right-0 p-10 text-[10px] font-black text-muted-foreground group-hover:text-primary transition uppercase">
              Type: Orchestration Proof
            </div>
            <h4 className="text-5xl font-black mb-8 uppercase tracking-tighter">Myntra</h4>
            <p className="text-muted-foreground text-lg mb-12 leading-relaxed font-light">
              Direct management and orchestration of{' '}
              <span className="text-white font-bold">598 influencers</span> simultaneously. Zero
              manual friction achieved through platform logic.
            </p>
            <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-10">
              <div>
                <p className="text-3xl font-black text-white">{myntraNodes}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                  Nodes Orchestrated
                </p>
              </div>
              {/* <div>
                <p className="text-3xl font-black text-muted-foreground">COMPLETED</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                  Status
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaseEvidenceSection;
