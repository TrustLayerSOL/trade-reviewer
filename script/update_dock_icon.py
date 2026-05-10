#!/usr/bin/env python3
import plistlib
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote


def main() -> None:
    app_path = Path(sys.argv[1]).resolve()
    dock_plist = Path.home() / "Library/Preferences/com.apple.dock.plist"
    app_url = f"file://{quote(str(app_path), safe='/')}/"

    with dock_plist.open("rb") as handle:
        dock = plistlib.load(handle)

    persistent_apps = dock.get("persistent-apps", [])
    dock["persistent-apps"] = [
        item for item in persistent_apps if dock_item_url(item) != app_url
    ]
    dock["persistent-apps"].append(make_dock_item(app_path, app_url))

    with dock_plist.open("wb") as handle:
        plistlib.dump(dock, handle, sort_keys=False)

    subprocess.run(["killall", "Dock"], check=False)


def dock_item_url(item: dict) -> str:
    return (
        item.get("tile-data", {})
        .get("file-data", {})
        .get("_CFURLString", "")
    )


def make_dock_item(app_path: Path, app_url: str) -> dict:
    label = app_path.stem
    return {
        "tile-data": {
            "file-data": {
                "_CFURLString": app_url,
                "_CFURLStringType": 15,
            },
            "file-label": label,
        },
        "tile-type": "file-tile",
    }


if __name__ == "__main__":
    main()
