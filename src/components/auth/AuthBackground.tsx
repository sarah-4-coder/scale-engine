import { motion } from "framer-motion";
import FloatingInfluencerCards from "./FloatingInfluencerCards";

const AuthBackground = () => {
  return (
    <>
      {/* Base gradient background with mesh effect */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 122, 24, 0.15), transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.15), transparent 40%)
          `,
          backgroundSize: "200% 200%",
        }}
      />

      {/* Moving gradient beams */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "linear-gradient(45deg, transparent 0%, rgba(255, 122, 24, 0.1) 25%, transparent 50%, rgba(99, 102, 241, 0.1) 75%, transparent 100%)",
            "linear-gradient(45deg, transparent 0%, rgba(99, 102, 241, 0.1) 25%, transparent 50%, rgba(255, 122, 24, 0.1) 75%, transparent 100%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Dot matrix pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(255, 122, 24, 0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating influencer cards */}
      <FloatingInfluencerCards />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)",
        }}
      />

      {/* Top and bottom gradient fades */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </>
  );
};

export default AuthBackground;
