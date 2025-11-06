import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const app = express();
app.use(cors());
app.use(express.json());

// Multer: Store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔑 ImgBB API key
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

// 🚀 Upload endpoint
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, error: "No file uploaded" });

    // Convert to base64
    const base64Image = req.file.buffer.toString("base64");

    // Create form-data payload
    const formData = new FormData();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", base64Image);
    formData.append("name", req.file.originalname);

    // Upload to ImgBB
    const response = await axios.post("https://api.imgbb.com/1/upload", formData, {
      headers: formData.getHeaders(),
    });

    // Respond with uploaded image details
    res.json({
      success: true,
      url: response.data.data.url,
      display_url: response.data.data.display_url,
    });
  } catch (error) {
    console.error("❌ Upload error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: "Upload failed at backend",
    });
  }
});

// ✅ Health route for Render
app.get("/", (req, res) => {
  res.send("✅ G8 SelfiePoint Backend is running perfectly!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
