import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging de peticiones
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // RUTAS API
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!(process.env.GEMINI_API_KEY || process.env.CLAVE_GEMINI_PROPIA),
      usingCustomKey: !!process.env.CLAVE_GEMINI_PROPIA,
      env: process.env.NODE_ENV || 'production'
    });
  });

  // Catch-all para API
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "Ruta API no encontrada", path: req.url });
  });

  // FRONTEND / SPA
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
      // No capturar rutas de la api aquí
      if (req.url.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor listo en port ${PORT}`);
  });
}

startServer();
