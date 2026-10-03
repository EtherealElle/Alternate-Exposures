"""Generate the share-preview card and the iOS home-screen icon."""
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1])
FONTS = Path(sys.argv[2])
PAPER = (246, 242, 235)
INK = (28, 26, 23)
ACCENT = (138, 59, 42)
RULE = (214, 208, 198)
MUTED = (111, 104, 94)


def get_fonts():
    """Cormorant Garamond from Google Fonts, falling back to Georgia."""
    css = (FONTS / "cg.css").read_text(encoding="utf-8")
    faces = {}
    for block in css.split("@font-face")[1:]:
        url = re.search(r"https://[^)]*\.ttf", block)
        style = "italic" if "font-style: italic" in block else "normal"
        weight = re.search(r"font-weight:\s*(\d+)", block)
        if url:
            faces[(style, weight.group(1) if weight else "400")] = url.group(0)
    paths = {}
    for key, url in faces.items():
        name = f"cg-{key[0]}-{key[1]}.ttf"
        dest = FONTS / name
        if not dest.exists():
            urllib.request.urlretrieve(url, dest)
        paths[key] = dest
    regular = paths.get(("normal", "500")) or paths.get(("normal", "400"))
    italic = paths.get(("italic", "500")) or paths.get(("italic", "400")) or regular
    if not regular:
        regular = italic = Path("C:/Windows/Fonts/georgia.ttf")
    return regular, italic


def tracked(draw, xy, text, font, fill, spacing):
    """Draw text with extra letter spacing; returns the width used."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + spacing
    return x - spacing - xy[0]


def tracked_width(draw, text, font, spacing):
    return sum(draw.textlength(c, font=font) for c in text) + spacing * (len(text) - 1)


def share_card(regular, italic):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle([36, 36, W - 37, H - 37], outline=RULE, width=2)

    big = ImageFont.truetype(str(regular), 132)
    big_i = ImageFont.truetype(str(italic), 132)
    small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 25)
    tiny = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 23)

    word1, word2 = "Alternate ", "Exposures"
    w1 = d.textlength(word1, font=big)
    w2 = d.textlength(word2, font=big_i)
    x = (W - (w1 + w2)) / 2
    y = 214
    d.text((x, y), word1, font=big, fill=INK)
    d.text((x + w1, y), word2, font=big_i, fill=ACCENT)

    kicker = "PHOTO & VIDEO"
    kw = tracked_width(d, kicker, small, 7)
    tracked(d, ((W - kw) / 2, 158), kicker, small, MUTED, 7)

    tagline = "MUSIC VIDEOS  ·  COVER ART  ·  MERCH DROPS  ·  ATLANTA, GA"
    tw = tracked_width(d, tagline, tiny, 4)
    tracked(d, ((W - tw) / 2, 452), tagline, tiny, MUTED, 4)

    d.line([(W / 2 - 40, 424), (W / 2 + 40, 424)], fill=ACCENT, width=2)

    path = OUT / "images/share-card.png"
    img.save(path, "PNG", optimize=True)
    print("wrote", path, path.stat().st_size // 1024, "KB")


def app_icon(regular, italic):
    size = 180
    img = Image.new("RGB", (size, size), PAPER)
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(str(regular), 124)
    fi = ImageFont.truetype(str(italic), 124)
    a_box = d.textbbox((0, 0), "A", font=f)
    e_box = d.textbbox((0, 0), "E", font=fi)
    a_w = a_box[2] - a_box[0]
    e_w = e_box[2] - e_box[0]
    top = min(a_box[1], e_box[1])
    bottom = max(a_box[3], e_box[3])
    x = (size - (a_w + e_w + 4)) / 2
    y = (size - (bottom - top)) / 2 - top
    d.text((x - a_box[0], y), "A", font=f, fill=INK)
    d.text((x + a_w + 4 - e_box[0], y), "E", font=fi, fill=ACCENT)
    path = OUT / "images/apple-touch-icon.png"
    img.save(path, "PNG", optimize=True)
    print("wrote", path, path.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    reg, ital = get_fonts()
    print("fonts:", reg.name, ital.name)
    share_card(reg, ital)
    app_icon(reg, ital)
