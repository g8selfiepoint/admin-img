import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "./data.json";

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Add photo links with generated code
app.post("/add-photo", (req, res) => {
  const { links } = req.body;
  if (!links || !Array.isArray(links)) {
    return res.status(400).json({ success: false, message: "Invalid links" });
  }

  const code = generateCode();
  const data = readData();
  data[code] = links;
  writeData(data);

  res.json({ success: true, code });
});

// Retrieve photo links by code
app.get("/get-photos/:code", (req, res) => {
  const code = req.params.code;
  const data = readData();

  if (data[code]) res.json({ success: true, links: data[code] });
  else res.json({ success: false, message: "Invalid code" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on ${PORT}`));
