# Design Brief: Quiet Story
Project type: Interactive data story

## Direction
A calm, spacious data story. Dark theme, sharp corners, layered surfaces lifted by soft shadows. A blue accent leads a wider palette that brings energy to charts, tags and highlights. Serif headings give it an editorial voice. Layouts are asymmetrical and deliberately uneven, like a well-set magazine page.

## Colour tokens
| Token | Value | Use |
|---|---|---|
| background | #16130E | Page background |
| surface | #1D1C19 | Cards, panels |
| surface-raised | #242424 | Menus, dialogs, anything above a card |
| border | #38352E | Dividers, card outlines |
| text | #EFEBE2 | Primary text |
| text-muted | #AEAAA2 | Secondary text, labels |
| accent | #0057E7 | Primary buttons, active states, key data |
| accent-text | #3B7FFF | Links and any text in the accent colour |
| accent-foreground | #FFFFFF | Text and icons on accent |
| success | #4A9B5E | Positive states |
| warning | #B78024 | Cautions |
| danger | #E55F53 | Errors, destructive actions |
Data palette (categorical): #085CEC, #DD996F, #C896D1, #A7B368, #4FBEC5, #DE90AC, #73BE91, #ABA0E5
Sequential: #233350 → #085CEC
Diverging: #8B6400 → #333333 → #085CEC

## Typography
- Headings: DM Serif Display 400 · Body: DM Sans 400, 16px base · Numbers: DM Mono, tabular figures
- Scale: 1.2 (13 / 16 / 19 / 23 / 28 / 33 / 40)
- Line height: 1.6 for body text
- All three families are on Google Fonts

## Spacing, radius, depth
- Spacing: 8, 12, 16, 24, 32, 48, 64, 96
- Radius: 2px (inputs, buttons), 4px (cards)
- No card borders. Cards: `0 1px 2px #00000066, 0 4px 12px #0000004D`. Raised panels: `0 2px 4px #00000066, 0 12px 32px #0000004D`.

## Motion
Quiet. Fades and colour transitions only, 140ms, ease-out. No load animations.

## Layout rules
- 12-column grid, 32px gutters, 1080px max width
- Controls and inputs are 44px tall
- Left-align text
- Offset main content by 2 columns; let images and pull quotes break the grid

## Story rules
- Lead each chart with the finding, not the topic
- Keep reading width constant; let charts break out only when they need to
- Medium content column, about 680px
- Annotate charts with short callouts on the moments that matter
- No scroll effects; sections are static

## Do not
- Use purple-to-blue or rainbow gradients
- Use emoji as icons (use a line icon set such as lucide-react)
- Line up three identical feature cards in a row
- Centre-align everything; left-align by default
- Use glassmorphism or heavy blur
- Put an oversized border radius on everything
- Use generic stock-style hero illustrations
- Put drop shadows on every element
- Use placeholder copy such as "Lorem ipsum" or "Welcome to our platform"
- Add font weights or sizes beyond the type scale
- Set low-contrast grey text on grey backgrounds
- Add decorative animations on load
- Use rainbow chart palettes or a library's default chart colours
- Use full-colour default basemaps that compete with the data

## Before you finish
1. Run the app and screenshot each new or changed screen at 1440px and 390px wide.
2. Check every screen against this brief, especially "Do not".
3. Check text contrast meets WCAG AA.
4. Fix anything that doesn't match, then screenshot again.
