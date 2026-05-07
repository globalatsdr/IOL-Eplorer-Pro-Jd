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

  // --- API ROUTES ---
  app.get("/api/health", (req, res) => {
    console.log(`[SERVER] Health check from ${req.ip} - Path: ${req.path}`);
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!apiKey,
      nodeEnv: process.env.NODE_ENV || 'production',
      time: new Date().toISOString()
    });
  });

  app.post("/api/chat", async (req, res) => {
    console.log(`[SERVER] Chat request - Path: ${req.path}`);
    try {
      if (!genAI) {
        return res.status(503).json({ error: "Gemini AI no configurado." });
      }

      const { messages, systemInstruction } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Mensaje inválido." });
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
      console.error("[SERVER ERROR]", error);
      res.status(500).json({ error: "Error interno del servidor", details: error.message });
    }
  });

  // Catch-all for /api before falling through to frontend
  app.all("/api/*", (req, res) => {
    console.warn(`[SERVER] 404 for API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "Ruta API no encontrada" });
  });

  // --- FRONTEND ROUTING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Don't fall back for API routes that missed the router
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
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
