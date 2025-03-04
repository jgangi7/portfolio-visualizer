import { useState, useEffect } from 'react';
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

  const theme = createTheme({
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
  });

  useEffect(() => {
    const updatePrices = async () => {
      if (positions.length === 0) return;
      
      try {
        setLoading(true);
        const updatedPositions = await updatePositionPrices(positions);
        setPositions(updatedPositions);
      } catch (error) {
        console.error('Failed to update prices:', error);
      } finally {
        setLoading(false);
      }
    };

    updatePrices();

    // Update prices every 5 minutes
    const interval = setInterval(updatePrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [positions]);

  const addPosition = (newPosition: StockPosition) => {
    setPositions([...positions, newPosition]);
  };

  const removePosition = (ticker: string) => {
    setPositions(positions.filter(position => position.ticker !== ticker));
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Box 
        sx={{ 
          bgcolor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 },
          transition: 'background-color 0.3s ease',
        }}
      >
        <ThemeSwitch />
        <Container 
          maxWidth="xl" 
          sx={{ 
            width: '100%',
            maxWidth: '1600px',
            margin: '0 auto'
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              color: 'primary.main', 
              textAlign: 'center',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              mb: { xs: 3, sm: 4 },
              transition: 'color 0.3s ease',
            }}
          >
            Portfolio Visualizer
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gap: { xs: 2, sm: 3 }, 
            gridTemplateColumns: { 
              xs: '1fr', 
              lg: '1fr 1fr' 
            },
            maxWidth: '100%',
            margin: '0 auto'
          }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 2, sm: 3 },
                height: 'fit-content',
                transition: 'background-color 0.3s ease',
              }}
            >
              <StockForm onSubmit={addPosition} />
              <StockList positions={positions} onRemove={removePosition} loading={loading} />
            </Paper>
            
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 2, sm: 3 },
                height: 'fit-content',
                minHeight: { xs: '400px', sm: '500px' },
                transition: 'background-color 0.3s ease',
              }}
            >
              <PortfolioChart positions={positions} />
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
