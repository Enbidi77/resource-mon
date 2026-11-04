import os
import sys
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_ICON = os.path.join(ROOT_DIR, "apps", "desktop", "resources", "icon.png")
OUT_DIR = os.path.join(ROOT_DIR, "release", "store-assets")
os.makedirs(OUT_DIR, exist_ok=True)

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REGULAR = "C:/Windows/Fonts/segoeui.ttf"
FONT_SEMIBOLD = "C:/Windows/Fonts/segoeuisl.ttf" if os.path.exists("C:/Windows/Fonts/segoeuisl.ttf") else FONT_REGULAR

# 1. Cleanly Extract Squircle Icon (Antialiased Transparent Mask)
print("• Extracting high-res squircle icon...")
src = Image.open(SRC_ICON).convert("RGBA")
orig_w, orig_h = src.size

# Supersampled mask to eliminate white outer border
scale = 2
mask_hi = Image.new("L", (orig_w * scale, orig_h * scale), 0)
draw_mask = ImageDraw.Draw(mask_hi)

# Bounds of dark squircle: x: 154 to 1893, y: 194 to 1893 (width ~1739, height ~1699)
x0 = 154 * scale
y0 = 194 * scale
x1 = 1893 * scale
y1 = 1893 * scale
radius = 380 * scale
draw_mask.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=255)

# Downscale mask for smooth antialiasing
mask = mask_hi.resize((orig_w, orig_h), Image.Resampling.LANCZOS)

# Create transparent RGBA icon
clean_icon = src.copy()
clean_icon.putalpha(mask)

# Crop to squircle
cropped = clean_icon.crop((154, 194, 1893, 1893))
sq_w, sq_h = cropped.size

# Make perfectly square 1:1 canvas
max_side = max(sq_w, sq_h)
icon_square = Image.new("RGBA", (max_side, max_side), (0, 0, 0, 0))
offset_x = (max_side - sq_w) // 2
offset_y = (max_side - sq_h) // 2
icon_square.paste(cropped, (offset_x, offset_y), cropped)
print(f"✓ Square 1:1 icon prepared ({max_side}x{max_side} px)")


def draw_radial_glow(canvas, cx, cy, radius, color_rgb, max_alpha=120):
    """Draws a smooth radial ambient glow on a canvas."""
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    steps = 30
    for i in range(steps, 0, -1):
        r = int(radius * (i / steps))
        alpha = int(max_alpha * (1 - (i / steps)) ** 1.8)
        glow_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(color_rgb[0], color_rgb[1], color_rgb[2], alpha)
        )
    canvas.alpha_composite(glow)


