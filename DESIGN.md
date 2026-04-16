# DESIGN.md

Design identity and principles for the Lasid Storefront.

---

## The Story Behind the Name

Lasid is named after Rashid — a childhood nickname given by his brother, who built this store for him. The name is personal, warm, and human. It is not a brand invented in a boardroom. That origin is the entire design philosophy.

Every design decision should ask: *does this feel like it was made by a person who cares, or by a company trying to look impressive?*

---

## Brand Identity

**What Lasid is:**
An everyday Ghanaian store. Affordable fashion, lifestyle, books, and general goods for the general public — not a niche premium brand, not a cold global marketplace. The kind of shop you go back to because you trust it, not because it has the best homepage.

**What Lasid is not:**
Luxury. Aspirational. Corporate. It does not compete on prestige. It competes on trust, familiarity, and ease.

**The one feeling a visitor should leave with:**
*Relief.* The feeling of walking into a familiar shop and finding what you need at a fair price, without friction or intimidation. Like bumping into someone you know who can help you.

---

## Voice and Tone

The brand speaks like a person, not a platform.

| Do | Don't |
|---|---|
| "Good prices, every day." | "Discover our curated collection." |
| "Find what you need." | "Elevate your lifestyle." |
| "Fast delivery across Ghana." | "Seamless last-mile fulfilment." |
| Short, direct, honest sentences. | Marketing language, superlatives, buzzwords. |

Copy should be minimal. Let the products speak. When the brand does speak, it sounds like someone you'd stop and talk to at the market — confident, direct, warm.

---

## Color Palette

The palette is sun-warmed and earthy. It should feel like a bright, well-lit shop — inviting without being loud.

| Role | Value | Usage |
|---|---|---|
| Background | `#FAF7F2` — warm cream | Page backgrounds, card fills |
| Foreground | `#1C1410` — deep warm brown | Body text, headings |
| Primary accent | `#D4521A` — burnt terracotta | CTAs, active states, badges, links |
| Secondary accent | `#F5A623` — warm amber | Highlights, sale tags, hover accents |
| Muted | `#EDE8E0` — warm stone | Muted backgrounds, dividers |
| Muted text | `#7A6E65` — warm mid-grey | Secondary labels, metadata |
| Success | `#3D7A5C` — earthy green | Confirmation states, in-stock badges |

**Rules:**
- Never use pure white (`#FFFFFF`) or pure black (`#000000`) — always reach for the warm equivalents.
- The terracotta is the primary action color. Amber supports it; it is not a peer.
- Dark sections (hero, CTA banners) use `#1C1410` — the same deep warm brown as body text, not a cold near-black.
- Avoid cool greys, cool blues, or anything that reads as clinical.

---

## Typography

Typography carries the personality of the brand. The choices here are deliberate.

### Headings — Lora (serif)
A humanist serif with warmth and character. It has the weight to command attention but the curves to feel approachable — not stiff like a law firm, not playful like a children's brand. Exactly the balance between trustworthy and human.

Use for: page headings, section titles, product names in hero contexts, the wordmark.

### Body — DM Sans
A low-contrast geometric sans with slightly rounded terminals. Feels clean, modern, and easy to read at small sizes without feeling cold or corporate. A step warmer than Inter.

Use for: body copy, labels, metadata, form fields, navigation.

### Scale and Weight
- Display headings: `font-heading`, bold (700), tight leading (~1.05)
- Section headings: `font-heading`, semibold (600), snug leading (~1.15)
- Body: `font-sans`, regular (400), relaxed leading (~1.6)
- Labels and metadata: `font-sans`, medium (500), wide tracking

### Rules
- Never use Roboto Slab — too editorial and stiff for this brand.
- Never use Inter — too generic and cold.
- Avoid all-caps for anything longer than 4 words.
- Overlines (small uppercase labels above section headings) are acceptable and add rhythm — but use sparingly.

---

## Layout and Space

**The organizing principle is *organized ease*.**

Think of a well-run market stall — everything has a place, nothing is crammed, you can find things without effort. Not a sterile grid, not visual chaos.

- Generous padding. White (cream) space is not wasted — it is what creates the feeling of ease.
- Consistent grid: `max-w-7xl` container, `px-4 sm:px-6 lg:px-8` gutters throughout.
- Cards use `rounded-xl` (slightly generous radius) — warm and approachable, not overly bubbly.
- Sections breathe: `py-16` minimum vertical rhythm between sections.
- No full-viewport dark hero sections — they signal luxury and intimidation. The hero should feel welcoming.

---

## Imagery and Icons

**Photography (when used):**
- Bright, natural light. Warm tones. Real people, real settings.
- No studio-white backgrounds — that reads as premium e-commerce.
- Ghanaian contexts are a strength, not a constraint. Embrace them.

**Illustration / placeholders:**
- Product image placeholders use a warm muted background (`bg-muted`) — never a cold grey.
- No placeholder gradients or abstract shapes that distract from the product.

**Icons:**
- Outline style, 1.5px stroke weight (Heroicons or equivalent).
- Never filled icons for UI chrome — they read as heavy and dated.
- Icon size in body contexts: 20px (`h-5 w-5`). In display contexts: 24px (`h-6 w-6`).

---

## Components and Interaction

**Buttons:**
- Primary: terracotta fill (`bg-[#D4521A]`), white text, `rounded-lg`, `px-6 py-3`.
- Secondary / outline: `border-border`, foreground text, same radius.
- Ghost: no border, muted text — for low-priority actions only.
- No sharp corners. No pill-shaped buttons (too playful). No gradient fills.
- Loading states use a spinner in the button, not a separate overlay.

**Cards:**
- White/cream fill, `border-border`, `rounded-xl`, subtle shadow on hover.
- No heavy box shadows at rest — the card should sit in the page, not float above it.

**Forms:**
- Labels always visible above inputs — no placeholder-only labels.
- Errors inline, below the field, in terracotta (`text-destructive`).
- Generous input height (`py-2.5`) — easier to tap on mobile.

**Transitions:**
- `duration-150` to `duration-200` — fast and responsive, not sluggish.
- Hover: subtle translate (`-translate-y-0.5`) or shadow lift on cards.
- No dramatic animations on functional UI. Reserve motion for delight moments (empty states, success confirmations).

---

## Things to Always Avoid

- Luxury signals: dark editorial heroes, gold-foil effects, "curated collection" language.
- Generic AI aesthetics: purple gradients, Inter font, cold greys, cookie-cutter layouts.
- Over-designed empty states or loaders — keep them simple and warm.
- Aggressive upsell patterns: popups, countdown timers, fake urgency.
- Anything that makes the user feel watched, pressured, or confused.

---

## The Test

Before shipping any design, ask:

1. Does this feel like a shop run by a person who cares, or a faceless platform?
2. Would an everyday Ghanaian feel welcome here, or slightly intimidated?
3. Is this copy honest and direct, or is it trying to sound impressive?
4. Does the palette feel warm and familiar, or clinical and premium?

If the answers point toward *person, welcome, honest, warm* — ship it.
