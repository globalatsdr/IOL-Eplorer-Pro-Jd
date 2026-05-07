import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging Middleware
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API-REQUEST] ${req.method} ${req.url}`);
    }
    next();
  });

  // Configuración de Gemini
  const apiKey = process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY || "";
  const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // --- API ROUTER ---
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    console.log(`[API] Health check requested from ${req.ip}`);
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!apiKey,
      nodeEnv: process.env.NODE_ENV || 'development',
      time: new Date().toISOString()
    });
  });

  apiRouter.post("/chat", async (req, res) => {
    console.log("[API] Chat request received");
    try {
      if (!genAI) {
        return res.status(503).json({ error: "Gemini AI not configured on server" });
      }

      const { messages, systemInstruction } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid request body: 'messages' array required" });
      }

      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: messages.map((m: any) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 1000,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("[API-ERROR] AI process failed:", error);
      res.status(500).json({ 
        error: "Internal server error during AI processing",
        details: error.message 
      });
    }
  });

  // API 404 - Always return JSON for anything starting with /api
  apiRouter.all("*", (req, res) => {
    console.warn(`[API-404] Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "API endpoint not found", 
      path: req.originalUrl 
    });
  });

  // Mount API router FIRST
  app.use("/api", apiRouter);

  // --- FRONTEND ROUTING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] IOL Explorer Pro activo en http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[CRITICAL-START-ERROR]", err);
});
