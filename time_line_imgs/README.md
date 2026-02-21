# Timeline Images

Images in this folder can be used in the **Our Journey** timeline page.

## Adding images to the timeline

1. **Convert HEIC to JPG** (browsers don't support HEIC):
   - On Mac: Open in Preview → File → Export → Format: JPEG
   - Or use an online converter

2. **Place JPG/PNG files** in the appropriate subfolder (e.g. `1:19:26 MLK Service Day - Philabag & Agape/`)

3. **Update `timeline.html`** – change the `src` of the relevant `<img>` to point to your new image:
   ```html
   <img src="time_line_imgs/1:19:26 MLK Service Day - Philabag & Agape/IMG_5574.jpg" alt="...">
   ```
   (Use the actual filename after conversion)

## Current structure

- `1:17:26/` – Community Circle event
- `1:19:26 MLK Service Day - Philabag & Agape/` – MLK Service Day with Agape
