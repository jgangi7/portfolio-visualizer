import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { StockPosition } from '../types/stock';
import { useColorScale } from '../utils/colorScale';

type SortKey = 'ticker' | 'shares' | 'purchasePrice' | 'currentPrice' | 'totalValue' | 'gainLossPercentage';
type SortDir = 'asc' | 'desc';

interface StockListProps {
  positions: StockPosition[];
  onRemove: (ticker: string) => void;
  loading?: boolean;
}

const StockList = ({ positions, onRemove, loading = false }: StockListProps) => {
  const { getTextColorByPercentage, getBackgroundColorByPercentage } = useColorScale();
  const [sortKey, setSortKey] = useState<SortKey>('ticker');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const summary = useMemo(() => {
    const totalValue = positions.reduce((s, p) => s + (p.totalValue ?? p.shares * p.purchasePrice), 0);
    const totalCost = positions.reduce((s, p) => s + p.shares * p.purchasePrice, 0);
    const gainLoss = totalValue - totalCost;
    const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    return { totalValue, gainLoss, gainLossPct };
  }, [positions]);

  const sorted = useMemo(() => {
    return [...positions].sort((a, b) => {
      const aVal = sortKey === 'ticker'
        ? a.ticker
        : sortKey === 'currentPrice'
          ? (a.currentPrice ?? a.purchasePrice)
          : sortKey === 'totalValue'
            ? (a.totalValue ?? a.shares * a.purchasePrice)
            : sortKey === 'gainLossPercentage'
              ? (a.gainLossPercentage ?? 0)
              : a[sortKey];
      const bVal = sortKey === 'ticker'
        ? b.ticker
        : sortKey === 'currentPrice'
          ? (b.currentPrice ?? b.purchasePrice)
          : sortKey === 'totalValue'
            ? (b.totalValue ?? b.shares * b.purchasePrice)
            : sortKey === 'gainLossPercentage'
              ? (b.gainLossPercentage ?? 0)
              : b[sortKey];

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [positions, sortKey, sortDir]);

  if (positions.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: 'center', mt: 2 }}>
        No positions added yet.
      </Typography>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatPercentage = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'exceptZero',
    }).format(value / 100);

  const col = (key: SortKey) => ({
    active: sortKey === key,
    direction: sortKey === key ? sortDir : 'asc' as SortDir,
    onClick: () => handleSort(key),
  });

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h6" gutterBottom>
        Portfolio Positions
      </Typography>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortKey === 'ticker' ? sortDir : false}>
                <TableSortLabel {...col('ticker')}>Ticker</TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'shares' ? sortDir : false}>
                <TableSortLabel {...col('shares')}>Shares</TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'purchasePrice' ? sortDir : false}>
                <TableSortLabel {...col('purchasePrice')}>Purchase Price</TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'currentPrice' ? sortDir : false}>
                <TableSortLabel {...col('currentPrice')}>Current Price</TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'totalValue' ? sortDir : false}>
                <TableSortLabel {...col('totalValue')}>Total Value</TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'gainLossPercentage' ? sortDir : false}>
                <TableSortLabel {...col('gainLossPercentage')}>Gain/Loss</TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((position) => {
              const gainLossPercentage = position.gainLossPercentage || 0;
              const textColor = getTextColorByPercentage(gainLossPercentage);
              const bgColor = getBackgroundColorByPercentage(gainLossPercentage);

              return (
                <TableRow
                  key={position.ticker}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell sx={{ fontWeight: 'bold', color: textColor }}>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(position.ticker)}+stock`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {position.ticker}
                    </a>
                  </TableCell>
                  <TableCell align="right">
                    {position.shares.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(position.purchasePrice)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: textColor,
                      fontWeight: position.currentPrice !== position.purchasePrice ? 'bold' : 'normal',
                    }}
                  >
                    {formatCurrency(position.currentPrice || position.purchasePrice)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: textColor }}>
                    {formatCurrency(position.totalValue || (position.shares * position.purchasePrice))}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      color: textColor,
                      bgcolor: bgColor,
                      transition: 'all 0.3s ease',
                      borderRadius: 1,
                    }}
                  >
                    {formatPercentage(gainLossPercentage)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => onRemove(position.ticker)}
                      sx={{ '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ '& td': { borderTop: 2, borderColor: 'divider' } }}>
              <TableCell colSpan={4} sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatCurrency(summary.totalValue)}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  color: getTextColorByPercentage(summary.gainLossPct),
                  bgcolor: getBackgroundColorByPercentage(summary.gainLossPct),
                  borderRadius: 1,
                }}
              >
                {formatCurrency(summary.gainLoss)}&nbsp;
                ({summary.gainLossPct >= 0 ? '+' : ''}{summary.gainLossPct.toFixed(2)}%)
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockList;
