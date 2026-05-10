#!/usr/bin/env python3
import math
import struct
import sys
import zlib
from pathlib import Path


def hex_rgb(value: str) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), 255)


def blend(a: tuple[int, int, int, int], b: tuple[int, int, int, int], t: float) -> tuple[int, int, int, int]:
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(4))


def set_px(img: list[list[tuple[int, int, int, int]]], x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if 0 <= y < len(img) and 0 <= x < len(img[0]):
        img[y][x] = color


def rounded_rect_mask(x: int, y: int, left: int, top: int, right: int, bottom: int, radius: int) -> bool:
    if not (left <= x <= right and top <= y <= bottom):
        return False
    cx = left + radius if x < left + radius else right - radius if x > right - radius else x
    cy = top + radius if y < top + radius else bottom - radius if y > bottom - radius else y
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def fill_rounded_rect(img, box, radius, color) -> None:
    left, top, right, bottom = box
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            if rounded_rect_mask(x, y, left, top, right, bottom, radius):
                set_px(img, x, y, color)


def fill_circle(img, cx: int, cy: int, radius: int, color) -> None:
    r2 = radius * radius
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                set_px(img, x, y, color)


def draw_line(img, points, width, color) -> None:
    radius = max(1, width // 2)
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        steps = max(abs(x2 - x1), abs(y2 - y1), 1)
        for step in range(steps + 1):
            t = step / steps
            x = round(x1 * (1 - t) + x2 * t)
            y = round(y1 * (1 - t) + y2 * t)
            fill_circle(img, x, y, radius, color)


def draw_icon(size: int) -> list[list[tuple[int, int, int, int]]]:
    transparent = (0, 0, 0, 0)
    img = [[transparent for _ in range(size)] for _ in range(size)]
    s = size / 1024
    top = hex_rgb("#16392f")
    bottom = hex_rgb("#f1c766")
    outer_radius = round(190 * s)

    for y in range(size):
        row_color = blend(top, bottom, y / max(1, size - 1))
        for x in range(size):
            if rounded_rect_mask(x, y, 0, 0, size - 1, size - 1, outer_radius):
                img[y][x] = row_color

    fill_circle(img, round(780 * s), round(250 * s), round(185 * s), (41, 152, 93, 120))
    fill_rounded_rect(
        img,
        [round(185 * s), round(220 * s), round(839 * s), round(790 * s)],
        round(84 * s),
        hex_rgb("#fff8e8"),
    )
    fill_rounded_rect(
        img,
        [round(285 * s), round(300 * s), round(555 * s), round(360 * s)],
        round(25 * s),
        hex_rgb("#203f32"),
    )
    fill_rounded_rect(
        img,
        [round(285 * s), round(390 * s), round(460 * s), round(436 * s)],
        round(22 * s),
        hex_rgb("#d7a84c"),
    )

    chart = [
        (round(285 * s), round(640 * s)),
        (round(405 * s), round(530 * s)),
        (round(505 * s), round(570 * s)),
        (round(650 * s), round(390 * s)),
        (round(745 * s), round(445 * s)),
    ]
    draw_line(img, chart, max(3, round(34 * s)), hex_rgb("#13844f"))
    for x, y in chart:
        fill_circle(img, x, y, max(3, round(24 * s)), hex_rgb("#13844f"))

    return img


def resize_nearest(img, size: int):
    source_size = len(img)
    return [[img[math.floor(y * source_size / size)][math.floor(x * source_size / size)] for x in range(size)] for y in range(size)]


def write_png(path: Path, img) -> None:
    height = len(img)
    width = len(img[0])
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend([r, g, b, a])

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    source = draw_icon(1024)
    for size in [16, 32, 64, 128, 256, 512, 1024]:
        write_png(out_dir / f"icon_{size}x{size}.png", resize_nearest(source, size))
        if size <= 512:
            retina = size * 2
            write_png(out_dir / f"icon_{size}x{size}@2x.png", resize_nearest(source, retina))


if __name__ == "__main__":
    main()
