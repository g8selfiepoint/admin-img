import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const app = express();

// ✅ Allow frontend origins
app.use(cors({
  origin: [
    "https://g8selfiepoint.github.io",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ Parse JSON bodies (if needed)
app.use(express.json());

// ✅ Multer setup — memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ ImgBB API key
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

// ✅ In-memory code → URL mapping
const uploadedImages = {};

// 🚀 Upload endpoint
// Support multiple files at once
app.post("/upload", upload.array("image"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "No files uploaded" });
    }

    const results = [];

    for (let file of req.files) {
      const base64Image = file.buffer.toString("base64");

      // FormData for ImgBB
      const formData = new FormData();
      formData.append("image", base64Image);
      formData.append("name", file.originalname);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );

      const url = response.data.data.url;

      // Generate unique 5-digit code
      let code;
      do {
        code = Math.floor(10000 + Math.random() * 90000).toString();
      } while (uploadedImages[code]); // avoid duplicate

      // Store code → URL mapping
      uploadedImages[code] = url;

      results.push({ url, code });
    }

    res.json({ success: true, uploaded: results });
  } catch (error) {
    console.error("Upload error:", error.message);
    if (error.response) console.error("ImgBB response:", error.response.data);
    res.status(500).json({ success: false, error: error.message || "Upload failed" });
  }
});

// ✅ Visitor endpoint to get image by code
app.get("/image/:code", (req, res) => {
  const code = req.params.code;
  const url = uploadedImages[code];
  if (url) {
    res.json({ success: true, url });
  } else {
    res.status(404).json({ success: false, error: "Invalid code" });
  }
});

// ✅ Health check for Render
app.get("/", (req, res) => res.send("✅ G8 SelfiePoint Backend is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
