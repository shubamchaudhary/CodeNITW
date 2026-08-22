// Screenshots for the topic notes pages.
//
// Cloud Storage would be the natural home for these, but Firebase now requires
// the Blaze plan for any bucket, so images live in Firestore instead — one
// document per screenshot under userProgress/{uid}/noteAssets/{id}, holding the
// image as a data URL.
//
// Two rules make that safe:
//   1. Each image is its own document, in a SUBCOLLECTION. The progress
//      document that cloudSync rewrites on every change is never touched, so a
//      screenshot can't bloat it or break syncing.
//   2. A Firestore document caps at 1 MB and base64 inflates bytes by ~33%, so
//      every image is compressed to a hard byte target before it is encoded.
//      A screenshot that can't be squeezed under the target is rejected with a
//      message rather than written and lost later.
//
// A note references an image by path (/note-asset/{id}); the notes page resolves
// those to data URLs when it renders the preview.

import { doc, getDoc, setDoc, deleteDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

// Raw bytes before base64. 500 KB → ~667 KB encoded, comfortably inside the
// 1 MB document limit with room for the other fields.
const TARGET_BYTES = 500 * 1024;
const SIZE_LADDER = [
  { edge: 1600, quality: 0.82 },
  { edge: 1600, quality: 0.7 },
  { edge: 1280, quality: 0.7 },
  { edge: 1280, quality: 0.55 },
  { edge: 1024, quality: 0.6 },
  { edge: 900, quality: 0.5 },
];

export const ASSET_PREFIX = "/note-asset/";

export class NoteAssetError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "NoteAssetError";
    this.code = code;
  }
}

// Resolved images, kept for the tab's lifetime so flipping between topics does
// not re-read the same documents.
const cache = new Map();

function assetDoc(uid, id) {
  return doc(collection(doc(db, "userProgress", uid), "noteAssets"), id);
}

// Render at a given max edge and JPEG quality. White is painted first so a PNG
// with transparency doesn't come back with a black background.
async function encode(bitmap, edge, quality) {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
}

// Walk down the ladder until the encode fits the byte target.
async function compress(file) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new NoteAssetError("That image couldn't be read.", "decode-failed");

  try {
    let best = null;
    for (const step of SIZE_LADDER) {
      const blob = await encode(bitmap, step.edge, step.quality);
      if (!blob) continue;
      best = blob;
      if (blob.size <= TARGET_BYTES) return blob;
    }
    if (best && best.size <= TARGET_BYTES * 1.1) return best;
    throw new NoteAssetError(
      "That image is too large to store even after compression — crop it and try again.",
      "too-large"
    );
  } finally {
    bitmap.close?.();
  }
}

function toDataUrl(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = () => rej(new NoteAssetError("Couldn't encode the image.", "encode-failed"));
    reader.readAsDataURL(blob);
  });
}

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Store one screenshot and return its reference path for the markdown.
export async function uploadNoteImage({ uid, source, topicId, file }) {
  if (!uid) throw new NoteAssetError("Sign in again before adding screenshots.", "no-uid");
  if (!file.type.startsWith("image/")) throw new NoteAssetError("That file isn't an image.", "not-image");

  const blob = await compress(file);
  const data = await toDataUrl(blob);
  const id = newId();

  try {
    await setDoc(assetDoc(uid, id), {
      data,
      source,
      topicId,
      bytes: blob.size,
      contentType: "image/jpeg",
      createdAt: Date.now(),
    });
  } catch (err) {
    const code = err?.code || "";
    if (code === "permission-denied") {
      throw new NoteAssetError(
        "Firestore rejected the write — deploy firestore.rules so notes can store screenshots.",
        code
      );
    }
    throw new NoteAssetError(err?.message || "Couldn't save the screenshot.", code || "unknown");
  }

  cache.set(id, data);
  return { id, path: `${ASSET_PREFIX}${id}` };
}

// Every asset id referenced by a note's markdown, in order of appearance.
export function assetIdsIn(text) {
  const ids = [];
  const re = /!\[[^\]]*\]\((\/note-asset\/([A-Za-z0-9]+))\)/g;
  let m;
  while ((m = re.exec(text || ""))) if (!ids.includes(m[2])) ids.push(m[2]);
  return ids;
}

// Resolve ids to data URLs, reading only the ones not already cached.
export async function loadNoteAssets(uid, ids) {
  const out = {};
  const missing = [];
  for (const id of ids) {
    if (cache.has(id)) out[id] = cache.get(id);
    else missing.push(id);
  }
  if (!uid || !missing.length) return out;

  await Promise.all(
    missing.map(async (id) => {
      try {
        const snap = await getDoc(assetDoc(uid, id));
        const data = snap.exists() ? snap.data()?.data : null;
        if (data) {
          cache.set(id, data);
          out[id] = data;
        }
      } catch (_) {
        // A single unreadable image shouldn't take the whole note down; the
        // preview shows a placeholder for it instead.
      }
    })
  );
  return out;
}

export async function deleteNoteAsset(uid, id) {
  try {
    await deleteDoc(assetDoc(uid, id));
    cache.delete(id);
    return true;
  } catch (_) {
    return false;
  }
}
