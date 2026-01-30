import { useRevealAnimation } from '@/hooks/useRevealAnimation';

const ManualEraSection = () => {
  const { ref: leftRef, isVisible: leftVisible } = useRevealAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useRevealAnimation();

  return (
    <section id="logic" className="py-32 px-6 md:px-12 bg-[#050505] relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div
          ref={leftRef}
          className={`transition-all duration-1000 ${
            leftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h2 className="font-heading text-4xl md:text-6xl font-black mb-8 leading-tight">
            The Manual Era <br />
            <span className="text-muted-foreground italic uppercase tracking-tighter">Is Over.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Most agencies break under the weight of 50 creators. We built a platform to thrive at
            500+. We don't just "find people"—we deploy strategies across automated layers of{' '}
            <span className="text-white font-bold">Paid, Barter, and Elite Performance</span>{' '}
            modules.
          </p>
          <div className="space-y-6">
            <div className="flex items-start space-x-4 group">
              <div className="w-6 h-6 rounded-full border border-primary flex items-center justify-center text-[10px] text-primary group-hover:bg-primary group-hover:text-black transition-all">
                01
              </div>
          <p className="text-foreground/80 text-sm font-bold uppercase tracking-widest">
                Eliminate Logistics Debt
              </p>
            </div>
            <div className="flex items-start space-x-4 group">
              <div className="w-6 h-6 rounded-full border border-primary flex items-center justify-center text-[10px] text-primary group-hover:bg-primary group-hover:text-black transition-all">
                02
              </div>
              <p className="text-foreground/80 text-sm font-bold uppercase tracking-widest">
                Unified Result Intelligence
              </p>
            </div>
          </div>
        </div>

        <div
          ref={rightRef}
          className={`glass rounded-3xl p-2 aspect-square md:aspect-video relative overflow-hidden group transition-all duration-1000 ${
            rightVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-12">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Active Pipeline: 598 Nodes
              </span>
            </div>
            <div className="flex-grow flex items-end space-x-3">
              <div className="w-full bg-primary/10 h-[30%] rounded-t-lg border-t border-primary/20 hover:h-[40%] transition-all duration-500" />
              <div className="w-full bg-primary/20 h-[60%] rounded-t-lg border-t border-primary/30 hover:h-[70%] transition-all duration-500" />
              <div className="w-full bg-primary h-[90%] rounded-t-lg shadow-[0_0_30px_rgba(204,255,0,0.2)] hover:scale-x-105 transition-all" />
              <div className="w-full bg-primary/40 h-[45%] rounded-t-lg border-t border-primary/50 hover:h-[55%] transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManualEraSection;
