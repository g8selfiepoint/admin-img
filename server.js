import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

// Multer memory storage (no local uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔑 ImgBB API key
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

// 🖼️ Upload Route
app.post("/upload", upload.single("image"), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      console.log("❌ No file uploaded!");
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log(`📸 Received file: ${req.file.originalname}`);
    console.log(`📏 Size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`📂 Type: ${req.file.mimetype}`);

    const base64Image = req.file.buffer.toString("base64");

    // Upload to ImgBB
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { image: base64Image, name: req.file.originalname }
    );

    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Upload successful in ${uploadTime}s`);
    console.log(`🌐 URL: ${response.data.data.url}`);

    res.json({
      success: true,
      url: response.data.data.url,
      display_url: response.data.data.display_url,
      upload_time: `${uploadTime}s`,
    });

  } catch (error) {
    console.error("🚨 Upload error details:");
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.response?.data || error.message,
    });
  }
});

// 🔹 Root route (for Render check)
app.get("/", (req, res) => {
  res.send("✅ G8 SelfiePoint Backend is running perfectly (debug mode enabled)");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
