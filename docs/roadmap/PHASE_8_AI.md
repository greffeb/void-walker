# Phase 8 — AI Enhancement Layer

> **Statut :** NON DÉMARRÉ — `src/ai/` n'existe pas encore.
>
> **Où on en est :** [`docs/STATUS.md`](../STATUS.md) est la source unique de vérité.

> **Status:** PENDING
> **Duration:** 1 week
> **Prerequisites:** Phase 7 complete
> **Reference docs:** None beyond this file

---

## Brainstorm Gate

- [ ] Confirm Gemini Flash free tier limits (requests/day, tokens/request)
- [ ] Confirm Cloudflare Worker free tier (100K requests/day)
- [ ] Review prompt design for narrative enhancement
- [ ] Decide on fallback behavior when AI is unavailable or slow
- [ ] Confirm AI timeout (5000ms from BALANCE constants)

## Deliverables

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Cloudflare Worker proxy (hides API key, CORS, rate limiting) | `worker/src/index.ts`, `worker/wrangler.toml` | Manual: proxy responds |
| 2 | Rate limiter (10 requests/minute per IP) | `worker/src/index.ts` | Unit: rejects after limit |
| 3 | Gemini Flash client (request, parse, timeout handling) | `src/ai/client.ts` | Unit: handles success, timeout, error |
| 4 | AI narrator (enhances template narrative with AI prose) | `src/ai/narrator.ts` | Unit: produces valid narrative text |
| 5 | AI prompt design (context injection: action, outcome, setting, tension) | `src/ai/narrator.ts` | Unit: prompt includes all context dimensions |
| 6 | Graceful fallback (AI unavailable -> template narrative unchanged) | `src/ai/narrator.ts` | Unit: fallback returns template output |
| 7 | AI suggestion enhancer (optionally generates creative 4th suggestion) | `src/ai/suggestions.ts` | Unit: produces valid suggestion or null |
| 8 | AI availability detection (online check, free tier quota tracking) | `src/ai/client.ts` | Unit: correctly detects offline |
| 9 | UI integration: AI indicator (shows when AI is active vs template) | `src/ui/components/NarrativePanel.tsx` | Manual: indicator visible |
| 10 | AI toggle in settings (user can disable AI enhancement) | `src/ui/components/SettingsModal.tsx` | Manual: toggle works |
| 11 | Performance guard (AI response > 5s -> cancel, use template) | `src/ai/client.ts` | Unit: timeout triggers fallback |

## Acceptance Criteria

```bash
npm test                    # All unit tests pass (AI mocked)
npm run build              # Build includes AI layer
```

Manual testing:
- [ ] Play with AI enabled (online) -- narrative is enhanced
- [ ] Play with AI disabled -- template narrative works perfectly
- [ ] Play offline -- graceful fallback, no errors
- [ ] AI response > 5s -- falls back to template automatically
- [ ] Rate limit hit -- falls back gracefully

## Key Design Decisions (Locked In)

- AI NEVER controls game logic -- only enhances prose
- Template narration is the baseline; AI is a polish layer on top
- AI timeout: 5000ms (BALANCE.AI_TIMEOUT_MS)
- Max AI requests per session: 100 (BALANCE.AI_MAX_REQUESTS_PER_SESSION)
- Cloudflare Worker is the only thing with the API key (never client-side)
- Rate limit: 10 requests/minute per IP
- Game is 100% playable and enjoyable without AI (Sacred Rule #7: offline first)
- AI prompt includes: action performed, outcome, setting, tension level, player condition
- AI response is constrained: 2-4 sentences max, same language as display

## Definition of Done

- [ ] Cloudflare Worker deployed, proxying to Gemini Flash
- [ ] AI narrator enhances narrative when available
- [ ] Fallback works seamlessly (user can't tell AI failed)
- [ ] No API key exposed to client
- [ ] AI toggle in settings
- [ ] Performance: AI never blocks game flow (async with timeout)
- [ ] CLAUDE.md updated for Phase 9
