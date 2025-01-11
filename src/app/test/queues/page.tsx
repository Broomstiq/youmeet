'use client';

import { 
  Button, 
  Stack, 
  Typography, 
  Box, 
  Paper,
  TablePagination,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useState, useEffect } from 'react';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function TestQueuesPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [prematchPage, setPrematchPage] = useState(0);
  const [prematchPageSize, setPrematchPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<any>(null);

  // Add useEffect to fetch data initially
  useEffect(() => {
    checkStatus();
  }, []);

  // Add useEffect to handle pagination changes
  useEffect(() => {
    console.log('Pagination state changed:', {
      userPage,
      userPageSize,
      prematchPage,
      prematchPageSize
    });
    // Force re-render when pagination state changes
    if (data) {
      const paginatedUsers = getPaginatedUsers();
      const paginatedPrematches = getPaginatedPrematches();
      console.log('Paginated data:', {
        users: paginatedUsers.length,
        prematches: paginatedPrematches.length
      });
    }
  }, [userPage, userPageSize, prematchPage, prematchPageSize]);

  const handleUserPageChange = (event: unknown, newPage: number) => {
    console.log('User page change:', { currentPage: userPage, newPage });
    setUserPage(newPage);
  };

  const handlePrematchPageChange = (event: unknown, newPage: number) => {
    console.log('Prematch page change:', { currentPage: prematchPage, newPage });
    setPrematchPage(newPage);
  };

  const handleUserPageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUserPageSize(parseInt(event.target.value, 10));
    setUserPage(0);
  };

  const handlePrematchPageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPrematchPageSize(parseInt(event.target.value, 10));
    setPrematchPage(0);
  };

  const triggerPrematch = async () => {
    try {
      setLoading(true);
      setStatus('Triggering prematch calculation...');
      
      const response = await fetch('/api/prematch/calculate', {
        method: 'POST',
      });
      
      const result = await response.json();
      setStatus(`Prematch calculation queued: ${JSON.stringify(result, null, 2)}`);
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
      
      const result = await response.json();
      setStatus(`Analytics calculation queued: ${JSON.stringify(result, null, 2)}`);
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
      
      console.log('Fetching status...');
      const response = await fetch('/api/prematch/test');
      const result = await response.json();
      
      // Detailed debug logging
      console.group('Queue Status Check - Detailed Debug');
      console.log('Raw Response Status:', response.status);
      console.log('Raw Response OK:', response.ok);
      console.log('Full API Response:', result);
      
      // Log each key in the result
      console.log('Response Keys:', Object.keys(result));
      
      // Specific data checks
      console.group('Data Presence Checks');
      console.log('Has users?', Boolean(result.users));
      console.log('Has prematches?', Boolean(result.prematches));
      console.log('Has summary?', Boolean(result.summary));
      console.log('Users type:', Array.isArray(result.users) ? 'array' : typeof result.users);
      console.log('Prematches type:', Array.isArray(result.prematches) ? 'array' : typeof result.prematches);
      console.groupEnd();
      
      // Data counts
      console.group('Data Counts');
      console.log('Summary:', result.summary);
      console.log('Users count:', result.users?.length || 0);
      console.log('Prematches count:', result.prematches?.length || 0);
      console.groupEnd();
      
      console.groupEnd();

      setData(result);
      setStatus(`Status: ${JSON.stringify(result.summary, null, 2)}`);
      
    } catch (error) {
      console.error('Error in checkStatus:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Get paginated data with proper typing
  interface User {
    id: string;
    name: string;
    matching_param: number;
    subscriptionCount: number;
    subscriptions: Array<{ channel_id: string; channel_name: string }>;
  }

  interface Prematch {
    id: string;
    user_id: string;
    match_user_id: string;
    relevancy_score: number;
    created_at: string;
    user_name: string;
    match_user_name: string;
  }

  const getPaginatedUsers = () => {
    if (!data?.users) return [];
    const start = userPage * userPageSize;
    const end = Math.min(start + userPageSize, data.users.length);
    const paginatedData = data.users.slice(start, end);
    console.log('Users pagination:', { start, end, pageSize: userPageSize, resultCount: paginatedData.length });
    return paginatedData;
  };

  const getPaginatedPrematches = () => {
    if (!data?.prematches) return [];
    const start = prematchPage * prematchPageSize;
    const end = Math.min(start + prematchPageSize, data.prematches.length);
    const paginatedData = data.prematches.slice(start, end);
    console.log('Prematches pagination:', { start, end, pageSize: prematchPageSize, resultCount: paginatedData.length });
    return paginatedData;
  };

  // Enhanced debug logging function
  const logDataStructure = () => {
    if (data) {
      console.group('Current Data State');
      console.log('Full data structure:', data);
      console.log('Users array:', data.users);
      console.log('Prematches array:', data.prematches);
      console.log('Pagination state:', {
        users: {
          page: userPage,
          pageSize: userPageSize,
          totalItems: data.users?.length || 0
        },
        prematches: {
          page: prematchPage,
          pageSize: prematchPageSize,
          totalItems: data.prematches?.length || 0
        }
      });
      
      // Log paginated data
      const paginatedUsers = getPaginatedUsers();
      const paginatedPrematches = getPaginatedPrematches();
      
      console.log('Current page users:', paginatedUsers);
      console.log('Current page prematches:', paginatedPrematches);
      console.groupEnd();
    } else {
      console.warn('No data available yet');
    }
  };

  // Add useEffect to log data changes
  useEffect(() => {
    if (data) {
      console.group('Data Update');
      console.log('Data updated at:', new Date().toISOString());
      console.log('New data state:', data);
      console.groupEnd();
    }
  }, [data]);

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Queue Testing Interface</Typography>
        
        <Stack direction="row" spacing={2}>
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
        </Stack>

        {data && (
          <>
            {logDataStructure()}
            {/* Users Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Users ({data.users?.length || 0})
                </Typography>
                <Grid container spacing={2}>
                  {getPaginatedUsers().map((user: User) => (
                    <Grid item xs={12} md={6} key={user.id}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">{user.name || 'Unnamed User'}</Typography>
                        <Typography variant="body2">ID: {user.id}</Typography>
                        <Typography variant="body2">
                          Matching Parameter: {user.matching_param}
                        </Typography>
                        <Typography variant="body2">
                          Subscriptions: {user.subscriptionCount}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
              {data.users?.length > 0 && (
                <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                  <TablePagination
                    component="div"
                    count={data.users.length}
                    page={userPage}
                    onPageChange={handleUserPageChange}
                    rowsPerPage={userPageSize}
                    onRowsPerPageChange={handleUserPageSizeChange}
                    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                    labelRowsPerPage="Users per page"
                  />
                </Box>
              )}
            </Card>

            {/* Prematches Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Prematches ({data.prematches?.length || 0})
                </Typography>
                <Grid container spacing={2}>
                  {getPaginatedPrematches().map((prematch: Prematch) => (
                    <Grid item xs={12} key={prematch.id}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">
                          Match: {prematch.user_name || 'Unknown'} ↔ {prematch.match_user_name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2">
                          Score: {prematch.relevancy_score}
                        </Typography>
                        <Typography variant="body2">
                          Created: {new Date(prematch.created_at).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          IDs: {prematch.user_id} ↔ {prematch.match_user_id}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
              {data.prematches?.length > 0 && (
                <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                  <TablePagination
                    component="div"
                    count={data.prematches.length}
                    page={prematchPage}
                    onPageChange={handlePrematchPageChange}
                    rowsPerPage={prematchPageSize}
                    onRowsPerPageChange={handlePrematchPageSizeChange}
                    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                    labelRowsPerPage="Matches per page"
                  />
                </Box>
              )}
            </Card>
          </>
        )}

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