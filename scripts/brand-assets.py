# Cuts the official logo (public/brand/logo.png, transparent PNG) into the files the site uses.
# Re-run after replacing logo.png: `python3 scripts/brand-assets.py` (needs Pillow: pip install pillow).
#
#   public/brand/cao-gia-logo.png       full stacked logo, trimmed — schema.org logo, print, email
#   public/brand/cao-gia-mark.webp      "CG" emblem only — header, footer, CMS
#   public/brand/cao-gia-wordmark.webp  "CAO GIA" lettering only — beside the emblem in the header
#   public/brand/app-icon-512.png      emblem on a white square — social profiles, app stores
#   src/app/icon.png, apple-icon.png, favicon.ico — browser and home-screen icons (white tile,
#   because the brown logo disappears on dark browser tabs)
# The source is noisy, so PNG barely compresses and a 256-colour palette bands the copper gradient:
# on-page images are WebP; the full logo stays PNG for email clients (Outlook has no WebP).
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public/brand"
APP = ROOT / "src/app"

logo = Image.open(BRAND / "logo.png").convert("RGBA")
alpha = logo.getchannel("A")


def bands(img: Image.Image) -> list[tuple[int, int]]:
    """Horizontal bands of rows that contain visible pixels (emblem, then lettering)."""
    a = img.getchannel("A").point(lambda v: 255 if v > 40 else 0)
    w, h = img.size
    rows = [a.crop((0, y, w, y + 1)).getbbox() is not None for y in range(h)]
    out, start = [], None
    for y, filled in enumerate(rows + [False]):
        if filled and start is None:
            start = y
        elif not filled and start is not None:
            out.append((start, y))
            start = None
    return out


def trim(img: Image.Image, pad: float = 0.0) -> Image.Image:
    box = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(box)
    if pad:
        p = round(max(img.size) * pad)
        canvas = Image.new("RGBA", (img.width + 2 * p, img.height + 2 * p), (0, 0, 0, 0))
        canvas.paste(img, (p, p))
        img = canvas
    return img


def fit_height(img: Image.Image, height: int) -> Image.Image:
    return img.resize((round(img.width * height / img.height), height), Image.LANCZOS)


def fit_width(img: Image.Image, width: int) -> Image.Image:
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def tile(mark: Image.Image, size: int, radius: float, inset: float) -> Image.Image:
    """Emblem centred on a white (optionally rounded) square."""
    from PIL import ImageDraw

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * radius), fill="white")
    inner = round(size * (1 - 2 * inset))
    m = mark.copy()
    m.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return canvas


def save(img: Image.Image, path: Path) -> None:
    if path.suffix == ".webp":
        img.save(path, quality=90, method=6)
    else:
        img.save(path, optimize=True)
    print(f"{path.relative_to(ROOT)}  {img.width}×{img.height}  {path.stat().st_size // 1024} KB")


(emblem_top, emblem_bottom), (word_top, word_bottom) = bands(logo)[:2]
w = logo.width
mark = trim(logo.crop((0, emblem_top, w, emblem_bottom)))
word = trim(logo.crop((0, word_top, w, word_bottom)))

save(fit_width(trim(logo), 512), BRAND / "cao-gia-logo.png")
save(fit_height(mark, 256), BRAND / "cao-gia-mark.webp")
save(fit_height(word, 96), BRAND / "cao-gia-wordmark.webp")
save(tile(mark, 512, 0, 0.12), BRAND / "app-icon-512.png")

save(tile(mark, 192, 0.22, 0.1), APP / "icon.png")
save(tile(mark, 180, 0, 0.12).convert("RGB"), APP / "apple-icon.png")
ico = tile(mark, 256, 0.22, 0.06)
ico.save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("src/app/favicon.ico  16/32/48")
