import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging de peticiones para diagnóstico
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });

  // --- INICIALIZACIÓN DE GEMINI ---
  const apiKey = process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log(`[INIT] Gemini API configurada usando clave ${process.env.CLAVE_GEMINI_PROPIA ? 'PROPIA' : 'del SISTEMA'}`);
  } else {
    console.warn("[INIT] ADVERTENCIA: No hay clave API detectada");
  }
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // --- RUTAS DE LA API ---
  const apiRouter = express.Router();

  // Logging específico para la API
  apiRouter.use((req, _res, next) => {
    console.log(`[API-ROUTER] ${req.method} ${req.url}`);
    next();
  });

  apiRouter.get("/health", (_req, res) => {
    console.log("[API] Health Check solicitado");
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!(process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY),
      usingCustomKey: !!process.env.CLAVE_GEMINI_PROPIA,
      version: "2.0.0"
    });
  });

  apiRouter.post("/ai-chat", async (req, res) => {
    console.log("[API] Chat solicitado");
    try {
      if (!genAI) {
        return res.status(500).json({ error: "Gemini no inicializado" });
      }
      const { messages, systemInstruction } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
      const result = await model.generateContent({
        contents: messages.map((m: any) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }))
      });
      res.json({ text: result.response.text() });
    } catch (error: any) {
      console.error("[API] Error en chat:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Montar el router de la API
  app.use("/api", apiRouter);

  // --- FRONTEND / VITE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Fallback para SPA en producción (Express 5)
    app.get("*", (req, res, next) => {
      // Si empieza por /api y llegó aquí, es un 404 de API real
      if (req.url.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 404 Genérico para API
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Ruta API no encontrada", path: req.originalUrl });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor de IOL Explorer Pro corriendo en http://localhost:${PORT}`);
  });
}

startServer();
