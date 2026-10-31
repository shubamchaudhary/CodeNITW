// FNV-1a over voice, rate and text: the audio file name for a beat, shared by
// the export script (Node) and the composition (browser), so editing one line
// re-records only that line.
export const beatKey = (voice: string, rate: string, say: string): string => {
  let h = 0x811c9dc5;
  const s = `${voice}|${rate}|${say}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};
