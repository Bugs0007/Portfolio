# Travel media and presentation

The travel section uses a continuous Filmstrip showing the selected trip only.
It moves at 50 pixels per second, about 47% faster than the earlier version,
and keeps moving when the pointer hovers over it. Explicit pause, frame
navigation, keyboard focus, reduced-motion preferences, offscreen suspension
and hidden-tab suspension remain available. All visible inline videos play
together, including partially visible edge cards; playback does not depend on
which card is nearest the center. Opening a full-frame viewer suspends inline playback.

The site uses the original Neon color palette and the Filmstrip travel layout.
The experimental palette and layout choosers have been removed, along with
their saved-preference code. Photographs and video frames are never tinted or
filtered.

## Native media restoration

The old travel files were resized/recompressed exports. The restored media lives
in `public/media/travel/originals/`; raw camera files remain untouched under
the ignored `assets-src/travel/` directory.

- Existing JPEG and PNG photographs are byte-for-byte copies of the originals.
- HEIC photos, including a HEIF file named `.jpg`, are decoded at native size
  into lossless WebP with their color profile. Pixel equality is checked after
  saving. No photograph is resized or upscaled.
- Original H.264 clips are remuxed without video recompression.
- HEVC clips have an untouched HEVC/HDR video stream for capable browsers and
  a native-resolution H.264 fallback. The fallback uses high-quality encoding
  without a bitrate ceiling or frame-rate cap. HLG/PQ footage is tone-mapped to
  SDR for that fallback and for its full-resolution still poster.
- Dimensions and playable frame counts are verified. MOV edit lists may exclude
  coded pre-roll frames, so an apparent count mismatch is checked against actual
  decoded frames rather than treated as a dropped frame.
- Videos retain their full original duration. No additional crop, stabilization,
  sharpening, frame interpolation or AI upscaling is applied.

`src/content/travel-originals.json` binds the verified files to the curated trip
catalog. `travel-media-quality.json` records original and previous dimensions,
frame rates, duration, file sizes and conversion methods. Some supplied files
were already low-resolution; these retain their actual native detail.

To reproduce, provide the archived originals listed in `travel-source-map.json`,
install Pillow and pillow-heif in a Python environment, and run:

```text
python scripts/restore-travel-originals.py --encoder h264_nvenc
```

FFmpeg and FFprobe paths can be supplied with `--ffmpeg` and `--ffprobe`.
Use `--encoder libx264` if NVIDIA hardware encoding is unavailable. Existing
completed outputs are reused. The original files are never overwritten.
