# Certificate Template Editor V2 Design QA

Reference:
- Admin editor composition: user-provided 1536 x 1024 screenshot.
- Certificate art direction: user-provided 1536 x 1056 finished certificate.

Verified at 1280 x 720:
- Drawer uses the full viewport; content splits into an approximately 67/33 canvas and control layout.
- Preview canvas measures 711 x 503 and preserves the 1754/1240 ratio.
- Five dynamic fields, 8% safety guide, font, size, weight, color, alignment, long-text mode, reset, and save controls are visible.
- Long-text mode, color preset selection, field dragging, and save completion work without console errors.
- Field drag changed normalized visual position while remaining inside the safety area.
- The uploaded background remains the visual asset; dynamic text is layered above it without cropping the canvas.

Reference comparison:
- Matched: large landscape preview, compact right-side configuration, numbered control sections, restrained green system styling.
- Intentionally retained from the existing product: drawer workflow, current Admin navigation, TDesign controls, and existing typography.
- Intentionally excluded: reference-only layout presets, extra decorative controls, and any unlicensed handwriting font.

Remaining manual device check:
- Upload a clean 1754 x 1240 production background without baked-in dynamic text.
- Compare one newly issued certificate in Admin preview, WeApp list, detail, and share surfaces.
