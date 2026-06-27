# SettleVox — Design System & UI Philosophy

## Overview

The web presence for SettleVox is designed to feel like an authoritative, high-end, and modern SaaS tool. Taking inspiration from minimalist and structural layouts (like Supermemory, Vercel, and Linear), the aesthetic is built around **system-matching light & dark modes**, **clean geometric layouts**, and **minimalistic data density**. It avoids the overly friendly, colorful look in favor of a sleek, technical, and structural aesthetic.

What makes the system distinctive is its strict adherence to a monochromatic canvas (black, deep charcoal, white, and light gray) violently interrupted by **SettleVox Blue (`#0562EF`)**. The UI avoids decorative chrome and soft shadows. Instead, structure is defined by 1px hairline borders, stark typography, and generous negative space.

**Key Characteristics:**

- **System Theme Responsive (Default System):** Adapts instantly to system light/dark settings.
- **Structural Frame Lines:** Clean `1px` sidebars and topbars defining the dashboard grid.
- **High-Contrast Typography:** Display headlines using **Space Grotesk Light (300)** against high-legibility body copy using **DM Sans (400/500)**.
- **Sharp Geometry:** Zero border radius. All corners are completely sharp (`0px`), adhering to a strict, rigid structural look. No rounded corners anywhere in the system.
- **Tactile but Flat:** No drop shadows. Depth is achieved purely through surface color changes and border boundaries.

---

## Colors & Themes

SettleVox supports a unified color token system powered by CSS variables that shift seamlessly between Light Theme (Default) and Dark Theme (`.dark`).

### Theme Variables

| Variable          | Light Theme (Default)    | Dark Theme (`.dark`) | Purpose                                        |
| ----------------- | ------------------------ | -------------------- | ---------------------------------------------- |
| `--background`    | `#FFFFFF`                | `#0A0A0A`            | Global background canvas                       |
| `--card`          | `#F9F9F9`                | `#141414`            | Default container/card fill                    |
| `--popover`       | `#F9F9F9`                | `#141414`            | Hover states and toolbars                      |
| `--border`        | `#E4E4E7`                | `#222225`            | Hairline dividers and grid lines               |
| `--foreground`    | `#09090B`                | `#EDEDED`            | Main text and headings                         |
| `--muted`         | `#71717A`                | `#88888B`            | Metadata, badges, and secondary labels         |
| `--primary`       | `#0562EF`                | `#0562EF`            | Brand accent color (Blue)                      |
| `--ring`          | `#0562EF`                | `#0562EF`            | Active borders and focus indicators            |

### Brand & Accent

- **SettleVox Blue** (`#0562EF`): The sole brand color. Used sparingly for primary CTA buttons, active state indicators, and the core logo. It should never be used as a large background fill.
- **Core Black & White**: High contrast base. Backgrounds shift between dark (`#0a0a0a`) and light (`#FFFFFF`) with opposing high-contrast text rendering.

---

## Typography

### Font Family

- **Display & Headings**: `Space Grotesk Light` (300 weight). Clean, geometric display sans-serif for massive impact and elegance.
- **Body & UI**: `DM Sans`. Used heavily for UI labels, body copy, and data density.

### Hierarchy

| Role            | Font          |  Weight | Line Height | Letter Spacing | Notes                                                       |
| --------------- | ------------- | ------: | ----------: | -------------: | ----------------------------------------------------------- |
| Hero Display    | Space Grotesk |     300 |        1.00 |        -0.04em | Very tight tracking. Used for major claims.                 |
| Section Heading | Space Grotesk |     300 |        1.10 |        -0.02em | Used to introduce new grid sections.                        |
| Card Title      | Space Grotesk |     300 |        1.30 |        -0.01em | Metric titles or sections.                                  |
| Body            | DM Sans       | 400/500 |        1.60 |              0 | Standard explanatory text and UI components.                |

---

## Layout & Architecture

### The Grid System

SettleVox uses a highly visible grid system. Sections are not just floating in empty space; they are bounded by full-bleed 1px borders.
- **Bento/Grid Cards:** Data and charts should be displayed in strict grids.
- **Sidebars & Topbars:** Structured by `1px` borders cutting through the viewport.
- **Whitespace:** Density is reserved for data tables. Whitespace is generous around navigation and overview sections.

---

## Elevation & Depth (Flat UI)

SettleVox is **strictly flat**.

- **No Drop Shadows:** Do not use `box-shadow` to indicate elevation.
- **Border-Driven:** A card is defined entirely by a 1px border (`var(--border)`) on the canvas.
- **Hover States:** Hovering on a card does not lift it; it simply changes the surface background.

### Shape & Radius

- **Strictly 0px Border Radius:** No border-radius is allowed anywhere in the system. Every element—buttons, inputs, cards, dialogs, badges, and code boxes—has perfectly sharp, 90-degree corners.
- Pill shapes (`999px` radius) are completely forbidden.

---

## Do's and Don'ts

### Do
- Use theme CSS variables (`--background`, `--card`, `--primary`) to support light/dark modes.
- Use 1px borders generously to structure information.
- Keep all border-radius settings strictly at `0px`.
- Make the SettleVox Blue "pop" by keeping everything else desaturated.
- Rely on Space Grotesk Light for authoritative headings.
- Use Phosphor Icons directly from `@phosphor-icons/react` with the `Icon` suffix (e.g. `UserIcon`, `GearIcon`).

### Don't
- Do not use gradients (except perhaps a subtle radial glow behind hero media if explicitly requested).
- Do not use drop shadows, soft glows, or glassmorphism.
- Do not use any rounded corners or pill-shaped buttons.
- Do not use heavily styled or playful typography.
