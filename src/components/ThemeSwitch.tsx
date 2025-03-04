import { styled } from '@mui/material/styles';
import { IconButton, Box, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from '../context/ThemeContext';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[4],
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  zIndex: 1100,
  transition: 'all 0.3s ease',
}));

const ThemeSwitch = () => {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <Box>
      <StyledIconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label="toggle theme"
        size="large"
        sx={{
          borderRadius: '50%',
          width: 48,
          height: 48,
        }}
      >
        {isDarkMode ? (
          <Brightness7Icon sx={{ color: theme.palette.primary.main }} />
        ) : (
          <Brightness4Icon sx={{ color: theme.palette.primary.main }} />
        )}
      </StyledIconButton>
    </Box>
  );
};

export default ThemeSwitch; 