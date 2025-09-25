// config/upload.js
const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ok = /image\/(png|jpe?g|webp|gif|bmp|svg\+xml)/.test(file.mimetype);
  cb(ok ? null : new Error("Only image files allowed"), ok);
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
