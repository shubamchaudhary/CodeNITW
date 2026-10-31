# AI Stack lecture videos

Narrated, animated lectures for the AI Stack chapters (`src/Data/aiStackDocs/CH-xx.md`), built with Remotion. Separate from the site: its own `package.json`, never imported by the Vite build.

## Pipeline

1. **Script**: `src/chapters/chXX.ts`, a list of scenes. Each scene has beats; beat *n* is spoken and drives visual step *n*. Scene kinds live in `src/lib/types.ts`. Most scenes use the generic kinds (`flow`, `image`, `bullets`, `chat`, `code`, …); one-off animations are `custom` scenes in `src/scenes/custom*.tsx`.
2. **Voice**: `npm run tts` exports every beat to `public/chXX/beats.json`, then records each one with an edge-tts neural voice into `public/chXX/audio/`, with word timings in `public/chXX/timings.json`. Only changed lines are re-recorded.
3. **Preview**: `npm run studio`, or `node scripts/stills.ts ch01 [scene:step ...]` followed by `.venv/Scripts/python scripts/sheets.py` for contact sheets.
4. **Render**: `npx remotion render src/index.ts ch01 out/ch01.mp4`.

Setup, once: `npm install`, `python -m venv .venv`, and `.venv/Scripts/python -m pip install edge-tts mutagen pillow`.

A new chapter needs its script in `src/chapters/`, an entry in `src/chapters/index.ts`, and its `timings.json` import in `src/Root.tsx`.

Images in `public/chXX/img/` are reused under their licences and credited on screen: Jay Alammar's illustrated guides (CC BY-NC-SA 4.0) and Wikimedia Commons (CC0).
