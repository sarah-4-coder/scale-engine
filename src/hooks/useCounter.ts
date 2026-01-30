import { useEffect, useState } from 'react';

export const useCounter = (target: number, isVisible: boolean, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, isVisible, duration]);

  return count;
};
