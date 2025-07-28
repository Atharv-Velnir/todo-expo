import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import todoRoutes from "./src/routes/todos";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is healthy" });
});

app.use(cors());
app.use(express.json());

// ✅ Proper route mounting
app.use("/api/todos", todoRoutes);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("❌ MONGODB_URI not set in environment variables.");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });
