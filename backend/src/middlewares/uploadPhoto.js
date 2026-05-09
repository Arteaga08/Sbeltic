import multer from "multer";
import AppError from "../utils/appError.js";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 25 * 1024 * 1024;

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new AppError("Formato no soportado. Usa JPEG, PNG o WEBP", 415), false);
    }
    cb(null, true);
  },
}).single("file");

export default uploadPhoto;
