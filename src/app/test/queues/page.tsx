'use client';

import { 
  Button, 
  Stack, 
  Typography, 
  Box, 
  Paper 
} from '@mui/material';
import { useState } from 'react';

export default function TestQueuesPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const triggerPrematch = async () => {
    try {
      setLoading(true);
      setStatus('Triggering prematch calculation...');
      
      const response = await fetch('/api/prematch/calculate', {
        method: 'POST',
      });
      
      const data = await response.json();
      setStatus(`Prematch calculation queued: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalytics = async () => {
    try {
      setLoading(true);
      setStatus('Triggering analytics calculation...');
      
      const response = await fetch('/api/analytics/calculate', {
        method: 'POST',
      });
      
      const data = await response.json();
      setStatus(`Analytics calculation queued: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      setLoading(true);
      setStatus('Checking queue status...');
      
      const response = await fetch('/api/queues/status');
      const data = await response.json();
      setStatus(`Queue status: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Queue Testing Interface</Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={triggerPrematch}
          disabled={loading}
        >
          Trigger Prematch Calculation
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={triggerAnalytics}
          disabled={loading}
        >
          Trigger Analytics Calculation
        </Button>

        <Button
          variant="outlined"
          onClick={checkStatus}
          disabled={loading}
        >
          Check Queue Status
        </Button>

        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: 'grey.50',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}
        >
          <Typography>
            {status || 'No status yet'}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
} 