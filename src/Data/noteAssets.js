// Screenshots for the topic notes pages.
//
// A note is markdown text living in the same synced store as before; an image
// is a file in Cloud Storage and the note holds only its URL. That keeps the
// Firestore document small (it caps at 1 MB) while screenshots stay durable and
// available on every device.
//
// Images are downscaled in the browser before upload: a 4K screenshot is ~8 MB
// of PNG and ~300 KB of JPEG at 1600px wide, and nothing on a notes page needs
// more than that.

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;
// Anything at or under this is uploaded untouched — re-encoding a small PNG
// (a diagram, a screenshot of text) usually makes it worse, not smaller.
const SKIP_RESIZE_BYTES = 300 * 1024;

export class NoteAssetError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "NoteAssetError";
    this.code = code;
  }
}

function extensionFor(type) {
  if (type === "image/png") return "png";
  if (type === "image/gif") return "gif";
  if (type === "image/webp") return "webp";
  return "jpg";
}

// Draw the image into a canvas no larger than MAX_EDGE on its longest side.
// Returns the original blob unchanged when it is already small, or when the
// browser can't decode it (GIFs would lose animation, so they pass through).
async function downscale(file) {
  if (file.size <= SKIP_RESIZE_BYTES || file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1024 * 1024) {
    bitmap.close?.();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY));
  // If the re-encode somehow grew the file, keep the original.
  return blob && blob.size < file.size ? blob : file;
}

function pathFor(uid, source, topicId, ext) {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `noteAssets/${uid}/${source}/${topicId}/${stamp}.${ext}`;
}

// Upload one image and return { url, path }. Throws NoteAssetError with a
// message meant to be shown to the user — the common failure is that Cloud
// Storage has never been enabled for the project, which is a console action,
// not something the app can fix.
export async function uploadNoteImage({ uid, source, topicId, file }) {
  if (!uid) throw new NoteAssetError("Sign in again before uploading.", "no-uid");
  if (!file.type.startsWith("image/")) {
    throw new NoteAssetError("That file isn't an image.", "not-image");
  }

  const blob = await downscale(file);
  const path = pathFor(uid, source, topicId, extensionFor(blob.type || file.type));

  try {
    const objectRef = ref(storage, path);
    await uploadBytes(objectRef, blob, {
      contentType: blob.type || file.type,
      cacheControl: "public, max-age=31536000",
    });
    return { url: await getDownloadURL(objectRef), path };
  } catch (err) {
    const code = err?.code || "";
    if (code === "storage/unauthorized") {
      throw new NoteAssetError(
        "Storage rejected the upload — deploy storage.rules (firebase deploy --only storage).",
        code
      );
    }
    if (code === "storage/unknown" || code === "storage/retry-limit-exceeded") {
      throw new NoteAssetError(
        "Couldn't reach Cloud Storage. Enable Storage for this Firebase project, then retry.",
        code
      );
    }
    throw new NoteAssetError(err?.message || "Upload failed.", code || "unknown");
  }
}

// Best-effort delete, used when an upload is undone right after it happened.
// A missing object is not an error worth surfacing.
export async function deleteNoteImage(path) {
  try {
    await deleteObject(ref(storage, path));
    return true;
  } catch (_) {
    return false;
  }
}
