import { useEffect } from "react";
import { BrandThemeProvider } from "@/contexts/BrandThemeContext";

interface BrandLayoutProps {
  children: React.ReactNode;
}

const BrandLayout = ({ children }: BrandLayoutProps) => {
  useEffect(() => {
    // Add brand-theme class when brand pages mount
    document.body.classList.add("brand-theme");
    
    // Remove brand-theme class when brand pages unmount
    return () => {
      document.body.classList.remove("brand-theme");
    };
  }, []);

  return <BrandThemeProvider>{children}</BrandThemeProvider>;
};

export default BrandLayout;