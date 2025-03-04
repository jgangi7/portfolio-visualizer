const getColorByPercentage = (percentage: number): string => {
  // Define base colors
  const gainColor = { r: 76, g: 175, b: 80 }; // #4CAF50
  const lossColor = { r: 244, g: 67, b: 54 }; // #F44336
  const neutralColor = { r: 158, g: 158, b: 158 }; // #9E9E9E

  // Define thresholds for maximum intensity
  const maxIntensityThreshold = 10; // Maximum color intensity at ±10%

  if (percentage === 0) return `rgb(${neutralColor.r}, ${neutralColor.g}, ${neutralColor.b})`;

  // Calculate intensity (0 to 1)
  const intensity = Math.min(Math.abs(percentage) / maxIntensityThreshold, 1);

  if (percentage > 0) {
    // Interpolate between neutral and gain color
    const r = Math.round(neutralColor.r + (gainColor.r - neutralColor.r) * intensity);
    const g = Math.round(neutralColor.g + (gainColor.g - neutralColor.g) * intensity);
    const b = Math.round(neutralColor.b + (gainColor.b - neutralColor.b) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Interpolate between neutral and loss color
    const r = Math.round(neutralColor.r + (lossColor.r - neutralColor.r) * intensity);
    const g = Math.round(neutralColor.g + (lossColor.g - neutralColor.g) * intensity);
    const b = Math.round(neutralColor.b + (lossColor.b - neutralColor.b) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export const getBackgroundColorByPercentage = (percentage: number): string => {
  const color = getColorByPercentage(percentage);
  return color.replace('rgb', 'rgba').replace(')', ', 0.15)');
};

export const getTextColorByPercentage = (percentage: number): string => {
  return getColorByPercentage(percentage);
}; 