# Portfolio Visualizer — Project Context

## Goal
Allow users to enter stock ticker symbols, fetch their most recent price via the Alpha Vantage API, and display a FinViz-style treemap (https://finviz.com/map.ashx?t=sec_all) showing portfolio allocation colored by gain/loss.

---

## Stack
- **React 19 + TypeScript** (strict mode)
- **Vite 6** — build tool
- **Material-UI (MUI) 6** — components and theming
- **Recharts 2** — treemap visualization
- **Axios** — HTTP client
- **Emotion** — CSS-in-JS

---

## Project Structure

```
src/
├── App.tsx                    # Main layout + state (positions, loading, auto-update)
├── components/
│   ├── StockForm.tsx          # Add position form (ticker, shares, purchase price)
│   ├── StockList.tsx          # Table of positions with gain/loss coloring
│   ├── PortfolioChart.tsx     # Recharts Treemap visualization
│   └── ThemeSwitch.tsx        # Dark/light toggle (fixed top-right)
├── context/
│   └── ThemeContext.tsx       # Theme state in localStorage, default dark
├── services/
│   └── stockService.ts        # Alpha Vantage API, ApiQueue (15s between calls)
├── types/
│   └── stock.ts               # StockPosition, DailyStockData, StockFormData
└── utils/
    └── colorScale.ts          # Color interpolation for gain/loss %
```

---

## API Constraints — CRITICAL
- **Alpha Vantage free tier: 5 requests per hour** (not per minute)
- API key stored in `.env` as `VITE_ALPHA_VANTAGE_API_KEY`
- `stockService.ts` uses an `ApiQueue` with 15s delays between calls — this needs to be adjusted to respect the hourly limit
- Endpoint used: `GLOBAL_QUOTE` for current price
- `TIME_SERIES_DAILY` is implemented but unused

---

## Current State (What's Built)

- Stock position management (add/remove)
- Alpha Vantage price fetching with queue
- Gain/loss calculations
- Recharts Treemap (basic — needs FinViz-style improvements)
- Dark/light theme with localStorage persistence
- Color-coded gain/loss (green/red) in table and chart
- Loading states
- MUI table for positions

---

## What Needs to Be Built / Fixed

### High Priority
1. **FinViz-style treemap** — blocks sized by portfolio value, colored by gain/loss %, ticker labels always visible inside blocks, no legend needed
2. **Rate limiting fix** — current queue uses 15s delay (assumes 5/min); must respect 5/hour free limit with proper user feedback
3. **User error messages** — currently only logs to console; show errors in UI
4. **Duplicate ticker detection** — currently allows adding same ticker twice
5. **Portfolio summary row** — total value, overall gain/loss
6. **Data persistence** — save positions to localStorage between sessions

### Medium Priority
7. **Empty state UI** — message when no positions added
8. **Stock symbol validation** — before making API call
9. **Loading indicator** — per-position loading state during fetch
10. **Remove duplicate `.env`** in `src/components/` (untracked file, security risk)

### Low Priority
11. **Memoization** — prevent unnecessary chart re-renders
12. **Chart allocation %** — show % of total portfolio per block

---

## Key Design Decisions
- MUI theme: dark default (`#121212` bg, `#1e1e1e` paper), light mode (`#f5f5f5` bg)
- Color scale caps at ±10% gain/loss for max color intensity
- Two-column layout: form+table left, chart right (stacks on mobile)
- Theme persisted in localStorage key (ThemeContext)
- Positions NOT currently persisted (lost on refresh)

---

## Security Notes
- `.env` is gitignored but API key is embedded in client-side JS bundle (unavoidable for Vite frontend)
- Do NOT commit `.env` files
- Remove `src/components/.env` (duplicate untracked file)
