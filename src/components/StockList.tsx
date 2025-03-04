import { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { StockPosition } from '../types/stock';
import { getTextColorByPercentage, getBackgroundColorByPercentage } from '../utils/colorScale';

interface StockListProps {
  positions: StockPosition[];
  onRemove: (ticker: string) => void;
  loading?: boolean;
}

const StockList = ({ positions, onRemove, loading = false }: StockListProps) => {
  useEffect(() => {
    const fetchStockPrices = async () => {
      // We'll implement real-time price updates here using a free API
      // For now, this is a placeholder
    };

    if (positions.length > 0) {
      fetchStockPrices();
    }
  }, [positions]);

  if (positions.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: 'center', mt: 2 }}>
        No positions added yet.
      </Typography>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'exceptZero',
    }).format(value / 100);
  };

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
              <TableCell>Ticker</TableCell>
              <TableCell align="right">Shares</TableCell>
              <TableCell align="right">Purchase Price</TableCell>
              <TableCell align="right">Current Price</TableCell>
              <TableCell align="right">Total Value</TableCell>
              <TableCell align="right">Gain/Loss</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((position) => {
              const gainLossPercentage = position.gainLossPercentage || 0;
              const textColor = getTextColorByPercentage(gainLossPercentage);
              const bgColor = getBackgroundColorByPercentage(gainLossPercentage);
              
              return (
                <TableRow 
                  key={position.ticker}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: textColor
                    }}
                  >
                    {position.ticker}
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
                  <TableCell 
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      color: textColor,
                    }}
                  >
                    {formatCurrency(position.totalValue || (position.shares * position.purchasePrice))}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      color: textColor,
                      bgcolor: bgColor,
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    {formatPercentage(gainLossPercentage)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => onRemove(position.ticker)}
                      sx={{
                        '&:hover': {
                          color: 'error.main',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockList; 