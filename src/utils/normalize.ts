// src/utils/normalize.ts

export const normalizeLabel = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const parseFollowers = (input: string): number | null => {
  const v = input.trim().toLowerCase();
  if (!v) return null;

  if (v.endsWith("k")) {
    return Math.round(Number(v.replace("k", "")) * 1000);
  }

  if (v.endsWith("m")) {
    return Math.round(Number(v.replace("m", "")) * 1_000_000);
  }

  const n = Number(v.replace(/[^0-9]/g, ""));
  return isNaN(n) ? null : n;
};
