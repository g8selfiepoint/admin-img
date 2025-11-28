import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data"; // ✅ Needed for Node.js

const app = express();

// ✅ CORS setup
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

// ✅ Multer setup — store uploaded files temporarily in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ ImgBB API key
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

// ✅ In-memory storage for images by visitor code
const imagesByCode = {}; // { "12345": ["url1","url2"] }

// ✅ Generate unique 5-digit code
function generateUniqueCode() {
  let code;
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString(); // 10000-99999
  } while (imagesByCode[code]);
  return code;
}

// ✅ Upload endpoint for multiple images
app.post("/upload", upload.array("image"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: "No files uploaded" });
  }

  try {
    const code = generateUniqueCode();
    const uploadedUrls = [];

    for (const file of req.files) {
      const base64Image = file.buffer.toString("base64");

      // ✅ Use FormData for Node.js
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

    // Store images under the unique code
    imagesByCode[code] = uploadedUrls;

    res.json({
      success: true,
      code: code,
      images: uploadedUrls,
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ success: false, error: err.message || "Upload failed" });
  }
});

// ✅ Visitor endpoint to fetch images by code
app.get("/image/:code", (req, res) => {
  const { code } = req.params;
  const images = imagesByCode[code];
  if (images) {
    res.json({ success: true, images });
  } else {
    res.json({ success: false, images: [] });
  }
});

// ✅ Endpoint to fetch all images (password mode)
const VISITOR_PASSWORD = "VIEWALL";

app.get("/images/all", (req, res) => {
  const password = req.query.password;
  if (password !== VISITOR_PASSWORD) {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }

  // Flatten all images into a single array
  const allImages = Object.values(imagesByCode).flat();
  res.json({ success: true, images: allImages });
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ G8 SelfiePoint Backend is running perfectly!");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
