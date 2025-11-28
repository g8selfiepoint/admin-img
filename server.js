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

app.use(express.json());

// ✅ Multer setup — memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ ImgBB API key
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

// ✅ In-memory code → URLs mapping
const uploadedImages = {};

// 🚀 Upload endpoint — one 5-digit code per batch
app.post("/upload", upload.array("image"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "No files uploaded" });
    }

    // Generate single 5-digit code for this batch
    let code;
    do {
      code = Math.floor(10000 + Math.random() * 90000).toString();
    } while (uploadedImages[code]);

    const urls = [];

    for (let file of req.files) {
      const base64Image = file.buffer.toString("base64");

      const formData = new FormData();
      formData.append("image", base64Image);
      formData.append("name", file.originalname);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );

      urls.push(response.data.data.url);
    }

    // Store URLs under the same code
    uploadedImages[code] = urls;

    res.json({ success: true, urls, code }); // single code for all images
  } catch (error) {
    console.error("Upload error:", error.message);
    if (error.response) console.error("ImgBB response:", error.response.data);
    res.status(500).json({ success: false, error: error.message || "Upload failed" });
  }
});

// ✅ Visitor endpoint to get all images by code
app.get("/image/:code", (req, res) => {
  const code = req.params.code;
  const urls = uploadedImages[code];
  if (urls) {
    res.json({ success: true, images: urls });
  } else {
    res.status(404).json({ success: false, error: "Invalid code" });
  }
});

// ✅ Health check for Render
app.get("/", (req, res) => res.send("✅ G8 SelfiePoint Backend is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
