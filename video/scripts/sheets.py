"""Tile out/stills/*.jpeg into contact sheets (out/sheets/sheet-N.jpeg) for review."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

files = sorted(Path("out/stills").glob(sys.argv[1] if len(sys.argv) > 1 else "*.jpeg"))
out = Path("out/sheets"); out.mkdir(parents=True, exist_ok=True)
for old in out.glob("*.jpeg"): old.unlink()
W, H, COLS, ROWS = 640, 360, 2, 3
for n in range(0, len(files), COLS * ROWS):
    sheet = Image.new("RGB", (W * COLS, (H + 24) * ROWS), "white")
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(files[n:n + COLS * ROWS]):
        x, y = (i % COLS) * W, (i // COLS) * (H + 24)
        sheet.paste(Image.open(f).resize((W, H)), (x, y + 24))
        d.text((x + 6, y + 6), f.stem, fill="black")
    sheet.save(out / f"sheet-{n // (COLS * ROWS):02d}.jpeg", quality=85)
print(len(files), "stills ->", len(list(out.glob('*.jpeg'))), "sheets")
