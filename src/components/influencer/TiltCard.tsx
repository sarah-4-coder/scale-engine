import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export const TiltCard = ({
  children,
  className = "",
  style = {},
  perspective = 1000,
  maxRotation = 15,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  perspective?: number;
  maxRotation?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [maxRotation, -maxRotation]), {
    damping: 30,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxRotation, maxRotation]), {
    damping: 30,
    stiffness: 200,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        perspective,
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
      className={className}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
    >
      {children}
    </motion.div>
  );
};
