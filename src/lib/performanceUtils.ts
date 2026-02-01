/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================
// PERFORMANCE UTILITIES
// ============================================

/**
 * Debounce function - delays execution until after wait time
 * Use for: search inputs, filter changes, window resize
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 * Use for: scroll events, mouse move, frequent updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): void {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}

/**
 * Batch multiple setState calls into one render
 * Use React 18's automatic batching, but this ensures it for older code
 */
export const batchUpdates = <T,>(updates: Array<() => void>) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

/**
 * Prefetch data for better perceived performance
 */
export const prefetchRoute = (path: string) => {
  // Trigger route prefetch
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
};

/**
 * Check if element is in viewport (for lazy loading)
 */
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Request idle callback wrapper (execute when browser is idle)
 */
export const runWhenIdle = (callback: () => void, options?: IdleRequestOptions) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(callback, 1);
};

/**
 * Measure component render time (development only)
 */
export const measureRender = (componentName: string, callback: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    callback();
    const end = performance.now();
    console.log(`${componentName} rendered in ${(end - start).toFixed(2)}ms`);
  } else {
    callback();
  }
};

/**
 * Memoize expensive calculations
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Get optimized image URL with size parameters
 */
export const getOptimizedImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return '';
  
  // If using Supabase storage, add transform parameters
  const urlObj = new URL(url);
  
  if (width) {
    urlObj.searchParams.set('width', width.toString());
  }
  
  if (height) {
    urlObj.searchParams.set('height', height.toString());
  }
  
  // Add format for better compression
  urlObj.searchParams.set('format', 'webp');
  
  return urlObj.toString();
};

/**
 * Chunk large arrays for better performance
 */
export const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Deep comparison for React.memo
 */
export const deepEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(label: string) {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measure(label: string, callback: () => void): void {
    this.start(label);
    callback();
    this.end(label);
  }

  async measureAsync(label: string, callback: () => Promise<void>): Promise<void> {
    this.start(label);
    await callback();
    this.end(label);
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Detect slow network connection
 */
export const isSlowConnection = (): boolean => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return false;
  
  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
};

/**
 * Adaptive loading based on network speed
 */
export const shouldUseReducedAnimations = (): boolean => {
  // Check user preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check network speed
  const slowNetwork = isSlowConnection();
  
  return prefersReducedMotion || slowNetwork;
};

/**
 * Cache with expiration
 */
export class CacheWithExpiry<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttlMs: number) {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}