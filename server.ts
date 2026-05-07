import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

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

  // --- RUTAS DE LA API ---
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      message: "Servidor operativo",
      timestamp: new Date().toISOString()
    });
  });

  // Catch-all para API
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "Ruta API no encontrada", path: req.url });
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor de IOL Explorer Pro corriendo en http://localhost:${PORT}`);
  });
}

startServer();
