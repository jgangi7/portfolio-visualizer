import { useState, useEffect, useRef } from 'react';
import { Container, Paper, Typography, Box, ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { StockPosition } from './types/stock';
import StockForm from './components/StockForm';
import StockList from './components/StockList';
import PortfolioChart from './components/PortfolioChart';
import { updatePositionPrices } from './services/stockService';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import ThemeSwitch from './components/ThemeSwitch';

const AppContent = () => {
  const { isDarkMode } = useThemeContext();
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const updatePrices = async () => {
      if (positions.length === 0 || !shouldUpdate.current) return;
      
      try {
        shouldUpdate.current = false;
        setLoading(true);
        const updatedPositions = await updatePositionPrices(positions);
        setPositions(updatedPositions);
      } catch (error) {
        console.error('Failed to update prices:', error);
      } finally {
        setLoading(false);
        // Allow next update after 5 minutes
        setTimeout(() => {
          shouldUpdate.current = true;
        }, 5 * 60 * 1000);
      }
    };

    updatePrices();
  }, [positions.length]); // Only run when the number of positions changes

  const addPosition = (newPosition: StockPosition) => {
    shouldUpdate.current = true; // Allow update when new position is added
    setPositions([...positions, newPosition]);
  };

  const removePosition = (ticker: string) => {
    shouldUpdate.current = true; // Allow update when position is removed
    setPositions(positions.filter(position => position.ticker !== ticker));
  };

  return (
    <MuiThemeProvider theme={theme}>
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
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              color: 'primary.main', 
              textAlign: 'center',
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
              mb: { xs: 4, sm: 5 },
              transition: 'color 0.3s ease',
              textShadow: isDarkMode ? '0 0 20px rgba(144, 202, 249, 0.2)' : 'none',
            }}
          >
            Portfolio Visualizer
          </Typography>
          
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
