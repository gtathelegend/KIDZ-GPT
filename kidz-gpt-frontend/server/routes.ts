import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import http from "http";
import https from "https";
import { storage } from "./storage";

const readJsonFromUrl = (url: URL): Promise<any> => {
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.get(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers: {
          "User-Agent": "kidz-gpt-frontend/1.0 (topic image fetch)",
          Accept: "application/json",
        },
      },
      (res) => {
        const status = res.statusCode || 500;
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          if (status < 200 || status >= 300) {
            reject(new Error(`HTTP ${status}: ${text.slice(0, 200)}`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch (e) {
            reject(new Error("Failed to parse JSON response"));
          }
        });
      },
    );

    req.on("error", reject);
    req.end();
  });
};

const toWikiLang = (input: string): string => {
  const lang = String(input || "").trim().toLowerCase();
  const primary = (lang.includes("-") ? lang.split("-")[0] : lang) || "en";
  const supported = new Set(["en", "hi", "bn", "ta", "te"]);
  return supported.has(primary) ? primary : "en";
};

const wikiBaseFor = (lang: string): string => {
  const code = toWikiLang(lang);
  return `https://${code}.wikipedia.org`;
};

const fetchTopicImageFromWikipedia = async (args: {
  query: string;
  lang: string;
}): Promise<{ imageUrl: string; title: string; pageUrl: string } | null> => {
  const query = String(args.query || "").trim();
  if (!query) return null;

  const wikiBase = wikiBaseFor(args.lang);

  // Use the MediaWiki API search to find the best-matching page and a thumbnail.
  // This is much more reliable than exact-title summary lookups (e.g. "moon" vs "Moon").
  const searchUrl = new URL(`${wikiBase}/w/api.php`);
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("generator", "search");
  searchUrl.searchParams.set("gsrsearch", query);
  searchUrl.searchParams.set("gsrlimit", "1");
  searchUrl.searchParams.set("utf8", "1");
  searchUrl.searchParams.set("redirects", "1");
  searchUrl.searchParams.set("prop", "pageimages|info");
  searchUrl.searchParams.set("inprop", "url");
  searchUrl.searchParams.set("pithumbsize", "800");

  const searchData = await readJsonFromUrl(searchUrl);
  const pagesObj = searchData?.query?.pages || {};
  const pages = Object.values(pagesObj) as any[];
  const page = pages[0];

  // Best effort extraction of image + page URL
  const pageUrl = typeof page?.fullurl === "string" ? page.fullurl : "";
  const title = typeof page?.title === "string" ? page.title : query;
  const imageUrl = typeof page?.thumbnail?.source === "string" ? page.thumbnail.source : "";

  if (imageUrl) {
    return { imageUrl, title, pageUrl };
  }

  // Fallback: Wikipedia REST summary sometimes has a thumbnail even when pageimages doesn't.
  const encodedTitle = encodeURIComponent(String(title).replace(/\s+/g, " "));
  const summaryUrl = new URL(`${wikiBase}/api/rest_v1/page/summary/${encodedTitle}`);
  const summaryData = await readJsonFromUrl(summaryUrl);
  const summaryImage = summaryData?.thumbnail?.source || summaryData?.originalimage?.source || "";
  if (summaryImage) {
    return {
      imageUrl: summaryImage,
      title: summaryData?.title || title,
      pageUrl:
        summaryData?.content_urls?.desktop?.page ||
        summaryData?.content_urls?.mobile?.page ||
        pageUrl,
    };
  }

  return null;
};

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
  app.all("/explainer", proxyToBackend);
  app.all("/generate-quiz", proxyToBackend);

  // Fetch a topic image from Wikipedia/Wikimedia (thumbnail if available).
  // Client calls /topic-image?query=Solar%20System
  app.get("/topic-image", async (req: Request, res: Response) => {
    try {
      const query = String(req.query.query || "").trim();
      const lang = String(req.query.lang || "en");
      if (!query) {
        res.status(400).json({ error: "Missing query" });
        return;
      }
      const primary = await fetchTopicImageFromWikipedia({ query, lang });
      if (primary) {
        res.json(primary);
        return;
      }

      // Important fallback: when the user speaks a non-English language, the topic string
      // can still be English (or vice-versa). If the requested language wiki has no image,
      // try English before giving up.
      const requested = toWikiLang(lang);
      if (requested !== "en") {
        const fallback = await fetchTopicImageFromWikipedia({ query, lang: "en" });
        if (fallback) {
          res.json(fallback);
          return;
        }
      }

      res.status(404).json({ error: "No image found" });
    } catch (e: any) {
      console.error("/topic-image error:", e);
      res.status(502).json({
        error: "Failed to fetch topic image",
        message: e?.message || "Unknown error",
      });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
