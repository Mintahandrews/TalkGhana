import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for client requests
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory (for production builds)
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "up", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", apiRoutes);

// Connection reliability middleware for all requests
app.use((req, res, next) => {
  // Add retry-after header to any 503 responses
  res.on("finish", () => {
    if (res.statusCode === 503) {
      res.setHeader("Retry-After", "10");
    }
  });
  next();
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Server error:", err);

    // Check if it's a known operational error
    if ((err as any).isOperational) {
      return res.status(400).json({
        status: "error",
        message: err.message,
      });
    }

    // For unknown errors, return a generic message
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
);

// Fallback route for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server with graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");

  server.close(() => {
    console.log("Process terminated");
  });

  // If server doesn't close in 5 seconds, force shutdown
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 5000);
});

export default app;
