"""Record every beat listed in data/<id>/beats.json with an edge-tts neural
voice (clips cached in .cache/<id>/), and write data/<id>/timings.json:
duration plus the start time of each displayed word (for captions and
word-timed cues). Beats already recorded under the same key are reused, so
editing one line re-records only that line.

    .venv/Scripts/python scripts/tts.py [chapter-id ...]
"""
import asyncio, json, re, sys
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parent.parent
CONCURRENCY = 4


def norm(w: str) -> str:
    return re.sub(r"[^0-9a-z]", "", w.lower())


def align(say: str, marks: list[tuple[float, str]]) -> list[dict]:
    """Give each displayed word (split on spaces) the start time of the spoken
    word it begins with; words the voice reads as several (12,000) or skips
    (punctuation) take the nearest earlier time."""
    # A mark can hold several words ("62 percent"): spread them up to the next mark.
    flat = []
    for i, (t0, text) in enumerate(marks):
        parts = text.split()
        t1 = marks[i + 1][0] if i + 1 < len(marks) else t0 + 0.4 * len(parts)
        flat += [(t0 + (t1 - t0) * n / len(parts), p) for n, p in enumerate(parts)]
    out, j, last = [], 0, 0.0
    for w in say.split():
        key = norm(w)
        for k in range(j, min(j + 4, len(flat))):
            mk = norm(flat[k][1])
            if key and mk and (key.startswith(mk) or mk.startswith(key)):
                last, j = flat[k][0], k + 1
                break
        out.append({"w": w, "t": round(last, 3)})
    return out


async def record(beat, voice, audio_dir: Path, sem):
    path = audio_dir / f"{beat['key']}.mp3"
    marks_path = audio_dir / f"{beat['key']}.json"
    async with sem:
        if not (path.exists() and marks_path.exists()):
            for attempt in range(4):
                try:
                    comm = edge_tts.Communicate(beat["say"], voice, rate=beat["rate"], pitch=beat["pitch"], boundary="WordBoundary")
                    audio, marks = bytearray(), []

                    async def take():
                        async for ch in comm.stream():
                            if ch["type"] == "audio":
                                audio.extend(ch["data"])
                            elif ch["type"] == "WordBoundary":
                                marks.append((ch["offset"] / 1e7, ch["text"]))

                    await asyncio.wait_for(take(), 60)  # a stalled connection retries instead of hanging
                    path.write_bytes(audio)
                    marks_path.write_text(json.dumps(marks))
                    break
                except Exception as e:  # network hiccups: retry
                    print(f"  retry {beat['key']}: {e}")
                    await asyncio.sleep(2 + attempt * 3)
            else:
                raise RuntimeError(f"could not record {beat['key']}")
    marks = json.loads(marks_path.read_text())
    return beat["key"], {"dur": round(MP3(path).info.length, 3), "words": align(beat["say"], marks)}


async def main(ids):
    for cid in ids:
        spec = json.loads((ROOT / "data" / cid / "beats.json").read_text(encoding="utf-8"))
        audio_dir = ROOT / ".cache" / cid
        audio_dir.mkdir(parents=True, exist_ok=True)
        sem = asyncio.Semaphore(CONCURRENCY)
        results = await asyncio.gather(*(record(b, spec["voice"], audio_dir, sem) for b in spec["beats"]))
        timings = dict(results)
        (ROOT / "data" / cid / "timings.json").write_text(json.dumps(timings, indent=0))
        total = sum(v["dur"] for v in timings.values())
        print(f"{cid}: {len(timings)} beats recorded, {total / 60:.1f} min of speech")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:] or ["ch01"]))
