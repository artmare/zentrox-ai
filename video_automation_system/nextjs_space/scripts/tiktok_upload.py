#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import tempfile
import traceback
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse
from urllib.request import urlopen


def _print_json(payload: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()


def _normalize_hashtags(raw_hashtags: str) -> str:
    if not raw_hashtags:
        return ""
    parts = [part.strip() for part in raw_hashtags.split(",")]
    tags = [f"#{tag.lstrip('#')}" for tag in parts if tag]
    return " ".join(tags)


def _extract_external_id(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    match = re.search(r"/video/(\d+)", url)
    return match.group(1) if match else None


def _is_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _download_video(url: str) -> str:
    suffix = Path(urlparse(url).path).suffix or ".mp4"
    fd, temp_path = tempfile.mkstemp(prefix="zentrox_tiktok_", suffix=suffix)
    os.close(fd)
    with urlopen(url) as response, open(temp_path, "wb") as output_file:
        output_file.write(response.read())
    return temp_path


def _extract_url_from_result(result: Any) -> Optional[str]:
    if result is None:
        return None
    if isinstance(result, str):
        if result.startswith("http://") or result.startswith("https://"):
            return result
        return None
    if isinstance(result, dict):
        for key in ("url", "video_url", "link", "post_url"):
            value = result.get(key)
            if isinstance(value, str) and value.startswith(("http://", "https://")):
                return value
    for attr in ("url", "video_url", "link", "post_url"):
        value = getattr(result, attr, None)
        if isinstance(value, str) and value.startswith(("http://", "https://")):
            return value
    return None


def _upload_with_tiktok_uploader(video_path: str, sessionid: str, description: str) -> Any:
    from tiktok_uploader.upload import TikTokUploader  # type: ignore

    cookies_list = [
        {
            "name": "sessionid",
            "value": sessionid,
            "domain": ".tiktok.com",
            "path": "/",
            "httpOnly": True,
            "secure": True,
        }
    ]

    uploader = TikTokUploader(cookies_list=cookies_list)
    return uploader.upload_video(filename=video_path, description=description)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload video to TikTok with tiktok-uploader")
    parser.add_argument("--video", required=True, help="Local file path or URL to video")
    parser.add_argument("--sessionid", required=True, help="TikTok sessionid cookie value")
    parser.add_argument("--description", default="", help="Video description")
    parser.add_argument("--hashtags", default="", help="Hashtags separated by comma")
    return parser.parse_args()


def main() -> int:
    temp_video_path: Optional[str] = None
    try:
        args = _parse_args()
        hashtags = _normalize_hashtags(args.hashtags)
        full_description = args.description.strip()
        if hashtags:
            full_description = f"{full_description} {hashtags}".strip()

        video_path = args.video.strip()
        if _is_http_url(video_path):
            temp_video_path = _download_video(video_path)
            video_path = temp_video_path
        else:
            if not Path(video_path).exists():
                raise FileNotFoundError(f"Video file not found: {video_path}")

        result = _upload_with_tiktok_uploader(
            video_path=video_path,
            sessionid=args.sessionid.strip(),
            description=full_description,
        )

        published_url = _extract_url_from_result(result)
        external_id = _extract_external_id(published_url)

        if not published_url:
            raise RuntimeError("Upload finished but no published URL was returned by tiktok-uploader")

        _print_json(
            {
                "success": True,
                "url": published_url,
                "externalId": external_id,
            }
        )
        return 0
    except Exception as exc:
        _print_json({"success": False, "error": str(exc)})
        return 1
    finally:
        if temp_video_path and Path(temp_video_path).exists():
            try:
                os.remove(temp_video_path)
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
