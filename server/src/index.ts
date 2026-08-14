import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import facultyRoutes from "./routes/faculty.routes.js";
import studentRoutes from "./routes/student.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import researchRoutes from "./routes/research.routes.js";
import approvalRoutes from "./routes/approval.routes.js";
import integrationRoutes from "./routes/integration.routes.js";
import googleScholarRoutes from "./integrations/googleScholar/googleScholar.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import reportRoutes from "./routes/report.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import intelligenceRoutes from "./routes/intelligence.routes.js";
import knowledgeGraphRoutes from "./routes/knowledgeGraph.routes.js";
import { prisma } from "./config/db.js";
import { SchedulerService } from "./services/scheduler.service.js";

const app = express();
const PORT = env.PORT || 5000;

// CORS setup
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Health Check
app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// Mounted Routes
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/researches", researchRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/integrations/scholar", googleScholarRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/knowledge-graph", knowledgeGraphRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "API endpoint not found",
    },
  });
});

// Global Centralized Error Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled Global Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: env.NODE_ENV === "production" ? "Internal server error" : err.message || "Internal server error",
    },
  });
});

// Start Server & Register Graceful Shutdown
const server = app.listen(PORT, async () => {
  console.log(`🚀 KRIYA Auth & Research Platform Backend running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL database via Prisma");
    SchedulerService.initializeScheduler();
  } catch (error) {
    console.error("❌ Failed to connect to Supabase database:", error);
  }
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️ Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log("🛑 Express HTTP server closed to new connections.");
    try {
      await prisma.$disconnect();
      console.log("✅ Prisma database connections disconnected.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during Prisma disconnect:", err);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
