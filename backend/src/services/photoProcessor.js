import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_ROOT = path.resolve("uploads/pacientes");

export async function processPhoto(buffer, patientId) {
  const uuid = randomUUID();
  const dir = path.join(UPLOADS_ROOT, String(patientId), "photos");
  await fs.mkdir(dir, { recursive: true });

  const webName = `${uuid}-web.jpg`;
  const thumbName = `${uuid}-thumb.jpg`;
  const webPath = path.join(dir, webName);
  const thumbPath = path.join(dir, thumbName);

  await sharp(buffer)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(webPath);

  await sharp(buffer)
    .rotate()
    .resize({ width: 400, height: 400, fit: "cover" })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);

  return {
    webUrl: `/uploads/pacientes/${patientId}/photos/${webName}`,
    thumbUrl: `/uploads/pacientes/${patientId}/photos/${thumbName}`,
    webPath,
    thumbPath,
  };
}

export async function deletePhotoFiles(patientId, webUrl, thumbUrl) {
  const webName = webUrl.split("/").pop();
  const thumbName = thumbUrl.split("/").pop();
  const dir = path.join(UPLOADS_ROOT, String(patientId), "photos");
  await Promise.all([
    fs.unlink(path.join(dir, webName)).catch(() => {}),
    fs.unlink(path.join(dir, thumbName)).catch(() => {}),
  ]);
}

export function resolvePhotoFilePath(patientId, filename) {
  return path.join(UPLOADS_ROOT, String(patientId), "photos", filename);
}
