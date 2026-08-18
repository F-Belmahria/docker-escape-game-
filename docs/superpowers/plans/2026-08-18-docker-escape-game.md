# Docker Escape Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un escape game Docker statique complet, hébergeable en ligne, avec 5 missions, chrono, indices, score et énigme finale.

**Architecture:** La logique métier pure est séparée du rendu DOM afin d'être testable avec Node sans navigateur. L'état de session est persisté via localStorage et chaque mission expose un validateur indépendant.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-18-docker-escape-game-design.md`

## Global Constraints
- Pas de framework ni de dépendance externe.
- Une équipe par navigateur, progression locale.
- 30 minutes, 3 jetons d'aide.
- 5 mots gagnés : IMAGE, PORT, RESEAU, VOLUME, LOGS.
- Réponse finale : CONTENEUR.

---

### Task 1: Core game rules
**Files:** Create `game-core.js`, `missions.js`; Test `tests/game-core.test.mjs`.
**Produces:** `createInitialState`, `useHint`, `completeMission`, `calculateScore`, `normalizeAnswer`, validators M1-M5.
- [ ] Write failing unit tests for initial state, hint token consumption, mission progression, score, and mission validators.
- [ ] Run `node --test` and confirm failure due to missing modules.
- [ ] Implement minimal pure logic.
- [ ] Run `node --test` and confirm all tests pass.

### Task 2: Page shell and responsive design
**Files:** Create `index.html`, `styles.css`.
**Produces:** Screens for start/game/final, mission panel, progress, timer, hint modal, terminal and draggable cards.
- [ ] Add semantic HTML structure.
- [ ] Add responsive dark control-room styling and accessible focus states.
- [ ] Validate static file references.

### Task 3: Mission interactions and persistence
**Files:** Create `app.js`.
**Consumes:** core state and mission validators.
**Produces:** start/restart, timer, mission rendering, drag/click interactions, UV hints, terminal simulation, localStorage persistence.
- [ ] Implement start and resume flow.
- [ ] Implement missions 1-5 interactions.
- [ ] Implement hint-token and UV overlay behavior.
- [ ] Implement final riddle and result screen.
- [ ] Verify `node --test` still passes.

### Task 4: Hosting documentation and verification
**Files:** Create `README.md`, `package.json`.
- [ ] Document local use and static hosting upload steps.
- [ ] Add `npm test` script using Node's built-in runner.
- [ ] Run tests.
- [ ] Run a local static server and curl the page/assets.
- [ ] Package project as ZIP.
