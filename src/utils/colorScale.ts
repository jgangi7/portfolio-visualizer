import { useThemeContext } from '../context/ThemeContext';

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

const darkModeColors = {
  gain: { r: 76, g: 175, b: 80 }, // #4CAF50
  loss: { r: 244, g: 67, b: 54 }, // #F44336
  neutral: { r: 158, g: 158, b: 158 }, // #9E9E9E
};

const lightModeColors = {
  gain: { r: 46, g: 125, b: 50 }, // #2E7D32
  loss: { r: 211, g: 47, b: 47 }, // #D32F2F
  neutral: { r: 97, g: 97, b: 97 }, // #616161
};

const interpolateColor = (color1: ColorRGB, color2: ColorRGB, intensity: number): string => {
  const r = Math.round(color1.r + (color2.r - color1.r) * intensity);
  const g = Math.round(color1.g + (color2.g - color1.g) * intensity);
  const b = Math.round(color1.b + (color2.b - color1.b) * intensity);
  return `rgb(${r}, ${g}, ${b})`;
};

export const useColorScale = () => {
  const { isDarkMode } = useThemeContext();
  const colors = isDarkMode ? darkModeColors : lightModeColors;

  const getColorByPercentage = (percentage: number): string => {
    // Define thresholds for maximum intensity
    const maxIntensityThreshold = 10; // Maximum color intensity at ±10%

    if (percentage === 0) return `rgb(${colors.neutral.r}, ${colors.neutral.g}, ${colors.neutral.b})`;

    // Calculate intensity (0 to 1)
    const intensity = Math.min(Math.abs(percentage) / maxIntensityThreshold, 1);

    if (percentage > 0) {
      return interpolateColor(colors.neutral, colors.gain, intensity);
    } else {
      return interpolateColor(colors.neutral, colors.loss, intensity);
    }
  };

  const getBackgroundColorByPercentage = (percentage: number): string => {
    const color = getColorByPercentage(percentage);
    return color.replace('rgb', 'rgba').replace(')', ', 0.15)');
  };

  const getTextColorByPercentage = (percentage: number): string => {
    return getColorByPercentage(percentage);
  };

  return {
    getColorByPercentage,
    getBackgroundColorByPercentage,
    getTextColorByPercentage,
  };
}; 