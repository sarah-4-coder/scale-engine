const Footer = () => {
  return (
    <footer className="py-20 border-t border-white/5 px-6 md:px-12 bg-black flex flex-col md:flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground z-10 relative">
      <div className="mb-6 md:mb-0">
        © 2026 DotFluence Infrastructure // The Influence Protocol
      </div>
      <div className="flex space-x-12">
        <a
          href="https://instagram.com/dot.fluence"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-500 transition"
        >
          Instagram
        </a>
        <a href="#" className="hover:text-blue-500 transition">
          LinkedIn
        </a>
      </div>
      <div className="mt-6 md:mt-0 text-white/40">System built for the 1%</div>
    </footer>
  );
};

export default Footer;
