import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// File for saving data
const DATA_FILE = path.join(__dirname, "data.json");

// Read saved data
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Write new data
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate random 5-digit code
function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// ✅ Add photo links with generated code
app.post("/add-photo", (req, res) => {
  const { links } = req.body;

  if (!links || !Array.isArray(links) || links.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid or empty links array." });
  }

  const code = generateCode();
  const data = readData();
  data[code] = links;
  writeData(data);

  console.log(`🆕 Added photo set with code ${code}`);
  res.json({ success: true, code });
});

// ✅ Retrieve photo links by code
app.get("/get-photos/:code", (req, res) => {
  const { code } = req.params;
  const data = readData();

  if (data[code]) {
    res.json({ success: true, links: data[code] });
  } else {
    res.json({ success: false, message: "Invalid code" });
  }
});

// 🟢 Root route (for Render test)
app.get("/", (req, res) => {
  res.send("✅ Admin Image Backend is Running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
