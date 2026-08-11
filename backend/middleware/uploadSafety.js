const multer = require("multer");
const path = require("path");

const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024; // 10MB default

const uploadStorage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".xlsx", ".xls", ".csv"];
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
      "text/plain",
      "application/octet-stream",
    ];

    if (!allowedExts.includes(ext)) {
      return cb(new Error("Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed."));
    }

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Invalid file MIME type. Only official Excel/CSV spreadsheets are accepted."));
    }

    cb(null, true);
  },
});

// Middleware to verify file magic bytes in buffer to prevent spoofed file uploads
function validateFileBuffer(req, res, next) {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const buffer = req.file.buffer;
  const ext = path.extname(req.file.originalname).toLowerCase();

  if (ext === ".xlsx") {
    // XLSX is a ZIP archive -> Magic bytes: PK\x03\x04 (0x50 0x4B 0x03 0x04)
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return res.status(400).json({ message: "Corrupted or spoofed .xlsx file format." });
    }
  } else if (ext === ".xls") {
    // XLS is OLE2 Compound Document -> Magic bytes: 0xD0 0xCF 0x11 0xE0
    if (buffer.length < 4 || buffer[0] !== 0xd0 || buffer[1] !== 0xcf || buffer[2] !== 0x11 || buffer[3] !== 0xe0) {
      return res.status(400).json({ message: "Corrupted or spoofed .xls file format." });
    }
  }

  next();
}

module.exports = {
  uploadStorage,
  validateFileBuffer,
};
