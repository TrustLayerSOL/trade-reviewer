#!/usr/bin/env python3
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
INDEX = DIST / "index.html"


def main() -> None:
    html = INDEX.read_text()

    script_match = re.search(r'<script type="module"[^>]*src="(\./assets/[^"]+\.js)"[^>]*></script>', html)
    style_match = re.search(r'<link rel="stylesheet"[^>]*href="(\./assets/[^"]+\.css)"[^>]*>', html)
    if not script_match or not style_match:
        raise SystemExit("Could not find Vite JS and CSS assets to inline.")

    js = (DIST / script_match.group(1).removeprefix("./")).read_text()
    css = (DIST / style_match.group(1).removeprefix("./")).read_text()

    html = html.replace(style_match.group(0), f"<style>\n{css}\n</style>")
    html = html.replace(script_match.group(0), "")
    html = html.replace("</body>", f"<script>\n{js}\n</script>\n</body>")
    INDEX.write_text(html)

    for path in (DIST / "assets").glob("*"):
        path.unlink()
    (DIST / "assets").rmdir()


if __name__ == "__main__":
    main()
