import express from "express";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "./data.json";
const UPLOAD_DIR = "./uploads";

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Helper to read data.json safely
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Helper to write data.json safely
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 📤 Upload images and generate a unique code
app.post("/upload", upload.array("images", 10), (req, res) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const data = readData();

  data[code] = req.files.map(file => ({
    filename: file.filename,
    path: `/uploads/${file.filename}`,
  }));

  writeData(data);

  res.json({ success: true, code });
});

// 📸 Fetch images by code
app.get("/images/:code", (req, res) => {
  const { code } = req.params;
  const data = readData();

  if (!data[code]) {
    return res.status(404).json({ success: false, message: "❌ No photos found for this code." });
  }

  res.json({ success: true, images: data[code] });
});

// Serve the uploads folder publicly
app.use("/uploads", express.static(path.resolve(UPLOAD_DIR)));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
