import { useMemo } from 'react';
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
} from 'recharts';
import { Box, Typography, useTheme, useMediaQuery, GlobalStyles } from '@mui/material';
import { StockPosition } from '../types/stock';
import { useColorScale } from '../utils/colorScale';

interface PortfolioChartProps {
  positions: StockPosition[];
}

interface TreeMapData {
  name: string;
  size: number;
  value: number;
  percentChange: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TreeMapData;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  const theme = useTheme();
  const { getTextColorByPercentage } = useColorScale();

  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const textColor = getTextColorByPercentage(data.percentChange);

    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: theme.shadows[4],
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {data.name}
        </Typography>
        <Typography variant="body2">{`Value: $${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Typography>
        <Typography variant="body2" sx={{ color: textColor, fontWeight: 'bold' }}>
          {`${data.percentChange >= 0 ? '+' : ''}${data.percentChange.toFixed(2)}%`}
        </Typography>
      </Box>
    );
  }
  return null;
};

const PortfolioChart = ({ positions }: PortfolioChartProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getColorByPercentage } = useColorScale();

  const data = useMemo<TreeMapData[]>(
    () =>
      positions.map((position) => ({
        name: position.ticker,
        size: position.totalValue ?? position.shares * position.purchasePrice,
        value: position.totalValue ?? position.shares * position.purchasePrice,
        percentChange: position.gainLossPercentage ?? 0,
      })),
    [positions]
  );

  // Changing key forces Recharts to remount Treemap when positions change,
  // since Recharts Treemap doesn't reliably update on data prop changes alone.
  const treemapKey = positions.map(p => p.ticker).join(',');

  // Custom per-cell renderer — closure captures theme + color fn so no hook violations
  const renderCell = (props: {
    depth: number;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    percentChange: number;
  }) => {
    const { depth, x, y, width, height, name, percentChange } = props;

    // depth 0 = invisible root container; depth 1 = actual data cells
    if (depth !== 1) return <g key="root" />;

    const bgColor = getColorByPercentage(percentChange ?? 0);
    const borderColor = theme.palette.background.default;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

    // Pick clean font sizes based on block area, constrained by width
    const area = width * height;
    let tickerSize: number;
    let pctSize: number;
    if (area > 15000)      { tickerSize = 16; pctSize = 12; }
    else if (area > 6000)  { tickerSize = 14; pctSize = 11; }
    else if (area > 2000)  { tickerSize = 12; pctSize = 10; }
    else                   { tickerSize = 10; pctSize = 9;  }
    // Never wider than the block
    tickerSize = Math.min(tickerSize, Math.floor(width / 3.5));
    pctSize    = Math.min(pctSize,    Math.floor(width / 4.5));

    const showTicker  = width > 36 && height > 22 && tickerSize >= 8;
    const showPercent = width > 48 && height > 42 && pctSize >= 8;

    // Vertically center the text group as a unit
    const gap = 4;
    const tickerY = showPercent
      ? cy - (gap + pctSize) / 2
      : cy;
    const pctY = cy + (tickerSize + gap) / 2;

    const pct = percentChange ?? 0;
    const sign = pct >= 0 ? '+' : '';

    return (
      <g
        key={name}
        className="treemap-cell"
        style={{ cursor: 'pointer' }}
        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(name)}+stock`, '_blank', 'noopener,noreferrer')}
      >
        <rect
          x={x + 1}
          y={y + 1}
          width={width - 2}
          height={height - 2}
          style={{ fill: bgColor, stroke: borderColor, strokeWidth: 2 }}
        />
        {showTicker && (
          <text
            x={cx}
            y={tickerY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="treemap-ticker"
            fill="rgba(0,0,0,0.87)"
            fontSize={tickerSize}
            fontWeight="700"
            fontFamily={fontFamily}
            letterSpacing="0.04em"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {name}
          </text>
        )}
        {showPercent && (
          <text
            x={cx}
            y={pctY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="treemap-pct"
            fill="rgba(0,0,0,0.6)"
            fontSize={pctSize}
            fontWeight="500"
            fontFamily={fontFamily}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {`${sign}${pct.toFixed(1)}%`}
          </text>
        )}
      </g>
    );
  };

  const chartHeight = isMobile ? 300 : 460;

  if (positions.length === 0) {
    return (
      <Box
        sx={{
          height: chartHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', px: 2 }}>
          Add positions to see portfolio visualization.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <GlobalStyles styles={{
        '.treemap-cell:hover .treemap-ticker': { fill: 'rgba(255,255,255,1)' },
        '.treemap-cell:hover .treemap-pct':    { fill: 'rgba(255,255,255,0.82)' },
      }} />
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Portfolio Map
      </Typography>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <Treemap
          key={treemapKey}
          data={data}
          dataKey="size"
          aspectRatio={isMobile ? 1 : 4 / 3}
          stroke={theme.palette.background.default}
          content={renderCell as any}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </Box>
  );
};

export default PortfolioChart;
