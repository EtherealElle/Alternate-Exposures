"""Turn a folder of camera exports into web-ready gallery photos.

    python .github/scripts/import_photos.py

Reads every subfolder of images/source/ (one folder per project, git-ignored)
and writes optimized copies to images/gallery/<project-slug>/<photo>.jpg:

  - longest side capped at MAX_SIDE
  - camera rotation applied, then all metadata stripped (including GPS)
  - saved as progressive JPEG at QUALITY

Originals are never modified. Re-running is safe: existing outputs are skipped
unless --force is passed.
"""

import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

SOURCE = Path("images/source")
DEST = Path("images/gallery")
MAX_SIDE = 2000
QUALITY = 80
SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return re.sub(r"-{2,}", "-", text)


def convert(src: Path, dest: Path) -> tuple[int, int]:
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return src.stat().st_size, dest.stat().st_size


def main() -> None:
    force = "--force" in sys.argv
    if not SOURCE.is_dir():
        sys.exit(f"No {SOURCE}/ folder — put one folder of photos per project in it.")

    total_before = total_after = 0
    for folder in sorted(p for p in SOURCE.iterdir() if p.is_dir()):
        slug = slugify(folder.name)
        photos = sorted(p for p in folder.iterdir() if p.suffix.lower() in SUFFIXES)
        print(f"\n{folder.name}  ->  images/gallery/{slug}/  ({len(photos)} photos)")
        for src in photos:
            dest = DEST / slug / (slugify(src.stem) + ".jpg")
            if dest.exists() and not force:
                print(f"  skip {dest.name} (already there)")
                continue
            before, after = convert(src, dest)
            total_before += before
            total_after += after
            print(f"  {src.name} -> {dest.name}  {before // 1024} KB -> {after // 1024} KB")

    if total_before:
        print(f"\n{total_before / 1e6:.0f} MB -> {total_after / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
