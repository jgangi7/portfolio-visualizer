import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { StockPosition, StockFormData } from '../types/stock';

interface StockFormProps {
  onSubmit: (position: StockPosition) => void;
}

const StockForm = ({ onSubmit }: StockFormProps) => {
  const [formData, setFormData] = useState<StockFormData>({
    ticker: '',
    shares: 0,
    purchasePrice: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ticker && formData.shares > 0 && formData.purchasePrice > 0) {
      const totalValue = formData.shares * formData.purchasePrice;
      onSubmit({
        ...formData,
        currentPrice: formData.purchasePrice,
        totalValue,
        gainLoss: 0,
        gainLossPercentage: 0,
      });
      setFormData({ ticker: '', shares: 0, purchasePrice: 0 });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Add New Position
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr auto' } }}>
        <TextField
          label="Ticker Symbol"
          value={formData.ticker}
          onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
          required
          size="small"
          inputProps={{ maxLength: 5 }}
          placeholder="AAPL"
        />
        <TextField
          label="Number of Shares"
          type="number"
          value={formData.shares || ''}
          onChange={(e) => setFormData({ ...formData, shares: Math.max(0, parseFloat(e.target.value)) })}
          required
          size="small"
          inputProps={{ min: 0, step: 0.01 }}
          placeholder="100"
        />
        <TextField
          label="Purchase Price"
          type="number"
          value={formData.purchasePrice || ''}
          onChange={(e) => setFormData({ ...formData, purchasePrice: Math.max(0, parseFloat(e.target.value)) })}
          required
          size="small"
          inputProps={{ min: 0, step: 0.01 }}
          placeholder="150.00"
        />
        <Button 
          type="submit" 
          variant="contained" 
          sx={{ 
            height: '40px',
            minWidth: '80px'
          }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default StockForm; 