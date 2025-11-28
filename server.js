import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const app = express();

// ------------------- CONFIG -------------------
const DATA_FILE = "./data.json";
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";
const VISITOR_PASSWORD = "QWERT"; // password to view all images

// ------------------- CORS -------------------
app.use(
  cors({
    origin: [
      "https://g8selfiepoint.github.io", // frontend
      "http://localhost:3000",           // local testing
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ------------------- MULTER -------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------- DATA -------------------
let imagesByCode = {};

// Load existing data from JSON file
if (fs.existsSync(DATA_FILE)) {
  try {
    const rawData = fs.readFileSync(DATA_FILE);
    imagesByCode = JSON.parse(rawData);
    console.log("✅ Loaded existing data from data.json");
  } catch (err) {
    console.error("❌ Error reading data.json:", err);
  }
}

// Save data to JSON file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(imagesByCode, null, 2));
    console.log("💾 Data saved to data.json");
  } catch (err) {
    console.error("❌ Error writing to data.json:", err);
  }
}

// ------------------- HELPER -------------------
// Generate unique 5-digit code
function generateUniqueCode() {
  let code;
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString();
  } while (imagesByCode[code]);
  return code;
}

// ------------------- ROUTES -------------------

// Health check
app.get("/", (req, res) => {
  res.send("✅ G8 SelfiePoint Backend is running!");
});

// Upload multiple images
app.post("/upload", upload.array("image"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: "No files uploaded" });
  }

  try {
    const code = generateUniqueCode();
    const uploadedUrls = [];

    for (const file of req.files) {
      const base64Image = file.buffer.toString("base64");

      const form = new FormData();
      form.append("image", base64Image);
      form.append("name", file.originalname);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        form,
        { headers: form.getHeaders() }
      );

      uploadedUrls.push(response.data.data.url);
    }

    // Store in memory
    imagesByCode[code] = uploadedUrls;

    // Save to JSON
    saveData();

    res.json({
      success: true,
      code: code,
      urls: uploadedUrls,
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ success: false, error: err.message || "Upload failed" });
  }
});

// Get images by code (visitor)
app.get("/image/:code", (req, res) => {
  const { code } = req.params;
  const images = imagesByCode[code];
  if (images && images.length > 0) {
    res.json({ success: true, images });
  } else {
    res.json({ success: false, images: [] });
  }
});

// Get all images (visitor password mode)
app.get("/images/all", (req, res) => {
  const password = req.query.password;
  if (password !== VISITOR_PASSWORD) {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }
  const allImages = Object.values(imagesByCode).flat();
  res.json({ success: true, images: allImages });
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
