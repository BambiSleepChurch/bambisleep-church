# CSS Architecture

Modular CSS structure for the BambiSleep™ MCP Control Tower dashboard.

## Structure

```
css/
├── main.css              # Entry point - imports all modules
├── base.css              # Resets, typography, global elements
├── layout.css            # Header, footer, containers, sections
├── utilities.css         # Utility classes, animations, scrollbar
├── responsive.css        # Media queries for all breakpoints
└── components/           # Individual UI components
    ├── glass-card.css    # Glass morphism cards
    ├── buttons.css       # Button variants
    ├── server-card.css   # Server display cards
    ├── stats.css         # Stats bar & status badges
    ├── modal.css         # Modal dialogs & server details
    ├── toast.css         # Toast notifications
    ├── search.css        # Search bar & filters
    └── websocket.css     # WebSocket status indicator
```

## Design System

All modules use CSS custom properties from `variables.css`:

- **Colors**: `--primary-color`, `--secondary-color`, `--tertiary-color`
- **Spacing**: `--space-{1-12}` (4px increments)
- **Typography**: `--text-{xs,sm,base,lg,xl}`, `--font-{light,normal,semibold,bold}`
- **Effects**: `--blur-{sm,md,lg}`, `--glow-{cyan,pink,purple}`
- **Z-Index**: `--z-{base,dropdown,sticky,modal,toast}`

## Layer System

Uses CSS `@layer` for proper cascade ordering:

1. `@layer base` - Resets & base elements
2. `@layer components` - Component styles
3. Utilities (unlayered) - Highest specificity

## Component Philosophy

Each component file is:

- **Self-contained**: All styles for one component
- **BEM-inspired**: `.component`, `.component-element`, `.component--modifier`
- **Composable**: Uses design tokens for consistency

## Usage

### Import in HTML

```html
<link rel="stylesheet" href="css/main.css">
```

### Import in CSS

```css
@import url('components/modal.css');
```

## Responsive Breakpoints

- **Desktop**: Default (1400px max-width)
- **Tablet**: ≤768px
- **Mobile**: ≤480px
- **Large Desktop**: ≥1600px

## Adding New Components

1. Create `components/{name}.css`
2. Add styles with `.{component}` class prefix
3. Import in `main.css`
4. Document key classes here

## Best Practices

- Use CSS custom properties (variables) over hardcoded values
- Scope animations with `@keyframes` in component file
- Keep specificity low (avoid nesting > 3 levels)
- Mobile-first for new responsive rules
- Test in Chrome, Firefox, Safari
