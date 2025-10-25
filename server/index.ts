import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { connectToDatabase } from "./db";
import { registerRoutes } from "./routes";
// Custom logging function
function log(message: string, source = "server") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

dotenv.config();
const app = express();

// Initialize Sentry only if DSN is provided
if (process.env.GLITCHTIP_DSN) {
  Sentry.init({
    dsn: process.env.GLITCHTIP_DSN,
    tracesSampleRate: 1.0, // Adjust for performance, e.g., 0.2 for 20% of transactions
    environment: process.env.NODE_ENV || "development",
  });

  // The request handler must be the first middleware
  if (Sentry.Handlers?.requestHandler) {
    app.use(
      Sentry.Handlers.requestHandler({
        serverName: false,
        user: ["id", "username", "email"],
        transaction: "methodPath",
        flushTimeout: 2000,
      })
    );
  } else {
    console.warn("Sentry.Handlers.requestHandler not available. Skipping request handler middleware.");
  }
} else {
  console.warn("Sentry DSN not provided. Skipping Sentry initialization.");
}

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    res.setHeader("Content-Type", "application/json");
  }
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Debug route for testing Sentry
if (process.env.GLITCHTIP_DSN) {
  app.get("/debug-sentry", (req: Request, res: Response) => {
    throw new Error("My first GlitchTip error!");
  });
}

(async () => {
  await connectToDatabase();

  const apiRouter = express.Router();
  const server = await registerRoutes(app, apiRouter);

  app.use("/api", apiRouter);

  // The error handler must be after all routes
  if (process.env.GLITCHTIP_DSN && Sentry.Handlers?.errorHandler) {
    app.use(
      Sentry.Handlers.errorHandler({
        shouldHandleError(error: any) {
          // Capture 404 and 500+ errors
          return error.status === 404 || error.status >= 500;
        },
      })
    );
  } else if (process.env.GLITCHTIP_DSN) {
    console.warn("Sentry.Handlers.errorHandler not available. Skipping error handler middleware.");
  }

  // Custom error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (process.env.GLITCHTIP_DSN && Sentry.captureException) {
      Sentry.captureException(err, {
        extra: {
          route: req.path,
          method: req.method,
        },
      });
    }
    res.status(status).json({
      message,
      errorId: process.env.GLITCHTIP_DSN ? res.sentry : undefined,
    });
  });

  // API-only server - no frontend serving

  const port = parseInt(process.env.PORT || "5050");
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
