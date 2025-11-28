import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const app = express();

app.use(cors({
  origin: ["https://g8selfiepoint.github.io", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    const base64Image = req.file.buffer.toString("base64");

    // ✅ FormData for ImgBB
    const formData = new FormData();
    formData.append("image", base64Image);
    formData.append("name", req.file.originalname);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    );

    res.json({
      success: true,
      url: response.data.data.url,
      display_url: response.data.data.display_url,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    if (error.response) console.error("ImgBB response:", error.response.data);
    res.status(500).json({ success: false, error: error.message || "Upload failed" });
  }
});

app.get("/", (req, res) => res.send("✅ G8 SelfiePoint Backend is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
