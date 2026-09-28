import { v2 as cloudinary } from "cloudinary";
import { readVerifiedImage } from "@/lib/uploads";

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

export async function uploadImage(file: File) {
  if (!configured()) {
    throw new Error("Cloudinary não configurado.");
  }

  const { buffer, mime } = await readVerifiedImage(file);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;

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
