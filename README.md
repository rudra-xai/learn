# Rudra-X AI — Learning portal

The **AI Practice Assurance** training portal: video lectures, slides and the course handbook for law firms using AI. Live at **https://rudra-xai.github.io/learn/**.

It is a static site on GitHub Pages. There are **no logins yet** — anyone with the link can view it. Pages carry `noindex` so search engines don't list it.

## What viewers can and can't do

| Material | How it's shown | Downloadable? |
|---|---|---|
| Video lectures (Modules 1–10, 8A, 8B) | Streamed in 6-second chunks, captions on, no download button | No single video file exists on the site |
| Slide decks | Watermarked slide images in a viewer | No — the PPTX is never published |
| Course Handbook | Watermarked page images | No — the PDF is never published |
| Desk Reference | PDF | **Yes**, the only download |

Right-click, drag, select/copy, Ctrl+S / Ctrl+P / Ctrl+U and printing are blocked on course material.

**Honest limits:** without logins, this deters casual copying but can't stop a determined person (screen recording, or tools that grab streamed video and images). Real protection comes with logins and private, per-viewer media (the server-based `RudraX_Learning_Portal_v1` design: signed-in streaming, per-person watermarks, audit log).

## Insured-only content (off by default)

Module 0 (*Your Rudra-X cover and AI*) and the Insured Edition deck are marked "Policyholders only · Do not distribute", so the public build leaves them out. To include them, rebuild with `-IncludeInsured` (see below). They then appear automatically — but **publicly**, until logins exist.

## Updating course content

Original MP4 / PDF / PPTX files are **not** stored in this repo. They live in the `Education_Training` folder. To update the site after changing them, on a Windows PC with PowerPoint:

```bash
winget install Gyan.FFmpeg.Essentials oschwartz10612.Poppler
```

```bash
powershell -ExecutionPolicy Bypass -File tools\build-media.ps1 -Source "C:\Kalpesh Drive\01. Rudra-x\Documents\01_Products\Education_Training"
```

Then commit and push. The build expects the source file names used today (`Module_01_*.mp4` … `Module_10_*.mp4`, `Module_08A_*`, `Module_08B_*`, `3_Course_Handbook_VIEW_ONLY.pdf`, `4_Desk_Reference_CARRY_ON.pdf`, `RudraX_AI_Practice_Assurance_Market_Edition.pptx`).

If slides are added or removed, update the slide and page ranges for each module in `assets/js/content.js`. The deploy check fails if a range points at a missing image.

## Files

| Path | What it is |
|---|---|
| `index.html` | Module list, role filter, course materials |
| `module.html?m=m01` | One module: video, its slides, its handbook chapter |
| `handbook.html` | Full handbook reader with contents |
| `slides.html?deck=market` | Full deck viewer |
| `assets/js/content.js` | Course catalogue: titles, summaries, tracks, slide/page ranges |
| `assets/js/portal.js` | All page behaviour |
| `assets/js/build.js` | Written by the build script (which optional content exists, counts) |
| `assets/css/portal.css` | Styles (Rudra-X AI brand) |
| `assets/vendor/hls.light.min.js` | hls.js 1.7.3, plays the chunked video |
| `media/` | Generated videos, slides and handbook pages |
| `downloads/` | The desk reference |
| `tools/build-media.ps1` | Converts source files into `media/` |

Progress ("watched") is stored in the viewer's browser only, since there are no accounts yet.

## Automatic deployment

`.github/workflows/deploy.yml` runs on every push to `main`. It checks that required files exist, that no original course files (MP4, PPTX, or any PDF other than the desk reference) slipped in, that every video playlist and catalogue image exists, and that the HTML is valid — then publishes. If a check fails, the live site stays as it was.

To preview locally: `npx http-server . -p 5174` and open http://localhost:5174.
