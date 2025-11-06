import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for handling image uploads (temporary storage in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Replace with your actual ImgBB API key
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Convert file buffer to base64
    const base64Image = req.file.buffer.toString("base64");

    // Upload to ImgBB
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        image: base64Image,
        name: req.file.originalname,
      }
    );

    // Respond with the ImgBB image URL
    res.json({
      success: true,
      url: response.data.data.url,
      display_url: response.data.data.display_url,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

// Root route (for Render health check)
app.get("/", (req, res) => {
  res.send("✅ G8 SelfiePoint Backend is running perfectly!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
