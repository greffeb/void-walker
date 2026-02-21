# Phase 9 — Polish, PWA & Launch

> **Status:** PENDING
> **Duration:** 2 weeks
> **Prerequisites:** Phase 8 complete
> **Reference docs:** None beyond this file

---

## Brainstorm Gate

- [ ] Confirm PWA requirements (icons, manifest, service worker strategy)
- [ ] Review Lighthouse audit targets (> 90 on all categories)
- [ ] Decide on beta testing strategy (how many testers, how to collect feedback)
- [ ] Confirm permadeath UX (death screen, save deletion animation, Black Box tease)
- [ ] Review bundle size target (< 500KB initial, < 1MB total)

## Week 1: PWA Optimization & Performance

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | PWA manifest (name, icons, theme color, display: standalone) | `vite.config.ts` (pwa plugin), `public/` | Manual: install prompt appears |
| 2 | Service worker (cache-first for assets, network-first for AI) | `vite.config.ts` (Workbox config) | Manual: works offline |
| 3 | PWA icons (192x192, 512x512, maskable) | `public/icons/` | Manual: icons display |
| 4 | Bundle optimization (code splitting, tree shaking, lazy routes) | `vite.config.ts` | Automated: bundle < 500KB initial |
| 5 | Performance audit (Lighthouse > 90 all categories) | N/A | Manual: Lighthouse report |
| 6 | Touch optimization (tap targets > 48px, no hover-only interactions) | All UI files | Manual: phone testing |
| 7 | Loading state (skeleton UI while engine initializes) | `src/ui/App.tsx` | Manual: no blank screen |
| 8 | Error boundaries (graceful crash recovery) | `src/ui/App.tsx` | Unit: errors caught, recovery offered |

## Week 2: Polish & Beta Testing

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 9 | Permadeath UX (dramatic death screen, save deletion animation) | `src/ui/screens/EndScreen.tsx` | Manual: feels impactful |
| 10 | Black Box tease on death screen ("Your story will be found...") | `src/ui/screens/EndScreen.tsx` | Manual: tease shows |
| 11 | Sound effects (optional, toggle in settings) | `src/ui/hooks/useSound.ts` | Manual: dice roll, alert, ambiance |
| 12 | Haptic feedback (vibration on dice roll, damage, death) | `src/ui/hooks/useHaptic.ts` | Manual: vibration on supported devices |
| 13 | Accessibility pass (screen reader, contrast, font size) | All UI files | Manual: basic WCAG compliance |
| 14 | GitHub Pages deployment pipeline | `.github/workflows/deploy.yml` | Automated: deploys on push to main |
| 15 | Beta testing round 1 (5 testers, 3 days) | N/A | Collect feedback |
| 16 | Bug fixes from beta round 1 | Various | Regression tests added |
| 17 | Beta testing round 2 (10 testers, 3 days) | N/A | Collect feedback |
| 18 | Final bug fixes and polish | Various | All tests pass |
| 19 | Launch checklist verification | N/A | All items checked |

## Acceptance Criteria

```bash
npm run check              # All tests pass
npm run build              # Production build < 500KB initial
```

Manual:
- [ ] Lighthouse > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Installable as PWA on Android and iOS
- [ ] Works fully offline (after first load)
- [ ] 10 beta testers have played full sessions
- [ ] 0 critical bugs remaining

## Launch Checklist

- [ ] All tests pass (`npm run check`)
- [ ] Lighthouse > 90 on all categories
- [ ] PWA installable on Android (Chrome) and iOS (Safari)
- [ ] Offline mode: full game works after first load
- [ ] 3 complete scenarios playable
- [ ] 3 difficulty modes working
- [ ] Save/load functional (3 slots + auto-save)
- [ ] Permadeath working (save deleted on death)
- [ ] Black Box functional (journal generated, placed in future games)
- [ ] AI enhancement working when online, graceful fallback offline
- [ ] French language complete
- [ ] English language: UI complete, narrative templates at 50%+ coverage
- [ ] No known crash bugs
- [ ] GitHub Pages deployment automated
- [ ] Bundle size < 500KB initial load
- [ ] Touch targets > 48px
- [ ] Beta feedback addressed

## Key Design Decisions (Locked In)

- PWA strategy: cache-first for game assets, network-first for AI requests
- Sound effects are OPTIONAL (default off, toggle in settings)
- Haptic feedback on supported devices (non-blocking if unavailable)
- Bundle splitting: engine + content loaded eagerly, AI layer lazy-loaded
- Beta testing: 2 rounds (5 testers -> fix -> 10 testers -> fix)
- Launch platform: GitHub Pages (free, reliable)

## Definition of Done

- [ ] Game is live at GitHub Pages URL
- [ ] 10+ people have played full sessions
- [ ] 0 critical bugs
- [ ] Lighthouse > 90
- [ ] CLAUDE.md reflects production state
- [ ] VOID WALKER IS LAUNCHED
