# Design system

## Vibe

Retro compact. Terminal mental model. Information density wins over
decorative space. Looks like a tool, not a brochure.

## Tokens

- **Background**: dark by default (`hsl(220 16% 8%)`). Light mode is a
  warm off-white. Both keep saturation low so the single accent reads.
- **Accent**: terracotta (`hsl(14 70% 55%)`). One CTA colour, period —
  Von Restorff isolation does the work.
- **Borders**: 1px hairline using `--border`. Most surfaces are flat;
  borders carry the structure.
- **Radii**: 0–4px. No pill shapes, no soft cards.
- **Type**:
  - Body: Inter 13px / 1.45
  - Headings: JetBrains Mono (the "machine truth" voice)
  - Arabic: IBM Plex Sans Arabic (loaded only when `html[lang="ar"]`)
  - Tabular numerals (`tnum` utility) for prices/counts

## Sizing

- Header: 44px
- Subnav (category strip): 36px
- Default button: 32px (Fitts: comfortable click target)
- Primary CTA: 36px (Fitts: easier still)
- Filter sidebar: 200px on desktop
- Container max: 1280px

## Components

| Primitive | Variants |
| --- | --- |
| Button | default · primary · outline · ghost · muted · danger · link |
| Badge | default · outline · terracotta · sage · gold · danger · ghost |
| Card | header · body · footer (all hairline) |
| Input | bare hairline, mono labels above |
| Skeleton | subtle pulse animation |
| Separator | horizontal · vertical 1px |

## Layout primitives

- `<Header />` — 44px brand · search · nav · cart · account · locale
- `<CategoryStrip />` — horizontal chips, scrolls on mobile
- `<StatStrip />` — one-line shop metadata (replaces the hero)
- `<FilterSidebar />` — URL-driven, no JS required
- `<SortBar />` — default-effect biased toward "best selling"
- `<ProductTable />` — the canonical product surface

## What we deliberately did **not** ship

- Hero image carousel
- Above-fold "why buy from us" tiles
- Newsletter modal
- Promo banner under the header
- Customer testimonial slider
- Trust badge marquee

These are page-real-estate hogs that buyers learn to ignore. The
homepage is the catalogue.
