# WealthMan Web and Mobile Structure

WealthMan now treats desktop web and mobile as first-class surfaces while sharing the same screens, data models, services, and AI tool layer.

## Shared Core

- `src/screens`: product screens used by both web and mobile
- `src/components`: reusable UI primitives
- `src/services`: deterministic business logic and pricing abstractions
- `src/ai`: Responses API style tool definitions and confirmation flow
- `src/data`: seeded Australian demo data
- `src/types`: TypeScript data model

## Platform Layouts

- `src/layouts/WebAppShell.tsx`: desktop web shell with sidebar navigation, top actions, and command-centre layout
- `src/layouts/MobileTabNavigator.tsx`: mobile bottom tab navigation for Expo Go and native builds
- `src/navigation/mainRoutes.ts`: one route definition shared by web and mobile
- `src/platform/useIsDesktopWeb.ts`: helper for screens that need desktop-specific density

## Routing

Expo Router still owns the route tree in `app`.

- `app/(tabs)/_layout.tsx` chooses the web shell on browser and the mobile tab navigator on phones
- Existing routes and business logic remain unchanged
- Drill-down routes such as property analysis, tax, and bullion detail continue to work from both surfaces

## Local Testing

Run the desktop web app:

```powershell
npm.cmd run web:local
```

Then open the local browser URL Expo prints, usually:

```text
http://localhost:8081
```

Run the mobile app:

```powershell
npm.cmd start
```

Then scan the QR code in Expo Go.

Export a static web build for hosting tests:

```powershell
npm.cmd run web:export
```

The generated static site lands in `dist`.
