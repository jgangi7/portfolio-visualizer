import { useEffect, useState, ReactElement } from 'react';
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
} from 'recharts';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { StockPosition } from '../types/stock';
import { getTextColorByPercentage, getBackgroundColorByPercentage } from '../utils/colorScale';
// import { JSX } from 'react/jsx-runtime';

interface PortfolioChartProps {
  positions: StockPosition[];
}

interface TreeMapData {
  name: string;
  size: number;
  value: number;
  percentChange: number;
}

interface ContentProps {
  root: any;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: TreeMapData;
  colors: string[];
  rank: number;
  name: string;
}

const CustomContent = ({ depth, x, y, width, height, payload, name }: ContentProps): ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const bgColor = getTextColorByPercentage(payload.percentChange);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: bgColor,
          stroke: theme.palette.background.paper,
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {width > (isMobile ? 40 : 50) && height > (isMobile ? 25 : 30) && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (isMobile ? 6 : 8)}
            textAnchor="middle"
            fill="#fff"
            fontSize={isMobile ? 12 : 14}
            style={{ 
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + (isMobile ? 6 : 8)}
            textAnchor="middle"
            fill="#fff"
            fontSize={isMobile ? 10 : 12}
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            ${payload.value.toFixed(0)}
          </text>
        </>
      )}
    </g>
  );
};

const renderCustomContent = (props: ContentProps) => {
  return <CustomContent {...props} />;
};

const PortfolioChart = ({ positions }: PortfolioChartProps) => {
  const [data, setData] = useState<TreeMapData[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const transformData = () => {
      return positions.map((position) => ({
        name: position.ticker,
        size: position.totalValue || position.shares * position.purchasePrice,
        value: position.totalValue || position.shares * position.purchasePrice,
        percentChange: position.gainLossPercentage || 0,
      }));
    };

    setData(transformData());
  }, [positions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
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
            boxShadow: theme.shadows[4]
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{data.name}</Typography>
          <Typography variant="body2">{`Value: $${data.value.toFixed(2)}`}</Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: textColor,
              fontWeight: 'bold'
            }}
          >
            {`Change: ${new Intl.NumberFormat('en-US', {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              signDisplay: 'exceptZero',
            }).format(data.percentChange / 100)}`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (positions.length === 0) {
    return (
      <Box 
        sx={{ 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: '300px', sm: '400px' }
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            textAlign: 'center',
            color: 'text.secondary',
            px: 2
          }}
        >
          Add positions to see portfolio visualization.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', minHeight: { xs: '300px', sm: '400px' } }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Portfolio Allocation
      </Typography>
      <Box sx={{ height: 'calc(100% - 40px)', minHeight: { xs: '260px', sm: '360px' } }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={isMobile ? 1 : 4/3}
            stroke="#fff"
            fill="#8884d8"
            content={renderCustomContent}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PortfolioChart; 