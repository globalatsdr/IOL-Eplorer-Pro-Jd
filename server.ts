import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- PRE-MIDDLEWARE API TEST ---
  app.get("/ping", (_req, res) => res.send("pong"));
  
  app.use(express.json());

  // Logging Middleware
  app.use((req, _res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  // Configuración de Gemini
  const apiKey = process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY || "";
  const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // --- API DIRECT ROUTES ---
  app.get("/api/health", (req, res) => {
    console.log(`[API-HIT] Health request: ${req.originalUrl}`);
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!apiKey,
      nodeEnv: process.env.NODE_ENV || 'production',
      time: new Date().toISOString(),
      url: req.url,
      originalUrl: req.originalUrl,
      version: "1.0.1"
    });
  });

  app.post("/api/chat", async (req, res) => {
    console.log(`[API-HIT] Chat: ${req.originalUrl}`);
    try {
      if (!genAI) {
        return res.status(503).json({ error: "Gemini AI no configurado en el servidor." });
      }

      const { messages, systemInstruction } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Cuerpo de mensaje inválido." });
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
      console.error("[API-ERROR] Error en chat:", error);
      res.status(500).json({ 
        error: "Error interno procesando la solicitud de IA",
        details: error.message 
      });
    }
  });

  // Catch-all para /api explícito antes de entrar en lógica de frontend
  app.all("/api/*", (req, res) => {
    console.warn(`[API-404] Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "API endpoint not found", path: req.originalUrl });
  });

  // --- FRONTEND ROUTING ---
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Starting Vite in dev mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    console.log(`[SERVER] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // If it starts with /api but reached here, it's a 404 for API
      if (req.url.startsWith('/api') || req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: "API endpoint definitely not found" });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[FATAL ERROR]", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] IOL Explorer Pro activo en http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[CRITICAL-START-ERROR]", err);
});
