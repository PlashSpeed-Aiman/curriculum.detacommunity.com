# Curriculum Style Guide

This document describes the visual language for the Curriculum website. It is intentionally close to the current implementation in `src/style.css`: an editorial study guide with the warmth of paper, the authority of ink, and small moments of color that help a learner orient themselves.

Use this guide before adding a new page or component. Prefer extending the existing system over introducing a new visual treatment for every screen.

## Design Direction

- Editorial, thoughtful, and slightly tactile rather than glossy or dashboard-like.
- Quiet confidence over urgency, gamification, or feed-style engagement.
- Structured like a well-made field guide: clear sequence, useful metadata, generous reading space, and visible relationships between ideas.
- Warm neutral surfaces, dark blue-green type, thin rules, serif display type, and compact uppercase labels.
- Use asymmetry, oversized type, grids, circles, and small diagrams to create character without decorative noise.

## Color

Use the CSS custom properties in `src/style.css`. Do not introduce raw color values in component styles unless the color is a one-off state with a documented reason.

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#f4f0e8` | Main page background |
| `--paper-deep` | `#e8e1d5` | Secondary surface and visual panels |
| `--paper-soft` | `#faf8f3` | Cards, buttons, and lifted surfaces |
| `--ink` | `#162f37` | Primary text, dark panels, and strong actions |
| `--ink-soft` | `#486069` | Supporting text and metadata |
| `--line` | `#c9c8bd` | Default borders, dividers, and grid lines |
| `--line-dark` | `#75848a` | Dashed diagrams and lower-contrast dark surfaces |
| `--coral` | `#e86d58` | Accent, links, active states, and emphasis |
| `--coral-soft` | `#f3c2b5` | Soft subject marker background |
| `--gold` | `#edbd57` | Secondary subject marker and small highlights |
| `--blue` | `#8db8c1` | Cool secondary accent and dark-panel metadata |
| `--white` | `#fffdf8` | Reserved near-white token for future surfaces |

Color behavior:

- Use `--ink` for content that must be immediately readable.
- Use `--coral` for one primary emphasis per region, not for every link or border.
- Use `--gold`, `--blue`, and `--coral-soft` as small accents, especially for subject markers.
- Keep the light paper background as the default. Do not add dark mode until the core light theme is complete and contrast has been checked.
- Never communicate status with color alone. Pair color with text, position, or an icon.

## Typography

The project deliberately uses a system stack and does not load a remote font. Keep the type contrast between literary serif headings and practical sans-serif UI text.

| Use | Font | Treatment |
| --- | --- | --- |
| Display headings | `var(--serif)` | Georgia, Times New Roman, serif; regular weight; tight tracking |
| Body and UI | `var(--sans)` | Inter fallback, system sans; readable line height |
| Emphasis | `var(--serif)` | Italic, usually colored `--coral` |
| Metadata | `var(--sans)` | Bold, uppercase, 0.1em to 0.16em tracking |
| Brand symbol and numbers | `var(--serif)` | Italic or regular, compact, editorial |

Guidelines:

- Use `clamp()` for display headings so they scale between desktop and mobile.
- Keep display headings tight, usually between `0.87` and `1` line height.
- Use short headings with a clear noun or verb. Let the paragraph carry detail.
- Use serif italics for intentional emphasis, not for random decoration.
- Keep body copy around 13px to 17px depending on context, with line height around `1.5` to `1.7`.
- Use uppercase text sparingly for navigation, labels, durations, and section markers.

## Layout

- The outer shell is centered, capped at `1440px`, and framed by 1px vertical borders.
- Desktop content uses `6vw` horizontal insets. At widths below `980px`, use `4vw`.
- The primary desktop hero is a two-column composition: copy and a visual route card. It becomes stacked below `980px`.
- Sections use generous vertical breathing room, generally 86px to 160px depending on viewport and importance.
- Subject cards use a 3-column grid on desktop, 2 columns below `980px`, and 1 column below `680px`.
- Use 1px gaps over a shared border color when a grid should feel like a connected index or table.
- Keep reading content narrower than the full shell. A paragraph should generally stay below 550px.
- Use `minmax(0, 1fr)` in flexible grid columns to prevent long curriculum titles from causing overflow.

Responsive checkpoints:

| Width | Expected behavior |
| --- | --- |
| `1440px` and above | Centered shell with full editorial composition |
| `981px` to `1439px` | Desktop composition with tighter proportional space |
| `681px` to `980px` | Stacked hero, 2-column subject grid, reduced insets |
| `320px` to `680px` | Single-column content, wrapped header, larger touch targets |

Always check at 320px, 390px, 768px, and a desktop width before considering a visual change complete.

## Components

### Header

- Keep the header quiet: brand at the start, a small uppercase navigation group, and one outlined action.
- Use the circular `c/` brand mark consistently.
- Active navigation uses a short coral underline rather than a filled pill.
- On mobile, allow navigation to wrap onto its own full-width row.

