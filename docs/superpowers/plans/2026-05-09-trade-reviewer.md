# Trade Reviewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local read-only Solana meme coin trade reviewer that summarizes wallet trades and explains right moves, wrong moves, and next actions.

**Architecture:** Vite React TypeScript app with pure tested domain modules for trade matching and review scoring. Helius and CSV inputs normalize into the same trade event shape, then the UI renders metrics and review details.

**Tech Stack:** npm, Vite, React, TypeScript, Vitest, localStorage, browser fetch.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `index.html`, `vite.config.ts`, `tsconfig*.json`: app and test tooling.
- `src/domain/trades.ts`: shared domain types.
- `src/domain/reviewRules.ts`: deterministic trade review logic.
- `src/domain/tradeMatcher.ts`: event-to-trade grouping.
- `src/domain/heliusMapper.ts`: Helius parsed transaction normalization.
- `src/domain/csv.ts`: CSV import parser.
- `src/services/helius.ts`: read-only Helius client.
- `src/data/sampleTrades.ts`: built-in sample data.
- `src/components/*.tsx`: focused React UI components.
- `src/App.tsx`, `src/main.tsx`, `src/styles.css`: app shell and styling.

## Tasks

### Task 1: Tooling and Shell

- [ ] Create npm/Vite/TypeScript config files.
- [ ] Add React app entrypoint and basic stylesheet.
- [ ] Run install, typecheck, and build.
- [ ] Commit scaffold.

### Task 2: Tested Review Engine

- [ ] Write failing Vitest tests for win/loss labels and feedback.
- [ ] Implement `src/domain/trades.ts` and `src/domain/reviewRules.ts`.
- [ ] Run tests until green.
- [ ] Commit review engine.

### Task 3: Tested Trade Matching

- [ ] Write failing tests for matching buys and sells by token mint.
- [ ] Implement `src/domain/tradeMatcher.ts`.
- [ ] Run tests until green.
- [ ] Commit matcher.

### Task 4: Inputs

- [ ] Write failing tests for CSV parsing and Helius mapping.
- [ ] Implement CSV parser and Helius mapper.
- [ ] Add read-only Helius service using `GET /v0/addresses/{address}/transactions`.
- [ ] Run tests until green.
- [ ] Commit inputs.

### Task 5: UI

- [ ] Build settings, import, summary, trade table, and review panels.
- [ ] Wire sample trades, CSV import, and Helius fetch into the same review state.
- [ ] Add empty, loading, and error states.
- [ ] Run tests, typecheck, and build.
- [ ] Commit UI.

### Task 6: Verification

- [ ] Run full test suite.
- [ ] Run TypeScript check.
- [ ] Run production build.
- [ ] Start local dev server and inspect the app.
- [ ] Commit final polish if needed.
