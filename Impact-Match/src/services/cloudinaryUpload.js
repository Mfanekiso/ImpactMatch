import { Platform } from "react-native";

const CLOUDINARY_CLOUD_NAME = "dtpp6ojbl";
const CLOUDINARY_UPLOAD_PRESET = "impactmatch_updates";

const extensionOf = (value = "") => value.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase();

function getFileInfo(asset, fallbackName) {
  const uriExtension = extensionOf(asset?.uri || "");
  const namedExtension = /\.([a-z0-9]+)$/i.exec(asset?.fileName || "")?.[1]?.toLowerCase();
  const extension = namedExtension || (uriExtension?.length <= 5 ? uriExtension : "jpg");
  const mimeByExtension = {
    jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg", png: "image/png",
    webp: "image/webp", gif: "image/gif", heic: "image/heic", heif: "image/heif",
    avif: "image/avif", bmp: "image/bmp",
  };
  const mimeType = asset?.mimeType || mimeByExtension[extension] || "application/octet-stream";
  const givenName = asset?.fileName || "";
  return {
    name: givenName ? (namedExtension ? givenName : `${givenName}.${extension}`) : `${fallbackName}.${extension}`,
    type: mimeType,
  };
}

export async function uploadToCloudinary(asset, { folder, resourceType = "image", fallbackName = "upload" }) {
  if (!asset?.uri) throw new Error("The selected file is unavailable. Please select it again.");

  const file = getFileInfo(asset, fallbackName);
  const formData = new FormData();
  if (Platform.OS === "web") {
    const fileResponse = await fetch(asset.uri);
    if (!fileResponse.ok) throw new Error("Could not read the selected image. Please select it again.");
    const blob = await fileResponse.blob();
    formData.append("file", blob, file.name);
  } else {
    formData.append("file", { uri: asset.uri, type: file.type, name: file.name });
  }
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  if (folder) formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Cloudinary returned an unreadable response. Please try again.");
  }
  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || `Cloudinary upload failed (${response.status}). Please try another image.`);
  }
  return { ...data, fileName: file.name };
}

export function cloudinaryDeliveryUrl(url, transformations) {
  return url?.replace("/upload/", `/upload/${transformations}/`) || url;
}
