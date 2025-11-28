// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "https://g8selfiepoint.github.io"] }));
app.use(express.json());

// ================= MONGODB SETUP =================
const DB_URI = "mongodb+srv://charvikkumarnv:charvikcharvik@cluster0.35j4vzm.mongodb.net/charvik_images?retryWrites=true&w=majority";

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully!"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Define schema
const uploadSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  urls: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now }
});

const Upload = mongoose.model("Upload", uploadSchema);

// ================= MULTER SETUP =================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ================= IMGBB =================
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";

// ================= HELPERS =================
function generateUniqueCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// ================= UPLOAD ENDPOINT =================
app.post("/upload", upload.array("image"), async (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ success: false, error: "No files uploaded" });

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

    // Save to MongoDB
    const newUpload = new Upload({ code, urls: uploadedUrls });
    await newUpload.save();

    res.json({ success: true, code, urls: uploadedUrls });

  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ success: false, error: err.message || "Upload failed" });
  }
});

// ================= GET IMAGES BY CODE =================
app.get("/image/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const record = await Upload.findOne({ code });

    if (!record) return res.json({ success: false, images: [] });

    res.json({ success: true, images: record.urls });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, images: [], error: err.message });
  }
});

// ================= GET ALL IMAGES (PASSWORD) =================
const VISITOR_PASSWORD = "QWERT";

app.get("/images/all", async (req, res) => {
  try {
    const password = req.query.password;
    if (password !== VISITOR_PASSWORD)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const allUploads = await Upload.find();
    const allImages = allUploads.flatMap(u => u.urls);

    res.json({ success: true, images: allImages });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, images: [], error: err.message });
  }
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => res.send("✅ Charvik SelfiePoint Backend running!"));

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
