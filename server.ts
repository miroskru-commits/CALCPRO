import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialize Gemini AI client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // AI Math Assistant endpoint
  app.post("/api/gemini/math-assist", async (req, res) => {
    try {
      const { prompt, language = "ru" } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Missing or invalid prompt parameter." });
      }

      const systemInstruction = `You are an elite, concise, and helpful Mathematical AI Assistant integrated directly into a precision scientific calculator.
Your goal is to solve the user's math problem, word problem, algebraic equation, calculus derivative/integral, physics question, or everyday calculation.

Guidelines:
1. Always respond in the requested language: "${language}".
2. Structure your response clearly:
   - Provide a clear, step-by-step mathematical breakdown.
   - Conclude with the explicit FINAL NUMERIC or ALGEBRAIC RESULT.
3. Also extract the primary numerical value (pure number or decimal/fraction) that can be entered directly into a calculator display.

Format your output as JSON with this exact schema:
{
  "problem": "Brief restatement of the problem",
  "steps": ["Step 1 explanation with math formulas", "Step 2...", "Step 3..."],
  "finalAnswer": "Explicit human-readable final answer with units if applicable",
  "numericValue": "Clean numerical or formula string to insert into calculator (e.g. '42', '3.14159', 'sqrt(3)/2')"
}`;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          problem: prompt,
          steps: [responseText],
          finalAnswer: responseText,
          numericValue: "",
        };
      }

      res.json({
        success: true,
        data: parsed,
      });
    } catch (error: any) {
      console.error("Gemini Math Assist Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to process math problem with AI",
      });
    }
  });

  // Impossible Prank Calculator evaluation endpoint
  app.post("/api/gemini/impossible-evaluate", async (req, res) => {
    try {
      const { expression, customRule = "" } = req.body;
      if (!expression || typeof expression !== "string") {
        return res.status(400).json({ error: "Missing expression parameter." });
      }

      const systemInstruction = `You are the backend evaluation brain for a Prank / Impossible Calculator.
A prank rule has been configured: "${customRule}".

Instructions:
1. Carefully check if the user's expression "${expression}" or its calculation matches or is affected by the custom prank rule.
2. If the rule says e.g. "if 2+2 then output 5", and the expression is 2+2 (or 2 + 2, or evaluates to something targeted), strictly produce the spoofed result specified by the rule (e.g. "5").
3. If the custom rule specifies other behaviors (e.g. "always add 100", "output 42", "if divide by 0 output Infinity"), follow the rule with highest priority.
4. If NO rule matches or no custom rule is provided, evaluate the expression mathematically correctly.
5. Return clean, concise output ready to display on a digital calculator screen.

Format output as JSON:
{
  "result": "The final value or spoofed prank value to show on calculator display (e.g. '5', '42', '999', 'Error in Matrix')",
  "isPranked": true or false (true if custom prank rule changed the standard mathematical output),
  "explanation": "Short note for owner explaining how it was resolved"
}`;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Evaluate mathematical expression: "${expression}" considering custom rule: "${customRule}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          result: "5",
          isPranked: true,
          explanation: "Fallback prank evaluation",
        };
      }

      res.json({
        success: true,
        data: parsed,
      });
    } catch (error: any) {
      console.error("Gemini Impossible Evaluate Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to evaluate impossible calculator with AI",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`Calculator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
