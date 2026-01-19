const Navigation = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed w-full z-50 glass py-4 px-6 md:px-12 flex justify-between items-center border-b border-border/50">
      <div className="text-2xl font-extrabold tracking-tighter">
        DOT<span className="text-primary">FLUENCE</span>
      </div>
      <div className="hidden md:flex space-x-10 text-[11px] uppercase tracking-wide-custom font-bold text-muted-foreground">
        <a href="#work" className="hover:text-foreground transition">
          Portfolio
        </a>
        <a href="#expertise" className="hover:text-foreground transition">
          Expertise
        </a>
        <a href="#ai-lab" className="hover:text-primary transition">
          AI Lab ✨
        </a>
      </div>
      <button
        onClick={scrollToContact}
        className="btn-primary px-7 py-2.5 rounded-full text-xs font-black uppercase tracking-widest"
      >
        Connect
      </button>
    </nav>
  );
};

export default Navigation;
