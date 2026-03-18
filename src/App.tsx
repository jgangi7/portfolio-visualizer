import { useState, useEffect, useRef } from 'react';
import { Container, Paper, Box, ThemeProvider as MuiThemeProvider, createTheme, Snackbar, Alert, Button, Tooltip } from '@mui/material';
import { StockPosition } from './types/stock';
import StockForm from './components/StockForm';
import StockList from './components/StockList';
import PortfolioChart from './components/PortfolioChart';
import { updatePositionPrices, getRemainingCalls, getMinutesUntilReset } from './services/stockService';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import ThemeSwitch from './components/ThemeSwitch';
import { parsePortfolioCSV } from './utils/csvParser';

const POSITIONS_KEY = 'portfolio_positions';


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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const shouldUpdate = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { positions: parsed, skipped } = parsePortfolioCSV(content);

      if (parsed.length === 0) {
        setErrorMsg(skipped[0] || 'No valid positions found in the file.');
        return;
      }

      // Merge with existing — skip duplicates
      setPositions(prev => {
        const existing = new Set(prev.map(p => p.ticker));
        const newOnes = parsed.filter(p => !existing.has(p.ticker));
        const dupes = parsed.filter(p => existing.has(p.ticker)).map(p => p.ticker);

        const allSkipped = [...skipped, ...dupes];
        if (newOnes.length > 0) {
          let msg = `Imported ${newOnes.length} position${newOnes.length !== 1 ? 's' : ''}.`;
          if (allSkipped.length > 0) msg += ` Skipped: ${allSkipped.join(', ')}.`;
          setSuccessMsg(msg);
          shouldUpdate.current = false; // prices are already in the CSV
        } else {
          setErrorMsg(`All positions already exist in your portfolio. Skipped: ${dupes.join(', ')}.`);
        }

        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
    };

    reader.readAsText(file);
    // Reset so the same file can be re-imported if needed
    e.target.value = '';
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
      <Snackbar
        open={!!successMsg}
        autoHideDuration={5000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
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
                  <Tooltip title="Import a CSV/TSV portfolio export (Fidelity format supported)">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Import CSV
                    </Button>
                  </Tooltip>
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
