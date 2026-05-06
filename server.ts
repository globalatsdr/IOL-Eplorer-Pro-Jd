import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", apiKeyPresent: !!process.env.GEMINI_API_KEY });
  });

  // Inicializar Gemini
  const apiKey = process.env.CLAVE_GEMINI_PROPIA || process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // API Route para el Chat
  app.post("/api/chat", async (req, res) => {
    try {
      if (!genAI) {
        return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
      }

      const { messages, systemInstruction } = req.body;
      
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

      res.json({ text: result.response.text() });
    } catch (error: any) {
      console.error("Error en API chat:", error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
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
