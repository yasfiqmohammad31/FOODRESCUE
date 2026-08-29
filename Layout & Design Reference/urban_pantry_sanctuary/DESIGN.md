---
name: Urban Pantry Sanctuary
colors:
  surface: '#fff8f7'
  surface-dim: '#dfd9d8'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f2f1'
  surface-container: '#f3ecec'
  surface-container-high: '#ede7e6'
  surface-container-highest: '#e7e1e0'
  on-surface: '#1d1b1b'
  on-surface-variant: '#554247'
  inverse-surface: '#323030'
  inverse-on-surface: '#f6efef'
  outline: '#887177'
  outline-variant: '#dbc0c6'
  surface-tint: '#a43561'
  primary: '#841a48'
  on-primary: '#ffffff'
  primary-container: '#a33460'
  on-primary-container: '#ffc9d7'
  inverse-primary: '#ffb1c7'
  secondary: '#a43560'
  on-secondary: '#ffffff'
  secondary-container: '#fd7ba8'
  on-secondary-container: '#760c3d'
  tertiary: '#8d0048'
  on-tertiary: '#ffffff'
  tertiary-container: '#b11d60'
  on-tertiary-container: '#ffc9d7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e2'
  primary-fixed-dim: '#ffb1c7'
  on-primary-fixed: '#3e001d'
  on-primary-fixed-variant: '#851b49'
  secondary-fixed: '#ffd9e2'
  secondary-fixed-dim: '#ffb1c7'
  on-secondary-fixed: '#3e001d'
  on-secondary-fixed-variant: '#851b49'
  tertiary-fixed: '#ffd9e2'
  tertiary-fixed-dim: '#ffb1c7'
  on-tertiary-fixed: '#3e001d'
  on-tertiary-fixed-variant: '#8e0049'
  background: '#fff8f7'
  on-background: '#1d1b1b'
  surface-variant: '#e7e1e0'
typography:
  display:
    fontFamily: Geist Sans
    fontSize: 40px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: '1.2'
  title-md:
    fontFamily: Geist Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Geist Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  margin-desktop: 48px
  gutter: 16px
---

## Brand & Style

The design system is built upon the "Urban Pantry Sanctuary" creative north star, a concept that reimagines food rescue as a communal act of warmth rather than a clinical logistics problem. The brand personality is **purposeful, savory, and restorative**. It avoids the sterile aesthetics of traditional tech-first apps, opting instead for a **Tactile-Modern** style that feels grounded in physical space.

The UI evokes an emotional response of "abundant relief"—the feeling of a stocked pantry or a warm kitchen. This is achieved through high-quality photography, generous white space, and a color palette that feels organic and edible. While the underlying architecture is systematic (Geist), the visual layer is softened to appeal to a community-focused Gen Z demographic that values authenticity and sustainability over corporate efficiency.

## Colors

The palette is rooted in an "Earth-to-Table" philosophy. 

- **Forest Emerald (Primary):** Represents growth, freshness, and the core mission of sustainability. Used for primary actions and brand presence.
- **Sunlit Amber (Secondary):** Used for "Mystery Boxes" and discovery features. It adds a glow of optimism and warmth.
- **Terracotta Red (Destructive):** A natural, baked-earth tone used for urgency and critical warnings, avoiding the clinical feel of standard system reds.
- **Sandstone Canvas:** A warm, off-white background that reduces eye strain and provides a soft foundation.
- **Deep Slate:** High-contrast text color that ensures maximum legibility while feeling softer than pure black.

## Typography

This design system utilizes **Geist Sans** across all levels to maintain a clean, technical precision that balances the organic color palette. 

- **Display & Headlines:** Utilize the 900 and 800 weights with tight tracking to create a "poster-like" impact for hero sections and impact metrics.
- **Titles:** The 700 weight provides clear hierarchy for card titles and section headers.
- **Body:** The 400 weight is used for all descriptive text, ensuring high legibility on mobile screens. 
- **Scale:** On mobile devices, headlines scale down to prevent awkward word breaks while maintaining the heavy visual weight that defines the brand.

## Layout & Spacing

The layout follows a **Fluid Grid** model designed primarily for a mobile-first PWA experience. 

- **Mobile (default):** A 4-column system with 16px outer margins and 16px gutters. Most content cards should span the full 4 columns to maximize tap targets.
- **Desktop/Tablet:** A 12-column system centered on the Sandstone Canvas. Content is contained within a max-width of 1200px to maintain the "intimate sanctuary" feel.
- **Rhythm:** An 8px linear scale (with a 4px half-step for tight UI elements) governs all padding and margins. Vertical rhythm is generous to allow the UI to "breathe."

## Elevation & Depth

This design system avoids heavy drop shadows in favor of **Tonal Layers** and **Soft Ambient Occlusion**.

- **Level 0 (Canvas):** The Sandstone Canvas background.
- **Level 1 (Cards):** Pure White surfaces with a very subtle, diffused shadow (0px 4px 20px oklch(0 0 0 / 0.04)).
- **Level 2 (Modals/Overlays):** Elevated surfaces that use a slightly stronger shadow and a 4px Forest Emerald top-border to anchor the element.
- **Interactive Depth:** Buttons use a subtle "pressed" state where they shift 1px downward, reinforcing the tactile nature of the "Urban Pantry."

## Shapes

The shape language is "Soft-Geometric." It uses significant rounding to convey friendliness and accessibility, but stops short of being fully "bubbly" to maintain its purposeful mission.

- **Cards:** Use a 14px radius to create a distinct, containerized feel that softens the overall layout.
- **Interactive Elements:** Buttons and form inputs use a slightly tighter radius (10-12px) to feel more precise and "clickable."
- **Icons:** Should be encased in circular or highly rounded containers when used as primary navigational triggers.

## Components

- **Primary Buttons:** High-contrast Forest Emerald background with White text. Height should be exactly 48px for optimal mobile thumb-tap. 12px rounded corners.
- **Mystery Box Chips:** Sunlit Amber background with Deep Slate text. Used to tag items that have variable contents.
- **Rescue Cards:** Pure White background, 14px radius. Use a "Shelf-Life" progress bar in the footer using the Terracotta Red for items expiring within 2 hours.
- **Input Fields:** Sandstone Canvas tint for the fill with a subtle 1px Deep Slate border at 10% opacity. 10px radius.
- **Lists:** Items separated by soft 1px lines (Deep Slate at 5% opacity). No borders on the outer container to maintain a fluid feel.
- **Impact Badges:** Small, circular badges in Forest Emerald that display "CO2 Saved" or "Meals Rescued" to gamify the experience for Gen Z users.