// ------------------- SETTINGS -------------------------
const IMGBB_API_KEY = "13c92fea16f5a4435ebdd770bebd783a";   // <--- INSERT YOUR KEY
const VIEWALL_PASSWORD = "QWERT";
// -------------------------------------------------------

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const DATA_FILE = path.join(__dirname, "data.json");

// Load database
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// Save database
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate random 5-digit code
function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// ---------------------- UPLOAD --------------------------
app.post("/upload", upload.array("image"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.json({ success: false, error: "No images received." });

    const code = generateCode();
    const urls = [];

    // upload each photo to imgbb
    for (const file of req.files) {
      const base64 = file.buffer.toString("base64");

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          image: base64,
          name: file.originalname
        }
      );

      const imageUrl = response.data.data.url;
      urls.push(imageUrl);
    }

    // save to data.json
    const db = loadData();
    db.push({ code, images: urls });
    saveData(db);

    res.json({ success: true, code, urls });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

// -------------------- VIEW BY CODE ----------------------
app.get("/image/:code", (req, res) => {
  const db = loadData();
  const entry = db.find(e => e.code === req.params.code);

  if (!entry) {
    return res.json({ success: false, images: [] });
  }

  res.json({ success: true, images: entry.images });
});

// -------------------- VIEW ALL ---------------------------
app.get("/images/all", (req, res) => {
  const pass = req.query.password;

  if (pass !== VIEWALL_PASSWORD) {
    return res.json({ success: false, error: "Invalid password" });
  }

  const db = loadData();
  const allImages = db.flatMap(e => e.images);

  res.json({ success: true, images: allImages });
});

// --------------------------------------------------------
app.listen(3000, () => console.log("Server running on port 3000"));
