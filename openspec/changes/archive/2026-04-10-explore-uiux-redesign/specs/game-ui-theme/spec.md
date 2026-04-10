## ADDED Requirements

### Requirement: Global design tokens define game visual theme

The application SHALL define a consistent Pixel Art RPG visual theme via CSS custom properties in `index.css` using Tailwind CSS v4 `@theme` syntax. The theme SHALL cover pixel-specific background, panel, border, accent, and text colors exposed as `--pixel-*` variables and mapped to Tailwind utility classes.

#### Scenario: Dark background applied to all pages

- **WHEN** any page renders in the browser
- **THEN** the root background SHALL use `--pixel-bg` (`#0d0d1a`, deep navy black)

#### Scenario: Amber accent applied to primary interactive elements

- **WHEN** a primary PixelButton renders
- **THEN** it SHALL use `--pixel-amber` (`#f4a834`) as its background color

#### Scenario: Pixel font families available globally

- **WHEN** any page renders
- **THEN** `font-heading` SHALL resolve to `'Press Start 2P'` and `font-body` SHALL resolve to `'VT323'`

### Requirement: Pixel UI component library

The shared pixel component library at `components/pixel-ui.tsx` SHALL provide PixelPanel, PixelButton (primary/secondary/danger), PixelInput, PixelBadge, PixelProgressBar, PixelToggle, PixelTabs, PixelDivider, PixelSlider, PixelRadioGroup, and FloatingParticles. All components SHALL use Framer Motion for animations and enforce zero border-radius.

#### Scenario: PixelButton spring animation on interaction

- **WHEN** a PixelButton is hovered
- **THEN** it SHALL lift 2px with `boxShadow: '4px 6px 0 #000'`
- **WHEN** a PixelButton is pressed
- **THEN** it SHALL sink 2px with `boxShadow: '2px 2px 0 #000'`

#### Scenario: PixelProgressBar animates on mount

- **WHEN** a PixelProgressBar renders
- **THEN** its fill width SHALL animate from 0 to the target value over 0.6s

#### Scenario: FloatingParticles render without window dependency

- **WHEN** FloatingParticles renders
- **THEN** it SHALL use CSS viewport units (`vh`) for particle travel distance, not `window.innerHeight`

### Requirement: Each page applies Pixel Art game visual style

The pages AuthPage, MainMenuPage, LobbyPage, LeaderboardPage, SettingsPage, and HelpPage SHALL each render with the Pixel Art RPG visual style. Page layout and functional logic (hooks, handlers, Colyseus state) SHALL remain unchanged.

#### Scenario: Pages have entrance animation

- **WHEN** any main page mounts
- **THEN** the page container SHALL fade and slide in using Framer Motion (`opacity: 0 → 1`, `y: 20 → 0`)

#### Scenario: MainMenuPage shows floating particles and scanline

- **WHEN** the main menu renders
- **THEN** FloatingParticles SHALL be visible in the background and a CSS scanline overlay SHALL be present

#### Scenario: No console errors from theme changes

- **WHEN** any themed page renders in development mode
- **THEN** the browser console SHALL show zero React errors related to missing class names or invalid CSS variable references

### Requirement: v0.dev generated code is validated before integration

For each page redesigned using v0.dev, the generated JSX/TSX SHALL be reviewed for game-content accuracy (class names, key bindings, mechanics descriptions) and verified to correctly bind to existing props, state handlers, and Colyseus room state before being committed.

#### Scenario: Game content accuracy validated

- **WHEN** v0.dev output references game mechanics, class names, or key bindings
- **THEN** these SHALL match actual server-side definitions (ClassDefs.ts, useGameSettings.ts) before integration

#### Scenario: v0.dev output compiles without TypeScript errors

- **WHEN** the TypeScript compiler runs after integration of v0.dev output
- **THEN** zero new TypeScript errors SHALL be introduced by the UI changes
