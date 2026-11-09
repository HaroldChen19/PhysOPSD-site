# PhysOPSD project page

A self-contained static site. Open `index.html` directly, or preview with:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. No installation or build step is needed. To use GitHub Pages, publish this directory as the repository root.

## Content

- A 15-second promo in the hero: one comparison, two successive quartets that each play once, then the title and institution logos. The compact 1920 × 800 master preserves the complete source frames.
- 55 paired comparisons, shown six at a time with physical-phenomenon filters. The opening page mixes three human-action examples with object, fluid, and optics examples; the eight promo cases are excluded from this gallery.
- Seven case studies, each with a reference and both physical variants at dense and abstract levels.
- The method overview and author information follow the supplied manuscript. The Paper button opens `assets/PhysOPSD.pdf` (the supplied `PhysOPSD_1106.pdf`); the GitHub link points to `aigc3d/PhysOPSD`.
- A BibTeX section at the end of the page, with a downloadable `assets/physopsd.bib` citation.

## Editing

- `index.html`: copy, author information, links, and section structure.
- `styles.css`: Georgia typography, layout, colors, and responsive breakpoints.
- `media.js`: video titles, prompts, categories, ordering, featured comparisons, and case studies.
- `app.js`: paired playback, pagination, filtering, and case-study controls.
- `assets/`: all videos, posters, and the extracted framework figure.

The hero uses `assets/videos/physopsd-promo.mp4`; its 1920 × 800 master (`PhysOPSD-promo-v3.mp4`) and rendering script are in the adjacent `PhysOPSD-promo` directory. The `promo` entry in `media.js` records its included cases and their individual source clips. These clips remain in `assets/videos` for future promo edits, but are not listed in the comparison gallery. Reorder `comparisons` to change the gallery order. To update the paper, replace `assets/PhysOPSD.pdf` or change the Paper anchor in `index.html` to its public URL. Keep the inline BibTeX and `assets/physopsd.bib` in sync when updating citation metadata.

## Media behavior

Video files load only when their player enters the viewport. Offscreen and background-tab playback pauses; paging or switching examples releases the previous players. Reduced-motion and data-saving preferences disable autoplay. Each comparison supports joint play/pause, seeking, and replay. Case-study clips retain their independent timing because reference durations vary.

Web copies use silent H.264 video, fast-start metadata, and WebP posters. Frame counts, frame rates, and durations are preserved; video widths are capped at 960 pixels without additional cropping. PhyGround clips retain the paired crop already present in the supplied source export.

The case-study drafts are reconstructed demonstrations, and their self-teacher outputs are illustrative context-conditioned generations. They should not be described as original training artifacts or final post-trained outputs.

For cases whose visible scene differs from the supplied prompt, `displayPrompt` provides an edited scene description. The original generation prompt remains unchanged in `prompt` and is accessible through a nested disclosure. This avoids presenting a post-hoc description as the actual model input.

The site is self-contained. The adjacent `PhysOPSD-promo` directory contains the masters, rendering script, and validation record; no original export folders are required.
