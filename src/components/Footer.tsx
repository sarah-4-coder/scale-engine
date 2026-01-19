const Footer = () => {
  return (
    <footer className="py-20 px-6 md:px-12 border-t border-border text-center text-muted-foreground bg-[hsl(0_0%_1%)] relative z-10">
      <div className="text-3xl font-black text-foreground tracking-tighter mb-8">
        DOT<span className="text-primary">FLUENCE</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-10">
        Scale at the speed of culture.
      </p>
      <div className="flex justify-center space-x-12 text-xs font-bold mb-12">
        <a href="#" className="hover:text-foreground transition">
          LinkedIn
        </a>
        <a href="#" className="hover:text-foreground transition">
          Instagram
        </a>
        <a
          href="mailto:dotfluencee@gmail.com"
          className="hover:text-primary transition"
        >
          dotfluencee@gmail.com
        </a>
      </div>
      <p className="text-[9px] uppercase tracking-widest font-bold">
        © 2026 DotFluence Infrastructure. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
