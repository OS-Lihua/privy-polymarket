# Design

## Summary

The product uses a restrained trading-workbench visual system. The default theme is low-contrast dark, with a complete light theme available through the same tokens. The UI should read as a product review surface, not a marketing site.

## Color

Colors are token-driven in `app/globals.css`.

- Background: app canvas.
- Surface: raised panels and cards.
- Panel: nested control groups and balances.
- Border: low-contrast boundaries.
- Primary: main actions and selected states.
- Success: positive balances and buy states.
- Danger: destructive actions, sell states, blocking errors.
- Warning: pending setup and caution states.
- Muted: secondary text and supporting labels.

State colors must stay semantic. Do not use green, red, or yellow for decoration.

## Typography

Use Geist Sans for UI text and Geist Mono for addresses, hashes, and compact numeric identifiers. Product headings use restrained fixed sizes, not fluid display scales.

## Components

Core components live under `components/ui` and should be preferred over ad hoc controls:

- `Button`
- `Card`
- `Badge`
- `Tabs`
- `Dialog`
- `Tooltip`
- `Switch`
- `Label`
- `Input`
- `Alert`
- `Skeleton`

Shared domain components may wrap these primitives, but should not redefine control vocabulary.

## Layout

Use a workbench layout: header, status/balance panels, then market/order/position workspace. Keep density moderate so product state remains scannable during demos. Cards and panels use small radii, consistent borders, and no nested decorative card stacks.

## Motion

Motion is limited to hover, focus, loading, and dialog state. Durations should be 150-250ms. Respect `prefers-reduced-motion`.
