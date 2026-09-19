"""Shrink photos uploaded through Pages CMS to web size.

Runs in GitHub Actions before each deploy. For every image in images/:
  - resizes so the longest side is at most MAX_SIDE pixels
  - applies the camera's rotation, then strips metadata (EXIF, including GPS)
  - re-compresses JPEG/WebP at a high visual quality

An image is only processed when it's too large or still carries metadata,
so already-optimized files are never re-compressed (no quality loss over time).
"""

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2] / "images"
MAX_SIDE = 2400
QUALITY = 82
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def needs_work(img: Image.Image) -> bool:
    return max(img.size) > MAX_SIDE or bool(img.getexif())


def optimize(path: Path) -> bool:
    with Image.open(path) as img:
        if not needs_work(img):
            return False
        fmt = img.format
        icc = img.info.get("icc_profile")
        img = ImageOps.exif_transpose(img)
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)

        if fmt == "JPEG":
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            img.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True, icc_profile=icc)
        elif fmt == "WEBP":
            img.save(path, "WEBP", quality=QUALITY, method=6, icc_profile=icc)
        else:
            img.save(path, "PNG", optimize=True)
    return True


def main() -> None:
    changed = 0
    for path in sorted(ROOT.rglob("*")):
        if path.suffix.lower() not in EXTENSIONS or not path.is_file():
            continue
        before = path.stat().st_size
        try:
            if optimize(path):
                changed += 1
                after = path.stat().st_size
                print(f"optimized {path.relative_to(ROOT.parent)}: {before // 1024} KB -> {after // 1024} KB")
        except Exception as exc:  # a bad file shouldn't block the deploy
            print(f"skipped {path.relative_to(ROOT.parent)}: {exc}")
    print(f"{changed} image(s) optimized")


if __name__ == "__main__":
    main()
