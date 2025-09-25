const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dest = path.join(__dirname, "..", "uploads", "projects");
fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = /image\/(png|jpe?g|webp|gif|bmp|svg\+xml)/.test(file.mimetype);
  cb(ok ? null : new Error("Only image files allowed"), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
