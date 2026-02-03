import { BrandThemeProvider } from "@/contexts/BrandThemeContext";

interface BrandLayoutProps {
  children: React.ReactNode;
}

const BrandLayout = ({ children }: BrandLayoutProps) => {
  return <BrandThemeProvider>{children}</BrandThemeProvider>;
};

export default BrandLayout;