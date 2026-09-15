import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-load Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.error("Failed to initialize Gemini AI client:", err);
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "chromebook-voice-dictation" });
});

// AI Cleanup endpoint for professional presentation and readability
app.post("/api/ai-cleanup", async (req, res) => {
  const { text, removeWords = ["up", "and"], tone = "professional" } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text' parameter" });
  }

  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `You are a high-accuracy voice-to-text dictation editor on ChromeOS.
Clean up the following raw voice transcript for professional readability and presentation.
Rules:
1. Edit out filler words and specifically omit occurrences of these words when used as repetitive crutches or fillers: ${removeWords.join(", ")}.
2. Fix punctuation, capitalization, sentence boundaries, and grammar without changing the original speaker's core meaning.
3. Tone: ${tone}.
4. Return ONLY the cleaned transcribed statement. Do not add explanations or quotes.

Raw transcript:
"${text}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const cleanedText = response.text ? response.text.trim() : text;
      return res.json({ cleanedText, source: "gemini-ai" });
    } catch (err: any) {
      console.warn("Gemini API call failed, falling back to rule-based cleanup:", err?.message || err);
    }
  }

  // Smart fallback: rule-based cleanup
  let cleaned = text;

  // Filter out specified words as fillers if needed
  if (Array.isArray(removeWords)) {
    for (const word of removeWords) {
      if (!word) continue;
      // Replace standalone word with boundary check case-insensitive
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      cleaned = cleaned.replace(regex, "");
    }
  }

  // Remove common filler sounds
  cleaned = cleaned.replace(/\b(um|uh|er|ah|like|you know)\b/gi, "");

  // Fix multiple spaces and punctuation spacing
  cleaned = cleaned
    .replace(/\s+/g, " ")
    .replace(/\s*([,.;:?!])\s*/g, "$1 ")
    .trim();

  // Capitalize first letter and ensure ending punctuation
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += ".";
    }
  }

  return res.json({ cleanedText: cleaned, source: "rule-engine" });
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Chromebook Voice Dictation server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
