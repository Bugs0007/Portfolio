"""Restore travel masters without resizing or dropping frames.

JPEG/PNG photos are copied byte-for-byte. HEIC photographs are decoded into
native-resolution, lossless WebP with their color profile. Video masters are
remuxed unchanged when supported; HEVC also gets a high-quality H.264 fallback
for browsers without HEVC. No original is modified or deleted.

Requires Pillow + pillow-heif and ffmpeg/ffprobe. A temporary decoder installed
in .audit-tmp/heif-deps is also detected. Input mapping is an audit artifact.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = Path(__file__).resolve().parent.parent
SDR_FILTER = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
sys.path.insert(0, str(ROOT / ".audit-tmp/heif-deps"))
from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()


def run(*args):
    completed = subprocess.run([str(arg) for arg in args], capture_output=True, text=True)
    if completed.returncode:
        raise RuntimeError(completed.stderr[-5000:])
    return completed.stdout


def probe(path, ffprobe):
    return json.loads(run(ffprobe, "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=codec_name,width,height,pix_fmt,color_transfer,avg_frame_rate,nb_frames:stream_side_data=rotation:format=duration,bit_rate",
        "-of", "json", path))


def image_size(path):
    with Image.open(path) as image:
        width, height = image.size
        orientation = image.getexif().get(274, 1)
        return (height, width) if orientation in (5, 6, 7, 8) else (width, height)


def video_size(data):
    stream = data["streams"][0]
    width, height = stream["width"], stream["height"]
    rotation = next((side.get("rotation", 0) for side in stream.get("side_data_list", []) if "rotation" in side), 0)
    return (height, width) if abs(rotation) % 180 == 90 else (width, height)


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def restore(item, output, ffmpeg, ffprobe, encoder):
    base = item["base"]
    source = (ROOT / item["source"]).resolve()
    if not source.is_relative_to(ROOT / "assets-src/travel"):
        raise ValueError(f"Unexpected original path for {base}")
    old = ROOT / item["current"]
    if item["kind"] == "image":
        # A few camera originals are HEIF containers named .jpg, so identify
        # the file contents rather than assuming the extension is accurate.
        with Image.open(source) as original:
            heic = original.format in ("HEIF", "HEIC")
        extension = ".webp" if heic else source.suffix.lower()
        target = output / f"{base}{extension}"
        if not target.exists():
            if heic:
                with Image.open(source) as original:
                    image = ImageOps.exif_transpose(original)
                    image.save(target, format="WEBP", lossless=True, quality=100,
                        method=4, exact=True, icc_profile=image.info.get("icc_profile"))
                    with Image.open(target) as restored:
                        if image.convert("RGBA").tobytes() != restored.convert("RGBA").tobytes():
                            raise ValueError(f"Lossless pixel verification failed: {base}")
            else:
                shutil.copyfile(source, target)
        width, height = image_size(target)
        identical = not heic and sha256(source) == sha256(target)
        if not heic and not identical:
            raise ValueError(f"Copy verification failed: {base}")
        media = {"src": "/" + target.relative_to(ROOT / "public").as_posix(), "width": width, "height": height}
        audit = {"base": base, "source": item["source"], "method": "lossless HEIC decode" if heic else "byte-identical original", "width": width, "height": height, "originalBytes": source.stat().st_size, "servedBytes": target.stat().st_size, "oldWidth": image_size(old)[0], "oldHeight": image_size(old)[1]}
    else:
        original_data = probe(source, ffprobe)
        original = original_data["streams"][0]
        codec = original["codec_name"]
        hdr = original.get("color_transfer") in ("smpte2084", "arib-std-b67")
        target = output / f"{base}.mp4"
        sources = []
        if codec == "hevc":
            native = output / f"{base}.hevc.mp4"
            if not native.exists():
                temporary = native.with_name(native.stem + ".part.mp4")
                run(ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", source,
                    "-map", "0:v:0", "-map", "0:a:0?", "-c", "copy", "-tag:v", "hvc1", "-movflags", "+faststart", temporary)
                os.replace(temporary, native)
            sources.append({"src": "/" + native.relative_to(ROOT / "public").as_posix(), "type": 'video/mp4; codecs="hvc1"'})
        if not target.exists():
            temporary = target.with_name(target.stem + ".part.mp4")
            command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-threads", "2", "-i", source, "-map", "0:v:0", "-map", "0:a:0?"]
            if codec == "h264":
                command += ["-c", "copy"]
            else:
                if hdr:
                    command += ["-vf", SDR_FILTER]
                if encoder == "h264_nvenc":
                    command += ["-c:v", encoder, "-preset", "p7", "-tune", "hq", "-rc", "constqp", "-qp", "14"]
                else:
                    command += ["-c:v", "libx264", "-preset", "fast", "-crf", "16", "-threads", "2"]
                command += ["-pix_fmt", "yuv420p", "-fps_mode", "passthrough", "-c:a", "copy"]
            command += ["-movflags", "+faststart", temporary]
            run(*command)
            os.replace(temporary, target)
        result = probe(target, ffprobe)
        width, height = video_size(result)
        if (width, height) != video_size(original_data):
            raise ValueError(f"Native dimensions changed unexpectedly: {base}")
        original_frames = original.get("nb_frames")
        restored_frames = result["streams"][0].get("nb_frames")
        if original_frames and restored_frames and original_frames != restored_frames:
            # MOV edit lists may hide coded pre-roll frames. Compare the actual
            # playable frames before calling that a drop in the new export.
            readable = json.loads(run(ffprobe, "-v", "error", "-count_frames", "-select_streams", "v:0",
                "-show_entries", "stream=nb_read_frames", "-of", "json", source))
            playable_frames = readable["streams"][0]["nb_read_frames"]
            if playable_frames != restored_frames:
                raise ValueError(f"Playable frame count changed: {base}: {playable_frames} -> {restored_frames}")
        sources.append({"src": "/" + target.relative_to(ROOT / "public").as_posix(), "type": "video/mp4"})
        poster = output / f"{base}-poster{'-sdr' if hdr else ''}.png"
        if not poster.exists():
            timestamp = min(1, float(result["format"]["duration"]) / 3)
            command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", timestamp, "-i", source]
            if hdr:
                command += ["-vf", SDR_FILTER.replace("format=yuv420p", "format=rgb24")]
            run(*command, "-frames:v", "1", "-update", "1", poster)
        media = {"src": sources[-1]["src"], "sources": sources, "poster": "/" + poster.relative_to(ROOT / "public").as_posix(), "width": width, "height": height, "durationSeconds": float(result["format"]["duration"])}
        old_data = probe(old, ffprobe)
        audit = {"base": base, "source": item["source"], "method": "original H264 stream copy" if codec == "h264" else "untouched HEVC stream + native-resolution H264 fallback", "width": width, "height": height, "fps": result["streams"][0]["avg_frame_rate"], "originalFps": original["avg_frame_rate"], "durationSeconds": media["durationSeconds"], "originalDurationSeconds": float(original_data["format"]["duration"]), "originalBytes": source.stat().st_size, "servedBytes": target.stat().st_size, "oldWidth": video_size(old_data)[0], "oldHeight": video_size(old_data)[1]}
    print(json.dumps({"restored": base, "width": media["width"], "height": media["height"]}), flush=True)
    return base, media, audit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mapping", default="docs/travel-source-map.json")
    parser.add_argument("--ffmpeg", default="C:/ffmpeg/bin/ffmpeg.exe")
    parser.add_argument("--ffprobe", default="C:/ffmpeg/bin/ffprobe.exe")
    parser.add_argument("--encoder", default="h264_nvenc", choices=("h264_nvenc", "libx264"))
    args = parser.parse_args()
    mapping = json.loads((ROOT / args.mapping).read_text(encoding="utf-8-sig"))
    output = ROOT / "public/media/travel/originals"
    output.mkdir(parents=True, exist_ok=True)
    manifest, audit, errors = {}, [], []
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(restore, item, output, args.ffmpeg, args.ffprobe, args.encoder) for item in mapping]
        for future in as_completed(futures):
            try:
                base, media, record = future.result()
                manifest[base] = media
                audit.append(record)
            except Exception as error:
                errors.append(str(error))
                print(f"Restoration error: {error}", file=sys.stderr, flush=True)
    if errors:
        raise RuntimeError("\n".join(errors))
    (ROOT / "src/content/travel-originals.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (ROOT / "docs/travel-media-quality.json").write_text(json.dumps(sorted(audit, key=lambda item: item["base"]), indent=2) + "\n", encoding="utf-8")
    print(f"Restored and verified {len(manifest)} travel assets.", flush=True)


if __name__ == "__main__":
    main()
