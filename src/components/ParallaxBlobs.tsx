import { useEffect, useState } from "react";

const ParallaxBlobs = () => {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScroll(window.pageYOffset);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] will-change-transform"
        style={{
          transform: `translate(${scroll * 0.1}px, ${scroll * 0.2}px)`,
        }}
      />
      <div
        className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-teal/10 rounded-full blur-[150px] will-change-transform"
        style={{
          transform: `translate(${-scroll * 0.15}px, ${-scroll * 0.1}px)`,
        }}
      />
      <div
        className="absolute top-[40%] right-[15%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] will-change-transform"
        style={{
          transform: `translateY(${scroll * 0.3}px)`,
        }}
      />
    </div>
  );
};

export default ParallaxBlobs;
