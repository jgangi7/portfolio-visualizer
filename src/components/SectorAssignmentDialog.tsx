import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Select, MenuItem, FormControl,
  SelectChangeEvent,
} from '@mui/material';
import { StockPosition } from '../types/stock';
import { SECTOR_POSITIONS } from '../utils/sectorMap';

const SECTORS = [...Object.keys(SECTOR_POSITIONS).filter((s) => s !== 'Other'), 'Other'];

interface Props {
  open: boolean;
  positions: StockPosition[]; // only the unrecognized ones
  onConfirm: (withSectors: StockPosition[]) => void;
  onCancel: () => void;
}

const SectorAssignmentDialog = ({ open, positions, onConfirm, onCancel }: Props) => {
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(positions.map((p) => [p.ticker, ''])),
  );

  // Reset assignments whenever the dialog opens with new positions
  const handleChange = (ticker: string, sector: string) => {
    setAssignments((prev) => ({ ...prev, [ticker]: sector }));
  };

  const allAssigned = positions.every((p) => assignments[p.ticker]);

  const handleConfirm = () => {
    const updated = positions.map((p) => ({ ...p, sector: assignments[p.ticker] }));
    onConfirm(updated);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Assign Sectors</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          The following tickers weren't recognized. Please assign a sector to each before adding them.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {positions.map((p) => (
            <Box key={p.ticker} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60 }}>
                {p.ticker}
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  displayEmpty
                  value={assignments[p.ticker] ?? ''}
                  onChange={(e: SelectChangeEvent) => handleChange(p.ticker, e.target.value)}
                  renderValue={(v) => v || <span style={{ color: 'rgba(128,128,128,0.8)' }}>Select sector…</span>}
                >
                  {SECTORS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!allAssigned}>
          Add Positions
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectorAssignmentDialog;
