// A lecture's narration, streamed into its <audio> element a window at a time.
// Given the whole file, the browser keeps everything it has played or jumped
// to until the page closes (all 70 MB of a 145-minute lecture by its end).
// Here only the next 10 minutes and the last 2 are ever held (~6 MB), wherever
// the listener jumps, and a jump fetches the new place first. The 10 minutes
// ahead are earned by listening: 2 right after a jump, growing 4 s for every
// second heard, so skimming through a lecture doesn't download it.
//
// The files are constant-bitrate MP3 (video/scripts/mix-audio.ts: 64 kbps), so
// a time maps to a byte range with no index: every frame is the same size.
// The file is read in 30-second chunks with Range requests and appended to a
// MediaSource; chunks that leave the window are removed again. Where
// MediaSource can't play MP3 (iPhone Safari) or a file isn't constant-bitrate,
// the element is given the file and streams it as before.

const AHEAD_S = 600;
const FIRST_AHEAD_S = 120;
const AHEAD_PER_HEARD_S = 4;
const BEHIND_S = 120;
const CHUNK_S = 30;
const HEADER_BYTES = 16384;
const RETRY_MS = [1000, 2000, 5000, 10000, 30000];

const KBPS = {
  mpeg1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  mpeg2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const isSync = (b, i) => b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0;

// Where the audio frames start, their size and length, and how many there
// are, read from the file's first bytes. null unless every frame is provably
// the same size: a Layer III stream marked constant-bitrate ("Info", not
// "Xing") whose frame size is a whole number of bytes (so no padding byte).
export function readMp3Layout(b, fileSize) {
  let p = 0;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) {
    p = 10 + (((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f)) + (b[5] & 0x10 ? 10 : 0);
  }
  while (p < b.length - 4 && !isSync(b, p)) p++;
  if (p >= b.length - 4) return null;
  const version = (b[p + 1] >> 3) & 3; // 3 MPEG-1, 2 MPEG-2, 0 MPEG-2.5
  const layer = (b[p + 1] >> 1) & 3; // 1 = Layer III
  if (layer !== 1 || version === 1) return null;
  const kbps = KBPS[version === 3 ? "mpeg1" : "mpeg2"][b[p + 2] >> 4];
  const rate = SAMPLE_RATES[version][(b[p + 2] >> 2) & 3];
  if (!kbps || !rate) return null;
  const samples = version === 3 ? 1152 : 576;
  const bytes = (samples / 8) * ((kbps * 1000) / rate);
  if (!Number.isInteger(bytes)) return null;
  const mono = b[p + 3] >> 6 === 3;
  const x = p + 4 + (version === 3 ? (mono ? 17 : 32) : mono ? 9 : 17);
  if (String.fromCharCode(...b.subarray(x, x + 4)) !== "Info") return null;
  const flags = u32(b, x + 4);
  let q = x + 8;
  const frames = flags & 1 ? u32(b, q) : 0;
  q += (flags & 1 ? 4 : 0) + (flags & 2 ? 4 : 0) + (flags & 4 ? 100 : 0) + (flags & 8 ? 4 : 0);
  // The encoder tag (LAME, or FFmpeg's Lavc) records the silence the encoder
  // put before the first sample; decoders that honour it start after it.
  const tagged = /^(LAME|Lavc|Lavf|L3\.)/.test(String.fromCharCode(...b.subarray(q, q + 4)));
  const delay = tagged ? (b[q + 21] << 4) | (b[q + 22] >> 4) : 0;
  const start = p + bytes + ((b[p + 2] >> 1) & 1); // after the Info frame
  // The frames that follow must be back to back at that size.
  for (let i = start; i + 4 < b.length; i += bytes) if (!isSync(b, i)) return null;
  const count = frames || Math.floor((fileSize - start) / bytes);
  if (!count || start + count * bytes > fileSize) return null;
  return { start, bytes, frameS: samples / rate, count, leadS: delay / rate };
}

// Opens the narration at `url`. The returned object owns the <audio> element
// (not in the page; playing it is up to the caller) and says when it should be
// sounding but can't yet, so the picture can wait for it.
export function openNarration(url) {
  const audio = new Audio();
  audio.preload = "auto";
  const listeners = new Set();
  let destroyed = false;
  let failed = false;
  let inflight = null; // { chunk, abort }
  let pump = () => {};

  const notify = () => listeners.forEach((f) => f());
  for (const type of ["play", "pause", "playing", "waiting", "seeking", "seeked", "canplay", "loadeddata", "ended"]) {
    audio.addEventListener(type, notify);
  }
  // "playing" fires before the sound does: opening the audio output can take
  // half a second. Until the clock has really moved since the last play or
  // seek, the voice counts as still loading.
  let moved = false;
  let watch = null;
  const watchForSound = () => {
    moved = false;
    clearTimeout(watch);
    const from = audio.currentTime;
    const check = () => {
      if (destroyed || audio.paused) return;
      if (!audio.seeking && audio.currentTime !== from) {
        moved = true;
        notify();
      } else watch = setTimeout(check, 15);
    };
    watch = setTimeout(check, 15);
  };
  audio.addEventListener("play", watchForSound);
  audio.addEventListener("seeked", () => {
    if (!audio.paused) watchForSound();
  });
  const streamWhole = () => {
    if (!destroyed) audio.src = url;
  };
  // If the browser can't decode what was appended, start over with the file
  // itself, at the same place; a second failure is final.
  let windowedOn = false;
  audio.addEventListener("error", () => {
    if (windowedOn && !destroyed) {
      windowedOn = false;
      pump = () => {};
      inflight?.abort();
      const t = audio.currentTime;
      const playing = !audio.paused;
      console.warn("narration: streaming the whole file instead:", audio.error?.message || "decode error");
      streamWhole();
      audio.currentTime = t;
      if (playing) audio.play().catch(() => {});
      return;
    }
    failed = true;
    notify();
  });

  const windowed = async (layout) => {
    const ms = new MediaSource();
    const objectUrl = URL.createObjectURL(ms);
    audio.src = objectUrl;
    await new Promise((r) => ms.addEventListener("sourceopen", r, { once: true }));
    URL.revokeObjectURL(objectUrl);
    if (destroyed) return;
    windowedOn = true;
    const sb = ms.addSourceBuffer("audio/mpeg");
    // MP3 has no timestamps of its own: frames are timed in arrival order, and
    // each run of chunks is placed with timestampOffset.
    if (sb.mode !== "sequence") sb.mode = "sequence";
    ms.duration = layout.count * layout.frameS;

    const perChunk = Math.round(CHUNK_S / layout.frameS);
    const chunks = Math.ceil(layout.count / perChunk);
    const chunkS = perChunk * layout.frameS;
    const chunkAt = (t) => Math.min(chunks - 1, Math.max(0, Math.floor((t + layout.leadS) / chunkS)));
    const have = new Set();
    let last = -1; // the chunk appended last: the next one can follow on directly
    let capS = AHEAD_S; // lowered if the browser's buffer is smaller
    let heardFrom = 0; // where listening resumed after the last jump
    let busy = false;
    let again = false;
    let retry = 0;
    let retryTimer = null;

    const op = (run) =>
      new Promise((resolve, reject) => {
        const done = () => {
          sb.removeEventListener("updateend", done);
          sb.removeEventListener("error", fail);
          resolve();
        };
        const fail = () => {
          done();
          reject(new Error("the narration buffer refused data"));
        };
        sb.addEventListener("updateend", done);
        sb.addEventListener("error", fail);
        try {
          run();
        } catch (e) {
          sb.removeEventListener("updateend", done);
          sb.removeEventListener("error", fail);
          reject(e);
        }
      });

    const load = async (i) => {
      const from = i * perChunk;
      const to = Math.min(from + perChunk, layout.count);
      const ctl = new AbortController();
      inflight = { chunk: i, abort: () => ctl.abort() };
      try {
        const res = await fetch(url, {
          headers: { Range: `bytes=${layout.start + from * layout.bytes}-${layout.start + to * layout.bytes - 1}` },
          signal: ctl.signal,
        });
        if (res.status !== 206) {
          ctl.abort(); // not a range: don't download the whole file
          throw new Error(`narration range request: HTTP ${res.status}`);
        }
        const data = await res.arrayBuffer();
        if (destroyed) return;
        if (last !== i - 1 || !have.has(i - 1)) {
          if (ms.readyState === "open") sb.abort();
          sb.timestampOffset = from * layout.frameS - layout.leadS;
        }
        // The first chunk starts before 0 by the encoder's lead; the append
        // window trims that part off.
        await op(() => sb.appendBuffer(data));
        have.add(i);
        last = i;
      } finally {
        inflight = null;
      }
    };

    const drop = async (i) => {
      const from = Math.max(0, i * chunkS - layout.leadS);
      await op(() => sb.remove(Math.min(from, ms.duration), (i + 1) * chunkS - layout.leadS));
      have.delete(i);
      if (last === i) last = -1;
    };

    pump = async () => {
      if (destroyed || !windowedOn) return;
      if (busy) {
        again = true;
        return;
      }
      busy = true;
      try {
        for (;;) {
          if (destroyed || !windowedOn) return;
          const t = audio.currentTime;
          const aheadS = Math.min(capS, FIRST_AHEAD_S + AHEAD_PER_HEARD_S * Math.max(0, t - heardFrom));
          const first = chunkAt(t);
          const end = chunkAt(t + aheadS);
          const keepFrom = chunkAt(t - BEHIND_S);
          for (const i of [...have]) if (i < keepFrom || i > end + 1) await drop(i);
          let next = -1;
          for (let i = first; i <= end; i++) {
            if (!have.has(i)) {
              next = i;
              break;
            }
          }
          if (next < 0) break;
          try {
            await load(next);
            retry = 0;
          } catch (e) {
            if (destroyed) return;
            if (e.name === "AbortError") continue; // a jump wanted another chunk first
            if (e.name === "QuotaExceededError" && capS > 2 * CHUNK_S) {
              capS = Math.max(2 * CHUNK_S, Math.min(capS, aheadS) / 2); // the browser's buffer is smaller than our window
              continue;
            }
            throw e;
          }
        }
        if (have.has(chunks - 1) && ms.readyState === "open" && !sb.updating) ms.endOfStream();
      } catch (e) {
        if (destroyed) return;
        // Offline or a failed request: try again, more slowly each time. The
        // picture waits meanwhile, since the voice is waiting.
        console.warn("narration:", e?.message || e);
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => pump(), RETRY_MS[Math.min(retry++, RETRY_MS.length - 1)]);
      } finally {
        busy = false;
        if (again && !destroyed) {
          again = false;
          pump();
        }
      }
    };

    audio.addEventListener("seeking", () => {
      // A jump outside what is held: the chunk under the new position comes first.
      const want = chunkAt(audio.currentTime);
      heardFrom = audio.currentTime;
      if (inflight && inflight.chunk !== want && !have.has(want)) inflight.abort();
      pump();
    });
    audio.addEventListener("timeupdate", () => pump());
    pump();
  };

  (async () => {
    let layout = null;
    if (window.MediaSource?.isTypeSupported?.("audio/mpeg")) {
      const ctl = new AbortController();
      try {
        const res = await fetch(url, { headers: { Range: `bytes=0-${HEADER_BYTES - 1}` }, signal: ctl.signal });
        const size = Number(res.headers.get("content-range")?.split("/")[1]);
        if (res.status === 206 && size) layout = readMp3Layout(new Uint8Array(await res.arrayBuffer()), size);
        else ctl.abort();
      } catch {
        layout = null;
      }
    }
    if (destroyed) return;
    if (!layout) return streamWhole();
    try {
      await windowed(layout);
    } catch (e) {
      console.warn("narration: streaming the whole file instead:", e?.message || e);
      streamWhole();
    }
  })();

  return {
    audio,
    // Should be sounding (playing, not paused) but isn't yet: seeking, waiting
    // for data, or the output still starting. False once it has failed for good.
    waiting: () => !failed && !audio.paused && !audio.ended && (audio.seeking || audio.readyState < 3 || !moved),
    subscribe(f) {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    destroy() {
      destroyed = true;
      listeners.clear();
      clearTimeout(watch);
      inflight?.abort();
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}
