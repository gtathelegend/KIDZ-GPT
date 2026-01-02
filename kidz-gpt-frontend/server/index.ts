import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  
  // Detect platform for cross-platform compatibility
  // On Windows, binding to 0.0.0.0 with certain options can cause ENOTSUP errors
  // Use localhost on Windows, 0.0.0.0 on other platforms for network access
  const isWindows = process.platform === "win32";
  const host = isWindows ? "localhost" : "0.0.0.0";
  
  // Handle server errors gracefully
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      log(`❌ Port ${port} is already in use. Please choose a different port.`);
      process.exit(1);
    } else if (err.code === "ENOTSUP") {
      // If 0.0.0.0 fails, try localhost as fallback
      if (host === "0.0.0.0") {
        log(`⚠️  Cannot bind to 0.0.0.0:${port}. Trying localhost instead...`);
        httpServer.listen(port, "localhost", () => {
          log(`✅ serving on localhost:${port}`);
        });
      } else {
        log(`❌ Error binding to ${host}:${port}: ${err.message}`);
        process.exit(1);
      }
    } else {
      log(`❌ Server error: ${err.message}`);
      process.exit(1);
    }
  });
  
  // Start the server
  httpServer.listen(port, host, () => {
    log(`✅ serving on ${host}:${port}`);
  });
})();
