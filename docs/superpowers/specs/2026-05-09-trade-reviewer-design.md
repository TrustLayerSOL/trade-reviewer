# Trade Reviewer Design

## Goal

Build a local read-only Solana meme coin trade reviewer for wallet `GvLED9AJquasBJ9Jb4zFsrpkib8pkRBHdeUK7hTtMhGj`. The app should summarize completed trades and explain what went right, what went wrong, and what to improve next time in plain language.

## Scope

The first version is a browser app that runs locally. It does not connect to wallets for signing, does not place trades, and does not request private keys or seed phrases.

The app supports three inputs:

- Helius parsed wallet history using a user-provided API key.
- CSV import for exported trades.
- Built-in sample trades so the reviewer can be tested immediately.

## Architecture

Use Vite, React, TypeScript, npm, and Vitest to match nearby Jordan projects. Keep trade analysis in pure TypeScript modules so it is easy to test without the UI.

Core units:

- `src/domain/trades.ts`: shared trade and review types.
- `src/domain/reviewRules.ts`: deterministic scoring and plain-English feedback.
- `src/domain/heliusMapper.ts`: maps parsed Helius transactions into normalized trade events.
- `src/domain/tradeMatcher.ts`: groups buys and sells into completed trades.
- `src/services/helius.ts`: read-only API client for wallet transactions.
- `src/components/*`: focused UI sections for settings, import, metrics, trade table, and review details.

## Review Logic

Each completed trade receives:

- Outcome label: win, loss, breakeven, or open.
- Numeric performance: invested SOL, returned SOL, fees, PnL, and PnL percent.
- Right moves: examples include taking profit, cutting a loser quickly, avoiding oversizing, and having a clear entry reason.
- Wrong moves: examples include late exit, oversized position, high fee drag, holding through a major drawdown, and missing exit reason.
- Next action: one short recommendation.

The logic is deterministic so tests can lock expected behavior.

## Data Handling

The Helius API key is stored only in browser local storage. The app will show that API keys are optional and read-only. CSV and fetched data remain in browser memory unless the user exports a JSON review.

## Error Handling

Show clear messages for missing API key, invalid wallet, API rate limits, empty history, and malformed CSV rows. The app should keep the current review visible if a refresh fails.

## Testing

Use Vitest for domain logic:

- Review rules label wins and losses correctly.
- Review feedback names risk issues clearly.
- Helius transaction mapping extracts buys and sells for wallet-owned token transfers.
- Trade matcher pairs buys and sells by token mint.

Use a production build as the final compile check.
