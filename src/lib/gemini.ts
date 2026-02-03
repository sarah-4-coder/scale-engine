import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GOOGLE_AI_API_KEY is not configured");
}

export const genAI = new GoogleGenAI({
  apiKey,
});
