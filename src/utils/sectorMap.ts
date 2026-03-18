// Ticker → Sector lookup (common US equities & ETFs)
export const SECTOR_MAP: Record<string, string> = {
  // AI & Technology
  NVDA: 'AI & Tech', MSFT: 'AI & Tech', GOOGL: 'AI & Tech', GOOG: 'AI & Tech',
  META: 'AI & Tech', PLTR: 'AI & Tech', AMD: 'AI & Tech', INTC: 'AI & Tech',
  AAPL: 'AI & Tech', CRM: 'AI & Tech', SNOW: 'AI & Tech', NET: 'AI & Tech',
  DDOG: 'AI & Tech', IBM: 'AI & Tech', SMCI: 'AI & Tech', TSM: 'AI & Tech',
  ASML: 'AI & Tech', MU: 'AI & Tech', AVGO: 'AI & Tech', QCOM: 'AI & Tech',
  TXN: 'AI & Tech', ORCL: 'AI & Tech', SAP: 'AI & Tech', CSCO: 'AI & Tech',
  ADBE: 'AI & Tech', NOW: 'AI & Tech', INTU: 'AI & Tech', AI: 'AI & Tech',
  SHOP: 'AI & Tech', UBER: 'AI & Tech', LYFT: 'AI & Tech',

  // E-Commerce & Consumer Tech
  AMZN: 'E-Commerce', EBAY: 'E-Commerce', ETSY: 'E-Commerce', JD: 'E-Commerce',

  // Finance
  JPM: 'Finance', BAC: 'Finance', GS: 'Finance', MS: 'Finance',
  WFC: 'Finance', C: 'Finance', BLK: 'Finance', COF: 'Finance',
  AXP: 'Finance', V: 'Finance', MA: 'Finance', 'BRK.B': 'Finance',
  'BRK.A': 'Finance', SCHW: 'Finance', PYPL: 'Finance', SQ: 'Finance',
  SPGI: 'Finance', MCO: 'Finance', ICE: 'Finance', CME: 'Finance',

  // Healthcare
  JNJ: 'Healthcare', PFE: 'Healthcare', UNH: 'Healthcare', ABBV: 'Healthcare',
  MRK: 'Healthcare', LLY: 'Healthcare', BMY: 'Healthcare', AMGN: 'Healthcare',
  GILD: 'Healthcare', REGN: 'Healthcare', CVS: 'Healthcare', CI: 'Healthcare',
  ISRG: 'Healthcare', MDT: 'Healthcare', SYK: 'Healthcare', ZBH: 'Healthcare',

  // Energy
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy',
  OXY: 'Energy', BP: 'Energy', SHEL: 'Energy', EOG: 'Energy',
  PSX: 'Energy', VLO: 'Energy', MPC: 'Energy', HAL: 'Energy',

  // Consumer Staples & Retail
  WMT: 'Consumer', COST: 'Consumer', TGT: 'Consumer', HD: 'Consumer',
  MCD: 'Consumer', NKE: 'Consumer', SBUX: 'Consumer', PG: 'Consumer',
  KO: 'Consumer', PEP: 'Consumer', PM: 'Consumer', MO: 'Consumer',
  LOW: 'Consumer', DG: 'Consumer', DLTR: 'Consumer', YUM: 'Consumer',

  // Media & Entertainment
  NFLX: 'Media', DIS: 'Media', CMCSA: 'Media', PARA: 'Media',
  WBD: 'Media', SPOT: 'Media', EA: 'Media', TTWO: 'Media',

  // Telecom
  T: 'Telecom', VZ: 'Telecom', TMUS: 'Telecom',

  // Industrial & Defense
  BA: 'Industrial', CAT: 'Industrial', GE: 'Industrial', HON: 'Industrial',
  MMM: 'Industrial', RTX: 'Industrial', LMT: 'Industrial', NOC: 'Industrial',
  DE: 'Industrial', EMR: 'Industrial', ETN: 'Industrial', GEV: 'Industrial',

  // Real Estate
  AMT: 'Real Estate', PLD: 'Real Estate', EQIX: 'Real Estate', O: 'Real Estate',
  SPG: 'Real Estate', WELL: 'Real Estate', DLR: 'Real Estate',

  // Index & ETF
  SPY: 'Index/ETF', VOO: 'Index/ETF', QQQ: 'Index/ETF', VTI: 'Index/ETF',
  IWM: 'Index/ETF', DIA: 'Index/ETF', VGT: 'Index/ETF', ARKK: 'Index/ETF',
  SCHD: 'Index/ETF', JEPI: 'Index/ETF', JEPQ: 'Index/ETF', VUG: 'Index/ETF',
  VYM: 'Index/ETF', AGG: 'Index/ETF', BND: 'Index/ETF', SPHD: 'Index/ETF',
  XLK: 'Index/ETF', XLF: 'Index/ETF', XLE: 'Index/ETF', XLV: 'Index/ETF',
  XLY: 'Index/ETF', XLP: 'Index/ETF', GLD: 'Index/ETF', SLV: 'Index/ETF',
};

// Sector positions in the XZ plane (Y axis = value height)
// Layout: AI & Tech at center, related sectors nearby
export const SECTOR_POSITIONS: Record<string, [number, number]> = {
  'AI & Tech':   [0,     0  ],
  'E-Commerce':  [3.5,  -3.5],
  'Finance':     [7,     0  ],
  'Healthcare':  [3.5,   5  ],
  'Consumer':    [-3.5,  5  ],
  'Energy':      [-7,    0  ],
  'Media':       [-3.5, -3.5],
  'Telecom':     [0,    -7  ],
  'Industrial':  [5.5,  -5.5],
  'Real Estate': [6,     5  ],
  'Index/ETF':   [0,     8  ],
  'Other':       [-6,   -6  ],
};

export function getSector(ticker: string): string {
  return SECTOR_MAP[ticker.toUpperCase()] ?? 'Other';
}

// Deterministic hash so positions don't re-randomize on each render
function hashTicker(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

export function getCloudPosition(
  ticker: string,
  totalValue: number,
  maxValue: number,
  resolvedSector?: string,
): [number, number, number] {
  const sector = resolvedSector ?? getSector(ticker);
  const [sx, sz] = SECTOR_POSITIONS[sector] ?? [0, 0];

  const hash = hashTicker(ticker);
  const angle  = ((hash & 0xff) / 255) * Math.PI * 2;
  const spread = 0.6 + ((hash >> 8 & 0xff) / 255) * 1.2;

  const x = sx + Math.cos(angle) * spread;
  const z = sz + Math.sin(angle) * spread;
  const y = (totalValue / Math.max(maxValue, 1)) * 4; // 0–4 based on relative value

  return [x, y, z];
}
