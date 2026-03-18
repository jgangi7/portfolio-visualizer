import { useState, useEffect, useRef } from 'react';
import { Container, Paper, Box, ThemeProvider as MuiThemeProvider, createTheme, Snackbar, Alert, Button } from '@mui/material';
import { StockPosition } from './types/stock';
import StockForm from './components/StockForm';
import StockList from './components/StockList';
import PortfolioChart from './components/PortfolioChart';
import { updatePositionPrices, getRemainingCalls, getMinutesUntilReset } from './services/stockService';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import ThemeSwitch from './components/ThemeSwitch';

const POSITIONS_KEY = 'portfolio_positions';

const TEST_POSITIONS: StockPosition[] = [
  { ticker: 'AAPL',  shares: 50,  purchasePrice: 150.00, currentPrice: 211.42, totalValue: 10571.00, gainLoss: 3071.00,  gainLossPercentage: 40.95  },
  { ticker: 'MSFT',  shares: 30,  purchasePrice: 280.00, currentPrice: 415.30, totalValue: 12459.00, gainLoss: 4059.00,  gainLossPercentage: 48.32  },
  { ticker: 'NVDA',  shares: 20,  purchasePrice: 500.00, currentPrice: 875.40, totalValue: 17508.00, gainLoss: 7508.00,  gainLossPercentage: 75.08  },
  { ticker: 'GOOGL', shares: 15,  purchasePrice: 140.00, currentPrice: 168.72, totalValue: 2530.80,  gainLoss: 430.80,   gainLossPercentage: 20.51  },
  { ticker: 'AMZN',  shares: 25,  purchasePrice: 185.00, currentPrice: 176.50, totalValue: 4412.50,  gainLoss: -212.50,  gainLossPercentage: -4.59  },
  { ticker: 'META',  shares: 10,  purchasePrice: 320.00, currentPrice: 511.90, totalValue: 5119.00,  gainLoss: 1919.00,  gainLossPercentage: 59.97  },
  { ticker: 'TSLA',  shares: 40,  purchasePrice: 250.00, currentPrice: 178.20, totalValue: 7128.00,  gainLoss: -2872.00, gainLossPercentage: -28.72 },
  { ticker: 'JPM',   shares: 35,  purchasePrice: 195.00, currentPrice: 208.40, totalValue: 7294.00,  gainLoss: 469.00,   gainLossPercentage: 6.87   },
  { ticker: 'BAC',   shares: 100, purchasePrice: 38.00,  currentPrice: 32.10,  totalValue: 3210.00,  gainLoss: -590.00,  gainLossPercentage: -15.53 },
  { ticker: 'XOM',   shares: 45,  purchasePrice: 110.00, currentPrice: 114.80, totalValue: 5166.00,  gainLoss: 216.00,   gainLossPercentage: 4.36   },
  { ticker: 'WMT',   shares: 20,  purchasePrice: 60.00,  currentPrice: 97.30,  totalValue: 1946.00,  gainLoss: 746.00,   gainLossPercentage: 62.17  },
  { ticker: 'INTC',  shares: 80,  purchasePrice: 45.00,  currentPrice: 22.40,  totalValue: 1792.00,  gainLoss: -1808.00, gainLossPercentage: -50.22 },
];

const AppContent = () => {
  const { isDarkMode } = useThemeContext();
  const [positions, setPositions] = useState<StockPosition[]>(() => {
    try {
      const stored = localStorage.getItem(POSITIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const shouldUpdate = useRef(true);

  const theme = createTheme({
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      body2: {
        fontWeight: 500,
      },
    },
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#90caf9' : '#1976d2',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12,
          },
        },
      },
    },
  });

  // Persist positions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    const updatePrices = async () => {
      if (positions.length === 0 || !shouldUpdate.current) return;

      const remaining = getRemainingCalls();
      if (remaining === 0) {
        const minutes = getMinutesUntilReset();
        setErrorMsg(`API rate limit reached (5/hour). Showing cached prices. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
        return;
      }

      try {
        shouldUpdate.current = false;
        setLoading(true);
        const updatedPositions = await updatePositionPrices(positions);
        setPositions(updatedPositions);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to update prices.';
        setErrorMsg(msg);
      } finally {
        setLoading(false);
        setTimeout(() => {
          shouldUpdate.current = true;
        }, 5 * 60 * 1000);
      }
    };

    updatePrices();
  }, [positions.length]);

  const addPosition = (newPosition: StockPosition) => {
    const duplicate = positions.some(p => p.ticker === newPosition.ticker);
    if (duplicate) {
      setErrorMsg(`${newPosition.ticker} is already in your portfolio.`);
      return;
    }
    shouldUpdate.current = true;
    setPositions(prev => [...prev, newPosition]);
  };

  const removePosition = (ticker: string) => {
    setPositions(prev => prev.filter(p => p.ticker !== ticker));
  };

  const loadTestData = () => {
    shouldUpdate.current = false; // skip API calls — data is already populated
    setPositions(TEST_POSITIONS);
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={6000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
      <Box
        sx={{ 
          bgcolor: 'background.default',
          minHeight: '100vh',
          minWidth: '100vw',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          transition: 'all 0.3s ease',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeSwitch />
        </Box>
        
        <Container 
          maxWidth={false} 
          sx={{ 
            width: '100%',
            minWidth: '100%',
            maxWidth: 'none',
            px: { xs: 0, sm: 2, md: 3 },
            boxSizing: 'border-box',
          }}
        >
         <Box sx={{ 
            display: 'grid', 
            gap: { xs: 3, sm: 4 }, 
            gridTemplateColumns: { 
              xs: '1fr', 
              lg: '1fr 1fr' 
            },
            width: '100%',
            minWidth: '100%',
            boxSizing: 'border-box',
          }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 3, sm: 4 },
                height: 'fit-content',
                transition: 'all 0.3s ease',
                width: '80%',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ px: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={loadTestData}
                  >
                    Load Test Data
                  </Button>
                </Box>
                <StockForm onSubmit={addPosition} />
                <Box 
                  sx={{ 
                    mt: 4, 
                    pt: 4, 
                    px: { xs: 1, sm: 2 },
                    borderTop: 1, 
                    borderColor: 'divider' 
                  }}
                >
                  <StockList positions={positions} onRemove={removePosition} loading={loading} />
                </Box>
              </Box>
            </Paper>
            
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 3, sm: 4 },
                height: 'fit-content',
                minHeight: { xs: '400px', sm: '500px' },
                transition: 'all 0.3s ease',
                width: '80%',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ px: { xs: 1, sm: 2 } }}>
                <PortfolioChart positions={positions} />
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
