import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import http from "http";
import https from "https";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Proxy voice processing requests to the Python backend.
  // This keeps the client code simple (fetch("/process")) and works in production
  // where Vite's dev proxy is not active.
  const backendBaseUrl = process.env.BACKEND_URL || "http://localhost:8000";

  const proxyToBackend = (req: Request, res: Response) => {
    const targetUrl = new URL(req.originalUrl, backendBaseUrl);
    const client = targetUrl.protocol === "https:" ? https : http;

    console.log(`[Proxy] Forwarding ${req.method} ${req.originalUrl} to ${targetUrl.toString()}`);

    // Preserve original headers but update host
    const headers: Record<string, string | string[] | undefined> = {
      ...req.headers,
      host: targetUrl.host,
    };
    // Remove headers that shouldn't be forwarded
    delete headers.connection;

    const proxyReq = client.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
        method: req.method,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        headers,
      },
      (proxyRes) => {
        // Check if response is HTML (error page)
        const contentType = proxyRes.headers["content-type"] || "";
        const isHtml = contentType.includes("text/html");
        
        // If we get HTML, it's likely an error page from the backend
        if (isHtml && (proxyRes.statusCode === 404 || proxyRes.statusCode === 500)) {
          console.error(`Backend returned HTML error page (${proxyRes.statusCode}). Backend may not be running or endpoint not found.`);
          if (!res.headersSent) {
            res.status(502).json({
              error: "Backend connection error",
              message: `Backend returned an error page. Please ensure the backend is running on ${backendBaseUrl} and the /process endpoint exists.`,
              statusCode: proxyRes.statusCode
            });
          }
          proxyRes.destroy();
          return;
        }
        
        // Set response status
        res.status(proxyRes.statusCode || 502);
        
        // Copy response headers
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (value !== undefined && key !== "connection") {
            res.setHeader(key, value as any);
          }
        }
        
        // Pipe response to client
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", (err) => {
      console.error(`[Proxy] Connection error to ${targetUrl.toString()}:`, err);
      if (!res.headersSent) {
        res.status(502).json({ 
          error: "Failed to reach backend",
          message: `Cannot connect to backend at ${backendBaseUrl}. Please ensure the backend server is running.`,
          details: err.message
        });
      }
    });

    // Handle request errors
    req.on("error", (err) => {
      console.error("Request error:", err);
      if (!proxyReq.destroyed) {
        proxyReq.destroy();
      }
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "Request error",
          message: "Failed to process request" 
        });
      }
    });

    // Stream the request body directly to backend (important for file uploads)
    req.pipe(proxyReq);
  };

  app.all("/process", proxyToBackend);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