def draw_letterspaced_text(draw, text, x, y, font, fill, spacing=4, center=True):
    """Draws text with custom letter-spacing."""
    total_w = 0
    char_widths = []
    for ch in text:
        bbox = font.getbbox(ch)
        w = bbox[2] - bbox[0]
        char_widths.append(w)
        total_w += w + spacing
    if char_widths:
        total_w -= spacing
    
    start_x = x - (total_w // 2) if center else x
    curr_x = start_x
    for i, ch in enumerate(text):
        draw.text((curr_x, y), ch, font=font, fill=fill)
        curr_x += char_widths[i] + spacing
    return total_w


# =====================================================================
# 2. Generate 9:16 Poster Art (720x1080 and 1440x2160)
# =====================================================================
def create_poster_art(w, h, filename):
    print(f"• Generating 9:16 Poster Art ({w}x{h})...")
    canvas = Image.new("RGBA", (w, h), (7, 9, 19, 255))
    
    # Scale multiplier relative to 720x1080
    s = w / 720.0
    
    # Ambient glows
    draw_radial_glow(canvas, w // 2, int(380 * s), int(340 * s), (6, 182, 212), max_alpha=110)
    draw_radial_glow(canvas, w // 2, int(820 * s), int(260 * s), (59, 130, 246), max_alpha=60)
    
    # Subtle top specular highlight arc
    draw = ImageDraw.Draw(canvas)
    draw.line([(0, 0), (w, 0)], fill=(255, 255, 255, 40), width=int(2 * s))
    
    # Icon placement
    icon_size = int(380 * s)
    resized_icon = icon_square.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    icon_x = (w - icon_size) // 2
    icon_y = int(180 * s)
    canvas.paste(resized_icon, (icon_x, icon_y), resized_icon)
    
    # Typography
    font_title = ImageFont.truetype(FONT_BOLD, size=int(40 * s))
    font_sub = ImageFont.truetype(FONT_BOLD, size=int(16 * s))
    font_badge = ImageFont.truetype(FONT_REGULAR, size=int(14 * s))
    
    # Title: SENTINEL DESKTOP
    draw_letterspaced_text(draw, "SENTINEL DESKTOP", w // 2, int(610 * s), font_title, (255, 255, 255, 255), spacing=int(5 * s))
    
    # Subtitle: ADVANCED SYSTEM TELEMETRY & SECURITY
    draw_letterspaced_text(draw, "CYBERSECURITY & SYSTEM WORKSTATION", w // 2, int(675 * s), font_sub, (56, 189, 248, 255), spacing=int(3 * s))
    
    # Feature pill / badge
    badge_text = "WIN32 NATIVE • ZERO CLOUD TELEMETRY • CIS AUDIT"
    badge_bbox = font_badge.getbbox(badge_text)
    badge_w = badge_bbox[2] - badge_bbox[0] + int(36 * s)
    badge_h = int(36 * s)
    bx0 = (w - badge_w) // 2
    by0 = int(740 * s)
    bx1 = bx0 + badge_w
    by1 = by0 + badge_h
    
    # Glass pill background
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=int(18 * s), fill=(255, 255, 255, 12), outline=(255, 255, 255, 35), width=int(1 * s))
    draw.text((w // 2 - (badge_bbox[2] - badge_bbox[0]) // 2, by0 + int(9 * s)), badge_text, font=font_badge, fill=(203, 213, 225, 220))
    
    # Bottom brand label
    font_foot = ImageFont.truetype(FONT_REGULAR, size=int(13 * s))
    foot_text = "Designed for Windows 10 & 11  •  Published by Enbidi"
    foot_bbox = font_foot.getbbox(foot_text)
    draw.text((w // 2 - (foot_bbox[2] - foot_bbox[0]) // 2, int(1020 * s)), foot_text, font=font_foot, fill=(148, 163, 184, 160))
    
    out_path = os.path.join(OUT_DIR, filename)
    canvas.save(out_path, "PNG", optimize=True)
    print(f"✓ Saved: {filename} ({os.path.getsize(out_path) // 1024} KB)")


create_poster_art(720, 1080, "PosterArt-720x1080.png")
create_poster_art(1440, 2160, "PosterArt-1440x2160.png")


# =====================================================================
# 3. Generate 1:1 Box Art (1080x1080 and 2160x2160)
# =====================================================================
def create_box_art(size, filename):
    print(f"• Generating 1:1 Box Art ({size}x{size})...")
    canvas = Image.new("RGBA", (size, size), (7, 9, 19, 255))
    s = size / 1080.0
    
    # Ambient glows
    draw_radial_glow(canvas, size // 2, int(460 * s), int(420 * s), (6, 182, 212), max_alpha=120)
    draw_radial_glow(canvas, size // 2, int(880 * s), int(300 * s), (59, 130, 246), max_alpha=60)
    
    draw = ImageDraw.Draw(canvas)
    draw.line([(0, 0), (size, 0)], fill=(255, 255, 255, 45), width=int(2 * s))
    
    # Icon placement
    icon_size = int(580 * s)
    resized_icon = icon_square.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    icon_x = (size - icon_size) // 2
    icon_y = int(140 * s)
    canvas.paste(resized_icon, (icon_x, icon_y), resized_icon)
    
    # Typography
    font_title = ImageFont.truetype(FONT_BOLD, size=int(54 * s))
    font_sub = ImageFont.truetype(FONT_BOLD, size=int(22 * s))
    
    # Title
    draw_letterspaced_text(draw, "SENTINEL DESKTOP", size // 2, int(770 * s), font_title, (255, 255, 255, 255), spacing=int(6 * s))
    # Subtitle
    draw_letterspaced_text(draw, "SYSTEM MONITOR & CYBERSECURITY", size // 2, int(850 * s), font_sub, (56, 189, 248, 255), spacing=int(3 * s))
    
    # Subtle publisher note
    font_pub = ImageFont.truetype(FONT_REGULAR, size=int(16 * s))
    pub_text = "ENBIDI"
    draw_letterspaced_text(draw, pub_text, size // 2, int(980 * s), font_pub, (148, 163, 184, 160), spacing=int(5 * s))
    
    out_path = os.path.join(OUT_DIR, filename)
    canvas.save(out_path, "PNG", optimize=True)
    print(f"✓ Saved: {filename} ({os.path.getsize(out_path) // 1024} KB)")


create_box_art(1080, "BoxArt-1080x1080.png")
create_box_art(2160, "BoxArt-2160x2160.png")


# =====================================================================
# 4. Generate Store Display Images (300x300, 150x150, 71x71)
# =====================================================================
def create_app_tile(size, filename, with_bg=False):
    print(f"• Generating App Tile Icon ({size}x{size})...")
    if with_bg:
        canvas = Image.new("RGBA", (size, size), (7, 9, 19, 255))
        # Icon fills 88%
        target_size = int(size * 0.88)
        resized_icon = icon_square.resize((target_size, target_size), Image.Resampling.LANCZOS)
        offset = (size - target_size) // 2
        canvas.paste(resized_icon, (offset, offset), resized_icon)
    else:
        # Transparent canvas with clean squircle filling ~92%
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        target_size = int(size * 0.92)
        resized_icon = icon_square.resize((target_size, target_size), Image.Resampling.LANCZOS)
        offset = (size - target_size) // 2
        canvas.paste(resized_icon, (offset, offset), resized_icon)
    
    out_path = os.path.join(OUT_DIR, filename)
    canvas.save(out_path, "PNG", optimize=True)
    print(f"✓ Saved: {filename} ({os.path.getsize(out_path) // 1024} KB)")


# Generate standard transparent tiles (Microsoft Store standard)
create_app_tile(300, "AppTileIcon-300x300.png", with_bg=False)
create_app_tile(150, "StoreLogo-150x150.png", with_bg=False)
create_app_tile(71, "StoreLogo-71x71.png", with_bg=False)

# Also generate dark-background variants in case the user prefers solid obsidian background
create_app_tile(300, "AppTileIcon-300x300-darkbg.png", with_bg=True)
create_app_tile(150, "StoreLogo-150x150-darkbg.png", with_bg=True)
create_app_tile(71, "StoreLogo-71x71-darkbg.png", with_bg=True)

print("\n🎉 All Microsoft Store logo and display assets generated successfully in:")
print(f"   {OUT_DIR}\n")
