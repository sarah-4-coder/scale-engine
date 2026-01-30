import { useParallax } from '@/hooks/useParallax';

const ParallaxBlobs = () => {
  const scrollY = useParallax();

  return (
    <>
      <div
        className="fixed w-96 h-96 rounded-full blur-[120px] pointer-events-none bg-primary/10"
        style={{
          top: '10%',
          left: '-10%',
          transform: `translateY(${scrollY * 0.05}px)`,
        }}
      />
      <div
        className="fixed w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-teal-400/5"
        style={{
          bottom: '10%',
          right: '-5%',
          transform: `translateY(${scrollY * -0.08}px)`,
        }}
      />
      <div
        className="fixed w-64 h-64 rounded-full blur-[120px] pointer-events-none bg-primary/5"
        style={{
          top: '40%',
          right: '15%',
          transform: `translateY(${scrollY * 0.12}px)`,
        }}
      />
    </>
  );
};

export default ParallaxBlobs;
