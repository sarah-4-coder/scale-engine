import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenBrandForm: () => void;
}

const Navbar = ({ onOpenBrandForm }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav
        className={`fixed w-full z-[100] px-6 md:px-12 flex justify-between items-center transition-all duration-500 ${
          isScrolled ? 'glass py-4' : 'py-6'
        }`}
      >
        <div
          className="flex items-center space-x-3 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-sm rotate-45 group-hover:bg-primary group-hover:rotate-0 transition-all duration-500">
            <div className="w-2 h-2 bg-black -rotate-45 group-hover:rotate-0" />
          </div>
          <span className="font-heading font-bold text-2xl tracking-tighter uppercase">
            DOT<span className="text-primary">FLUENCE</span>
          </span>
        </div>

        <div className="hidden md:flex space-x-12 text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground">
          <a href="#logic" className="hover:text-white transition">
            The Logic
          </a>
          <a href="#services" className="hover:text-white transition">
            Capabilities
          </a>
          <a href="#proof" className="hover:text-white transition text-primary">
            Evidence
          </a>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <a
            href="/login"
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition"
          >
            Login
          </a>
          <button
            onClick={onOpenBrandForm}
            className="btn-protocol px-6 py-2.5 rounded-sm text-[10px]"
          >
            Get Access
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-foreground hover:text-primary transition-colors z-[110]"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[99] bg-background/95 backdrop-blur-lg transition-all duration-500 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <a
            href="#logic"
            onClick={closeMobileMenu}
            className="text-2xl font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition"
          >
            The Logic
          </a>
          <a
            href="#services"
            onClick={closeMobileMenu}
            className="text-2xl font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition"
          >
            Capabilities
          </a>
          <a
            href="#proof"
            onClick={closeMobileMenu}
            className="text-2xl font-black uppercase tracking-widest text-primary transition"
          >
            Evidence
          </a>
          <div className="pt-8 flex flex-col items-center space-y-6">
            <a
              href="/login"
              onClick={closeMobileMenu}
              className="text-lg font-black uppercase tracking-widest text-muted-foreground hover:text-white transition"
            >
              Login
            </a>
            <button
              onClick={() => {
                closeMobileMenu();
                onOpenBrandForm();
              }}
              className="btn-protocol px-8 py-4 rounded-sm text-sm"
            >
              Get Access
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
