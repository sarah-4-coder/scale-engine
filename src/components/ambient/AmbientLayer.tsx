/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { Camera, Dumbbell, Code } from "lucide-react";
import { ThemeKey } from "@/theme/themes";

type Props = {
  themeKey: ThemeKey;
};

const Floating = ({
  children,
  x,
  y,
  duration = 30,
  opacity = 0.15,
}: any) => (
  <motion.div
    className="absolute"
    style={{ opacity }}
    animate={{
      y: [0, y, 0],
      x: [0, x, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
);

const AmbientLayer = ({ themeKey }: Props) => {
  /* ------------------------
     FASHION (LUXURY / EDITORIAL)
  ------------------------ */
  if (themeKey === "fashion") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f7f4] to-[#f1f1ee]" />

        {/* Floating editorial elements */}
        <Floating x={40} y={30} opacity={0.08}>
          <Camera size={180} color="#111827" />
        </Floating>

        <Floating x={-30} y={50} duration={40} opacity={0.05}>
          <div className="text-[200px] font-serif text-[#111827]">A</div>
        </Floating>
      </div>
    );
  }

  /* ------------------------
     TECH (FUTURISTIC / BUILDER)
  ------------------------ */
  if (themeKey === "tech") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#020617]" />

        {/* Glow layers */}
        <motion.div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity }}
        />

        {/* Floating icons */}
        <Floating x={60} y={40}>
          <Code size={160} color="#22d3ee" />
        </Floating>
      </div>
    );
  }

  /* ------------------------
     FITNESS (ENERGY / DISCIPLINE)
  ------------------------ */
  if (themeKey === "fitness") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#020617]" />

        {/* Energy glows */}
        <motion.div
          className="absolute top-0 left-1/3 w-[450px] h-[450px] bg-red-500/25 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/3 w-[450px] h-[450px] bg-green-500/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 22, repeat: Infinity }}
        />

        {/* Floating strength icon */}
        <Floating x={0} y={60} duration={28}>
          <Dumbbell size={160} color="#ef4444" />
        </Floating>
      </div>
    );
  }

  return null;
};

export default AmbientLayer;
