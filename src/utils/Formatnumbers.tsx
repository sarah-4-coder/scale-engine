// src/utils/formatNumbers.ts

/**
 * Format large numbers into readable format (K, M, B)
 * Examples: 1500 -> 1.5K, 13000000 -> 13M, 1200 -> 1.2K
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  
  if (absNum >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  return num.toString();
};

/**
 * Parse formatted number string back to number
 * Examples: "13M" -> 13000000, "1.5K" -> 1500
 */
export const parseFormattedNumber = (str: string): number | null => {
  if (!str) return null;
  
  const value = str.trim().toLowerCase();
  
  if (value.endsWith('b')) {
    return parseFloat(value.replace('b', '')) * 1_000_000_000;
  }
  
  if (value.endsWith('m')) {
    return parseFloat(value.replace('m', '')) * 1_000_000;
  }
  
  if (value.endsWith('k')) {
    return parseFloat(value.replace('k', '')) * 1_000;
  }
  
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
};