import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";

const app = express();

// ✅ Allow only your frontend origin (GitHub Pages)
app.use(
  cors({
    origin: [
      "https://g8selfiepoint.github.io", // your GitHub Pages frontend
      "http://localhost:3000",           // optional for local testing
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ✅ Multer setup — store uploaded files temporarily in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Your ImgBB API key
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

// ✅ Upload endpoint
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("Received upload request...");

    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // Convert file buffer to Base64
    const base64Image = req.file.buffer.toString("base64");

    // Upload to ImgBB
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        image: base64Image,
        name: req.file.originalname,
      }
    );

    console.log("✅ Upload successful:", response.data.data.url);

    res.json({
      success: true,
      url: response.data.data.url,
      display_url: response.data.data.display_url,
    });
  } catch (error) {
    console.error("🔥 Upload error:", error.message);

    if (error.response) {
      console.error("🧩 ImgBB response:", error.response.data);
    }

    res.status(500).json({
      success: false,
      error: error.message || "Upload failed",
    });
  }
});

// ✅ Health check route (for Render)
app.get("/", (req, res) => {
  res.send("✅ G8 SelfiePoint Backend is running perfectly!");
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
