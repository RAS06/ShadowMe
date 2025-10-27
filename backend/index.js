// Backend application entry point
console.log('ShadowMe Backend Server');
console.log('Server starting on port 3000...');

// TODO: Add your application code here
// Example: Express server, API routes, database connections, etc.

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Mount the routes
app.use("/", authRoutes);

// Example: test route
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import { refreshAccessToken } from "./middleware/authMiddleware.js";

app.use(express.json());
app.use(cookieParser());

// Auth routes
app.use("/auth", authRoutes);

// Token refresh endpoint
app.post("/auth/refresh", refreshAccessToken);

app.listen(3000, () => console.log("Server running on port 3000"));

