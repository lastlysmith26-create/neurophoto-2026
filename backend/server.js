const express = require("express");
const cors = require("cors");
const path = require("path");

const fs = require("fs");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const modelsRoutes = require("./routes/models");
const generateRoutes = require("./routes/generate");
const historyRoutes = require("./routes/history");
const presetsRoutes = require("./routes/presets");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173', // vite preview
];
if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
    origin: process.env.CORS_ORIGIN ? allowedOrigins : '*',
    credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving images
}));
app.use(compression());

// Static files for generated images
app.use("/images", express.static(path.join(__dirname, "storage/images")));

// Ensure storage directories exist
const storageDir = path.join(__dirname, "storage");
const imagesDir = path.join(storageDir, "images");
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

// API Routes
app.use("/api/models", modelsRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/presets", presetsRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
    console.log(`🚀 Нейрофото сервер запущен на http://localhost:${PORT}`);
});
