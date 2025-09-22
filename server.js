const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(express.json());

// path to storage
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "scanned_codes.json");

// ensure file exists
function ensureDataFile() {
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}
	if (!fs.existsSync(dataFile)) {
		fs.writeFileSync(dataFile, JSON.stringify([]), "utf8");
	}
}

// load codes
function loadCodes() {
	ensureDataFile();
	try {
		return JSON.parse(fs.readFileSync(dataFile, "utf8"));
	} catch (e) {
		console.error("Error reading codes file:", e);
		return [];
	}
}

// save codes
function saveCodes(codes) {
	ensureDataFile();
	fs.writeFileSync(dataFile, JSON.stringify(codes, null, 2), "utf8");
}

// API route
app.post("/qr", (req, res) => {
	const code = req.body.code;
	if (!code) {
		return res.status(400).json({ error: "Missing code" });
	}

	let codes = loadCodes();
	if (!codes.includes(code)) {
		codes.push(code);
		saveCodes(codes);
		console.log("New QR saved:", code);
	} else {
		console.log("QR already exists:", code);
	}

	res.json({ ok: true, codes });
});

// serve frontend
const distPath = path.join(__dirname, "client/dist");
app.use(express.static(distPath));

app.get(/.*/, (req, res) => {
	res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
