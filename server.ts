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
  const apiKey = process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

  if (apiKey) {
    console.log("[INIT] API Key de Gemini detectada.");
  } else {
    console.warn("[INIT] ADVERTENCIA: No se encontró API Key de Gemini.");
  }

  // --- RUTAS API ---
  
  app.get("/api/health", (_req, res) => {
    console.log("[API] Health check ejecutado");
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!apiKey,
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      if (!genAI) {
        return res.status(503).json({ error: "Gemini AI no está configurado en el servidor." });
      }

      const { messages, systemInstruction } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "El cuerpo de la petición debe incluir un array de 'messages'." });
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

  // 404 para cualquier otra ruta de API
  app.all("/api/*", (req, res) => {
    console.warn(`[API-404] Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "Ruta API no encontrada", path: req.originalUrl });
  });

  // --- FRONTEND ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      // Si llegamos aquí y es /api/*, ya lo manejamos arriba como 404 de API
      if (req.url.startsWith('/api')) return next();
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
