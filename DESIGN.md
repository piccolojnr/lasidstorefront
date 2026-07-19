# DESIGN.md

## Design identity and principles for the Backthred Storefront.

## The Story Behind the Name

Backthred is named after Rashid — a childhood nickname given by his brother, who built this store for him.

This is not a brand invented in a boardroom. It is personal, human, and grounded.

Every design decision should answer:

> _Does this feel like something built by someone who cares, or something designed to impress?_

---

## Brand Identity

**What Backthred is:**
An everyday Ghanaian store — practical, reliable, and easy to use. A place people return to because it works, not because it tries to look expensive.

**What Backthred is not:**
Luxury. Flashy. Over-designed. It does not compete on prestige — it competes on clarity, trust, and ease.

**Core feeling:**
_Ease._
Not excitement. Not prestige. Just: “this is simple, I can get what I need.”

---

## Design Direction

Backthred blends **human warmth** with **modern ecommerce clarity**.

- Layouts are **clean, structured, predictable**
- Tone is **warm, direct, human**
- UI is **simple and functional**, not decorative

We are building:

> A clean system with a human soul.

---

## Voice and Tone

The brand speaks like a person, not a platform.

| Do                        | Don't                             |
| ------------------------- | --------------------------------- |
| "Find what you need."     | "Discover curated collections."   |
| "Good prices, every day." | "Premium quality selection."      |
| "Delivered across Ghana." | "Optimized logistics experience." |

**Rules:**

- Short sentences
- No buzzwords
- No exaggeration
- No corporate language

Let the products speak. When the brand speaks, it is direct and honest.

---

## Color System

The interface is neutral-first. Color is used for action and meaning.

---

### Core Palette

| Role           | Value     | Usage            |
| -------------- | --------- | ---------------- |
| Background     | `#FFFFFF` | Page background  |
| Surface        | `#F9FAFB` | Cards, sections  |
| Border         | `#E5E7EB` | Dividers         |
| Text Primary   | `#111827` | Headings         |
| Text Secondary | `#6B7280` | Labels, metadata |

---

### Primary Color (Blue)

```txt
Primary:        #2563EB
Primary Hover:  #1D4ED8
Primary Light:  #DBEAFE
```

Used for:

- Buttons
- Links
- Focus states
- Active elements

**Rule:** Blue is an accent — not the background.

---

### Functional Colors

| Role    | Value     | Usage            |
| ------- | --------- | ---------------- |
| Danger  | `#EF4444` | Discounts, sales |
| Warning | `#F59E0B` | Low stock        |
| Success | `#16A34A` | Confirmations    |

---

### Color Rules

- Do not overuse blue
- Keep UI mostly white and neutral
- Let product images carry visual weight
- Avoid gradients and decorative colors

---

## Typography

Typography balances personality with clarity.

---

### Headings — Lora (serif)

Used for:

- Page headings
- Section titles
- Branding moments

Provides warmth and identity.

---

### Body — DM Sans

Used for:

- Product listings
- UI labels
- Forms
- Navigation

Provides clarity and readability.

---

### Rules

- Do not overuse serif — reserve it for emphasis
- Product-heavy areas use sans-serif
- Avoid all-caps for long text
- Maintain consistent spacing and hierarchy

---

## Layout and Space

The principle is **organized ease**.

---

### Structure

- Container: `max-w-360`
- Padding: `px-4 sm:px-6 lg:px-8`
- Section spacing: `py-12` to `py-16`

---

### Grid

- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1–2 columns

---

### Cards

- `rounded-xl`
- Light border
- Subtle hover shadow

No heavy shadows. No floating UI.

---

## Imagery

### Products

- Clean, consistent backgrounds
- Uniform aspect ratios
- Clear and readable thumbnails

---

### Brand imagery

- Warm, natural lighting
- Real-life Ghanaian context when used
- Avoid overly polished or studio-heavy visuals

---

## Components and Interaction

---

### Buttons

**Primary:**

- Blue background
- White text
- Used for main actions

**Secondary:**

- Outline style
- Neutral colors

**Rules:**

- No gradients
- No oversized rounded pills
- Keep shapes consistent

---

### Product Cards (Critical)

Must include:

- Image
- Name
- Price
- Discount (if applicable)

Optional:

- Rating
- Sales count

Rules:

- Keep minimal
- Avoid clutter
- Prioritize readability

---

### Forms

- Labels always visible
- Errors inline
- Inputs large enough for mobile

---

### Interaction

- Fast transitions (`150–200ms`)
- Subtle hover effects
- No unnecessary animations

---

## Homepage Philosophy

The homepage is not for showing everything.

It is for:

1. Entry (search or browse)
2. Discovery (products)
3. Movement (to product page)

---

### Homepage Sections

- Header (simple, functional)
- Hero (small, not dominant)
- Categories
- Flash Sale
- Recommended Products
- Top Stores
- Trust Section
- Footer

---

## Product Page Philosophy

This is where conversion happens.

Prioritize:

- Price visibility
- Variant selection
- Add to cart

Everything else is secondary.

---

## Mobile Behavior

Mobile is not optional.

- Sticky “Add to Cart” bar
- Swipeable product images
- Collapsible sections
- Large tap targets

---

## Things to Avoid

- Overuse of blue
- Cluttered layouts
- Copy-heavy UI
- Fake urgency patterns
- Decorative UI without function

---

## The Test

Before shipping any design:

1. Is this easy to scan in 3 seconds?
2. Can a user act immediately?
3. Does it feel simple, not empty?
4. Does it still feel human, not corporate?

If the answer is yes — ship it.

---

## Design System Priorities

1. ProductCard (most important component)
2. Buttons and interactions
3. Layout consistency
4. Mobile usability
