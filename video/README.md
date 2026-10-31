# AI Stack lecture videos

Narrated, animated lectures for the AI Stack chapters (`src/Data/aiStackDocs/CH-xx.md`), built with Remotion. The same scenes are played live on the chapter page (`src/pages/Notes/LecturePlayer.jsx`, via `@remotion/player`) and can be rendered to an MP4.

## Pipeline

1. **Script**: `src/chapters/chXX.ts`, a list of scenes. Each scene has beats; beat *n* is spoken and drives visual step *n*. Scene kinds live in `src/lib/types.ts`. Most scenes use the generic kinds (`flow`, `image`, `bullets`, `chat`, `code`, …); one-off animations are `custom` scenes in `src/scenes/custom*.tsx`.
2. **Voice**: `npm run tts` exports every beat to `data/chXX/beats.json`, records each line with an edge-tts neural voice into `.cache/chXX/` (only changed lines), writes word timings to `data/chXX/timings.json`, and mixes the lines onto one track, `../public/lectures/chXX/lecture.mp3`.
3. **Preview**: `npm run studio`, or `node scripts/stills.ts ch01 [scene:step ...]` followed by `.venv/Scripts/python scripts/sheets.py` for contact sheets.
4. **Render** (optional, for a file): `npx remotion render src/index.ts ch01 out/ch01.mp4`.

Images and narration live in the site's `public/lectures/chXX/`, which is Remotion's public dir too (`remotion.config.ts`), so the page and the render read the same files.

Setup, once: `npm install`, `python -m venv .venv`, and `.venv/Scripts/python -m pip install edge-tts mutagen pillow`.

A new chapter needs:
- its script in `src/chapters/`;
- an entry in `src/chapters/index.ts`;
- its `timings.json` import in `src/Root.tsx`;
- on the site side, its id in `src/pages/Notes/lectures.js` and a loader in `LecturePlayer.jsx`.

Images are reused under their licences and credited on screen: Jay Alammar's illustrated guides (CC BY-NC-SA 4.0) and Wikimedia Commons (CC0).
