# Progress Log — RRX3 v4.0 Upgrade
📅 2026-02-23

---

## Session: 2026-02-23 (Architect Planning)

### Task: v4.0 Upgrade — Flow + Avatars + AI + Design
- **Status:** planned — waiting for user approval
- **Started:** 2026-02-23

### Files Analyzed
| File | Lines | Purpose |
|------|-------|---------|
| `src/App.tsx` | 321 | Flow logic — 5 entry points, 10 screens |
| `src/services/ai-engine.ts` | 342 | AI engine — Gemini text + image gen |
| `src/data/prompts.ts` | 224 | System prompt + buildAIPrompt |
| `src/types.ts` | 126 | TypeScript interfaces |
| `src/components/LoginScreen.tsx` | 186 | Login — create/join/invite |
| `src/components/ConnectScreen.tsx` | 254 | Connect — code/link tabs |
| `src/components/InvitationScreen.tsx` | 178 | Simple invite landing |
| `src/components/InvitationComposerScreen.tsx` | 644 | Letter composer + receiver |
| `src/components/WaitingScreen.tsx` | 390 | Countdown + prep tips + calendar |
| `src/components/BreathSyncScreen.tsx` | 414 | 48s synced breathing |
| `src/components/GenderSelection.tsx` | 112 | Gender picker (to be removed) |
| `src/components/ProtocolScreen.tsx` | 300+ | Main protocol screen |

### Findings
1. **5 distinct entry flows** — all mapped in findings.md
2. **Gemini image gen unreliable** — FAL.ai (Flux) recommended
3. **Prompts missing: secrets, accent, context summary, FIRE details**
4. **No ScenarioIntro screen** — users jump into chat without knowing characters
5. **GENDER_SELECTION unnecessary** — can auto-detect from host/joiner role

### Plan Created
- `findings.md` — full analysis with risk matrix
- `task_plan.md` — 5 phases, prioritized:
  1. Flow (auto-gender + ScenarioIntro)
  2. Avatars (FAL.ai Flux)
  3. AI Prompts (secrets + accent + FIRE)
  4. Design (ScenarioIntro UI + progress ring + avatar glow)
  5. Build & Deploy

### Key Decisions
- Host = MAN (auto), Joiner = WOMAN (auto)
- FAL.ai Flux-schnell for avatars (2-4s, ~$0.05)
- Secrets visible to partner (not to self)
- ScenarioIntro screen between BreathSync and Protocol

---

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Planning complete, waiting for approval |
| Where am I going? | Phase 1 (Flow) → Phase 2 (Avatars) → Phase 3 (Prompts) → Phase 4 (UI) → Phase 5 (Deploy) |
| What's the goal? | v4.0 upgrade: better flow, AI avatars, richer AI chat, improved design |
| What have I learned? | 5 entry flows exist, Gemini image gen unreliable, FAL.ai available, prompts missing secrets/accent |
| What have I done? | Read all 12 source files, created findings + task_plan + progress |

---
*Update after completing each phase or encountering errors*