### Buttons and Links

- Primary buttons use an ink background with paper text.
- Light buttons use a paper-soft background with ink text, especially on the coral closing section.
- Buttons use uppercase 10px to 12px labels, a visible directional arrow, and enough padding for touch input.
- Text links are understated, uppercase, and use a coral directional arrow.
- Hover movement should be small and purposeful: a button may lift 3px; an arrow may move 4px.

### Subject Cards

- Cards are index entries, not promotional tiles.
- Show the subject number and estimated duration before the title.
- Use a 44px circular marker with a simple plus motif and one of the three accent backgrounds.
- Keep the rationale visible. A learner should understand why a subject matters before opening it.
- The card should have a clear bottom action separated by a 1px rule.
- Hovering may invert the card to `--ink`, but the content must remain readable and the accent must remain visible.

### Subject Directory

- Directory rows use the same index language as cards: number, title, rationale, duration, and one action.
- A row with additional content uses a real `button` with `aria-expanded` and `aria-controls`, not a clickable decorative icon.
- The chevron starts closed, rotates when open, and reveals a concise numbered list of linked modules or tracks below the row.
- Module and track titles are navigation links; the chevron is only responsible for disclosure and must not be the only way to reach the content.
- Keep the revealed list focused on what the learner will gain. Do not put full lesson content in a directory row.
- Only add the disclosure affordance when the subject has real outline data. Rows without detail keep the simple directional arrow.

### Route Card and Diagrams

- Diagrams should explain sequence or relationships, not exist only as decoration.
- Use thin lines, dashed connectors, circles, and labels.
- A dark route card can use `--blue` for metadata and `--gold` for a count or key milestone.
- Mild rotation is acceptable for a single featured card. Do not rotate core reading content or controls.

### Editorial Sections

- Section labels use a numbered eyebrow such as `01 / THE ROUTE`.
- Quotes should be short, centered, serif-led, and attributed.
- The final call to action may use a full-width coral surface, but it should contain one clear action.
- Prefer a small number of strong sections over a long sequence of interchangeable blocks.

### Lesson Reading

- Keep the lesson header separate from the Markdown body. The page owns the single `h1`; authored Markdown should begin at `h2`.
- Keep the reading column around 720px wide with generous line height and vertical rhythm.
- Render code blocks on an `--ink` surface with paper text. Keep inline code on the `--paper-deep` surface.
- Use coral for links and a small number of meaningful callouts, not for large blocks of lesson text.
- Keep breadcrumbs and a back-to-module action visible so a learner can return to the curriculum without relying on browser history.

### Supplementary Study

- Place optional deep dives below the main lesson sequence, not between required lessons.
- Use a dashed divider and an explicit supplementary label so the different commitment level is clear.
- Keep supplementary lessons fully navigable and readable with the same lesson page patterns as core lessons.
- Use supplementary material for experiments, internals, and alternate explanations; do not use it to disguise incomplete required content.

## Interaction and Motion

- Keep transitions between 180ms and 300ms for hover and focus-adjacent movement.
- Animate transform and color, not layout-heavy properties where possible.
- Use `prefers-reduced-motion: reduce` to disable smooth scrolling and reduce transitions.
- Every interactive element needs a visible focus style. The current focus treatment is a 3px coral outline with a 4px offset.
- Do not add auto-rotating carousels, attention-grabbing loops, or progress animations that delay a learner.

## Accessibility

- Use semantic `header`, `nav`, `main`, `section`, `footer`, `h1`, `h2`, and `h3` elements.
- Keep one clear `h1` per page and maintain heading order.
- Use descriptive link text. Avoid bare arrows as the only accessible name.
- Decorative diagrams and markers should be `aria-hidden="true"`; meaningful content must remain in text.
- Check text contrast whenever a new color combination is added, especially text on coral, blue, or dark surfaces.
- Preserve keyboard access after hover styles are added.
- Keep touch targets comfortable on mobile, even when the visual treatment is compact.

## Content Voice

- Clear, direct, and generous. Assume the learner is intelligent but busy.
- Explain why a subject matters, not only what it is called.
- Favor “study,” “understand,” “build,” “practice,” and “continue” over urgency language.
- Avoid empty claims such as “master everything” or “become an expert fast.”
- Keep terminology consistent with the domain model: learning path, module, lesson, activity, learner, and progress.

## Implementation Checklist

Before adding or changing a visual component:

1. Reuse an existing token from `src/style.css`.
2. Check whether an existing component pattern already solves the need.
3. Use semantic HTML before adding ARIA or custom interaction.
4. Test the layout at 320px, 768px, and desktop widths.
5. Test keyboard focus, hover, reduced motion, and contrast.
6. Update this guide when a new foundational token, breakpoint, or visual pattern becomes part of the product.
