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

  // Health Check mejorado
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!(process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY),
      usingCustomKey: !!process.env.CLAVE_GEMINI_PROPIA
    });
  });

  // Inicializar Gemini
  const apiKey = process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log(`[INIT] Gemini API configurada usando clave ${process.env.CLAVE_GEMINI_PROPIA ? 'PROPIA' : 'del SISTEMA'}`);
  } else {
    console.warn("[INIT] ADVERTENCIA: No se detectó ninguna clave API de Gemini (GEMINI_API_KEY o CLAVE_GEMINI_PROPIA)");
  }
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // API Route para el Chat
  app.post("/api/chat", async (req, res) => {
    console.log("Petición recibida en /api/chat");
    try {
      if (!genAI) {
        console.error("Error: genAI no inicializado. ¿ApiKey presente?");
        return res.status(500).json({ 
          error: "GEMINI_API_KEY no configurada en el servidor.",
          detail: "Asegúrate de que CLAVE_GEMINI_PROPIA o GEMINI_API_KEY estén en Settings > Secrets"
        });
      }

      const { messages, systemInstruction } = req.body;
      console.log("Mensajes recibidos:", messages?.length);
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction 
      });

      const result = await model.generateContent({
        contents: messages.map((m: any) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }))
      });

      const responseText = result.response.text();
      console.log("Respuesta generada correctamente");
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Error detallado en API chat:", error);
      // Asegurarse de devolver JSON siempre
      res.status(500).json({ 
        error: "Error interno del servidor al procesar el chat",
        message: error.message || "Error desconocido",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Vite middleware para desarrollo
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor de IOL Explorer Pro corriendo en http://localhost:${PORT}`);
  });
}

startServer();
