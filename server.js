import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to data.json
const DATA_FILE = path.join(__dirname, "data.json");

// Load data.json
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.log("⚠️ data.json missing, creating new file...");
    return { photos: [] };
  }
}

// Save data.json
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Generate unique 5-digit code
function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// ========== UPLOAD IMAGES ==========
app.post("/upload", (req, res) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, error: "No images provided" });
  }

  const data = loadData();
  const code = generateCode();

  data.photos.push({
    code,
    images,
  });

  saveData(data);

  res.json({
    success: true,
    code,
    images,
  });
});

// ========== VIEW BY CODE ==========
app.get("/image/:code", (req, res) => {
  const code = req.params.code;
  const data = loadData();

  const item = data.photos.find((p) => p.code === code);

  if (!item) {
    return res.json({ success: false, images: [] });
  }

  res.json({ success: true, images: item.images });
});

// ========== VIEW ALL (Visitor Password: QWERT) ==========
app.get("/images/all", (req, res) => {
  const password = req.query.password;

  if (password !== "QWERT") {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }

  const data = loadData();
  const allImages = data.photos.flatMap((x) => x.images);

  res.json({ success: true, images: allImages });
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
