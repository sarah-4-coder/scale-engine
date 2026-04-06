import { useRef, useState, useCallback, useEffect } from 'react';

export const useDragToScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const startDragging = useCallback((pageX: number) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const moveDragging = useCallback((pageX: number) => {
    if (!isDragging || !ref.current) return;
    const x = pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Adjusted scroll speed
    ref.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click and ignore if clicking on buttons/inputs
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('select')) return;
    
    startDragging(e.pageX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    moveDragging(e.pageX);
  };

  // Touch event handlers for mobile-like interaction
  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('select')) return;
    
    startDragging(e.touches[0].pageX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    moveDragging(e.touches[0].pageX);
  };

  return {
    ref,
    onMouseDown,
    onMouseMove,
    onMouseUp: stopDragging,
    onMouseLeave: stopDragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd: stopDragging,
    className: isDragging ? 'cursor-grabbing select-none active-dragging' : 'cursor-grab'
  };
};
