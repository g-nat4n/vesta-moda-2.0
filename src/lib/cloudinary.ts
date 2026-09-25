import { v2 as cloudinary } from "cloudinary";

function configured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function isCloudinaryConfigured() {
  return configured();
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadImage(file: File) {
  if (!configured()) {
    throw new Error("Cloudinary não configurado.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Cada imagem pode ter no máximo 8 MB.");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "vesta-moda",
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function storeProductPhoto(file: File) {
  if (configured()) {
    return uploadImage(file);
  }
  const { saveLocalImage } = await import("@/lib/uploads");
  return saveLocalImage(file);
}
