'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  TablePagination,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
} from 'recharts';

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
  commonSubscriptions: Array<{ channel_id: string; channel_name: string }>;
}

interface AnalyticsSnapshot {
  timestamp: string;
  total_users: number;
  active_users_24h: number;
  avg_subscriptions_per_user: number;
  total_prematches: number;
  avg_prematches_per_user: number;
  avg_relevancy_score: number;
  prematch_distribution: {
    [key: string]: number;  // relevancy score ranges
  };
  calculation_time_ms: number;
  cache_hit_ratio: number;
  queue_length: number;
  successful_matches_24h: number;
  skip_ratio_24h: number;
  popular_channels: Array<{
    channel_id: string;
    channel_name: string;
    count: number;
  }>;
  matching_param_distribution: {
    [key: string]: number;
  };
}

interface TestData {
  summary: {
    totalUsers: number;
    totalSubscriptions: number;
    totalPrematches: number;
  };
  users: User[];
  prematches: Prematch[];
  redis: {
    status: string;
    sampleCacheData: string;
  };
  analytics: {
    current: AnalyticsSnapshot;
    historical: AnalyticsSnapshot[];
  };
}

// Add this helper function to format chart data
const formatChartData = (data: AnalyticsSnapshot[]) => {
  return data.map(item => ({
    name: new Date(item.timestamp).toLocaleDateString(),
    processingTime: item.calculation_time_ms,
    cacheHitRatio: Number((item.cache_hit_ratio * 100).toFixed(2)),
    queueLength: item.queue_length
  })).reverse(); // Show oldest to newest
};

const formatDistributionData = (distribution: { [key: string]: number }) => {
  return Object.entries(distribution).map(([range, value]) => ({
    range,
    count: value
  }));
};

export default function PrematchTestPage() {
  const [data, setData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add the same pagination constants and state
  const DEFAULT_PAGE_SIZE = 10;
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [prematchPage, setPrematchPage] = useState(0);
  const [prematchPageSize, setPrematchPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prematch/test');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    }
    setLoading(false);
  };

  const triggerPrematch = async () => {
    try {
      await fetch('/api/prematch/calculate', { method: 'POST' });
      setTimeout(fetchData, 2000); // Refresh data after 2 seconds
    } catch (err) {
      setError('Failed to trigger prematch calculation');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add the same pagination handlers
  const handleUserPageChange = (event: unknown, newPage: number) => {
    console.log('User page change:', { currentPage: userPage, newPage });
    setUserPage(newPage);
  };

  const handleUserPageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUserPageSize(parseInt(event.target.value, 10));
    setUserPage(0);
  };

  const handlePrematchPageChange = (event: unknown, newPage: number) => {
    console.log('Prematch page change:', { currentPage: prematchPage, newPage });
    setPrematchPage(newPage);
  };

  const handlePrematchPageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPrematchPageSize(parseInt(event.target.value, 10));
    setPrematchPage(0);
  };

  // Add getPaginatedUsers function
  const getPaginatedUsers = () => {
    if (!data?.users) return [];
    const start = userPage * userPageSize;
    const end = Math.min(start + userPageSize, data.users.length);
    const paginatedData = data.users.slice(start, end);
    console.log('Users pagination:', { 
      start, 
      end, 
      pageSize: userPageSize, 
      resultCount: paginatedData.length 
    });
    return paginatedData;
  };

  // Add getPaginatedPrematches function
  const getPaginatedPrematches = () => {
    if (!data?.prematches) return [];
    const start = prematchPage * prematchPageSize;
    const end = Math.min(start + prematchPageSize, data.prematches.length);
    const paginatedData = data.prematches.slice(start, end);
    console.log('Prematches pagination:', { 
      start, 
      end, 
      pageSize: prematchPageSize, 
      resultCount: paginatedData.length 
    });
    return paginatedData;
  };

  // Add a helper function to check if analytics data exists
  const hasAnalytics = (data: TestData | null): boolean => {
    return !!(data?.analytics?.current && data?.analytics?.historical);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Prematch Test Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box mb={4}>
        <Button variant="contained" onClick={triggerPrematch} sx={{ mr: 2 }}>
          Trigger Prematch
        </Button>
        <Button variant="outlined" onClick={fetchData}>
          Refresh Data
        </Button>
      </Box>

      {data && (
        <>
          {/* Add debug logs here where we know data exists */}
          {hasAnalytics(data) && (
            <>
              {console.log('Historical Data for Chart:', formatChartData(data.analytics.historical))}
              {console.log('Distribution Data for Chart:', data.analytics.current?.prematch_distribution)}
            </>
          )}

          {/* Summary Card - Updated to use current analytics data */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography color="text.secondary">Total Users</Typography>
                  <Typography variant="h4">{data.summary.totalUsers}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active: {data.analytics.current?.active_users_24h || 0}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography color="text.secondary">Total Subscriptions</Typography>
                  <Typography variant="h4">{data.summary.totalSubscriptions}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg per user: {(data.analytics.current?.avg_subscriptions_per_user || 0).toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography color="text.secondary">Total Prematches</Typography>
                  <Typography variant="h4">{data.summary.totalPrematches}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg per user: {(data.analytics.current?.avg_prematches_per_user || 0).toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography color="text.secondary">Avg Relevancy</Typography>
                  <Typography variant="h4">
                    {(data.analytics.current?.avg_relevancy_score || 0).toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Skip rate: {((data.analytics.current?.skip_ratio_24h || 0) * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

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

          {/* Analytics Dashboard - Updated with more detailed metrics */}
          {data && hasAnalytics(data) ? (
            <>
              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Analytics Dashboard
              </Typography>

              <Grid container spacing={3}>
                {/* Performance Metrics Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">System Performance</Typography>
                      <Box sx={{ width: '100%', height: 300 }}>
                        {data.analytics.historical && data.analytics.historical.length > 0 ? (
                          <ResponsiveContainer>
                            <LineChart
                              data={formatChartData(data.analytics.historical)}
                              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval={Math.ceil(data.analytics.historical.length / 10)}
                              />
                              <YAxis 
                                yAxisId="left"
                                orientation="left"
                                label={{ value: 'Processing Time (ms)', angle: -90, position: 'insideLeft' }}
                              />
                              <YAxis 
                                yAxisId="right"
                                orientation="right"
                                label={{ value: 'Cache Hit Ratio (%)', angle: 90, position: 'insideRight' }}
                              />
                              <Tooltip />
                              <Legend verticalAlign="top" height={36}/>
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="processingTime"
                                name="Processing Time"
                                stroke="#8884d8"
                                dot={false}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cacheHitRatio"
                                name="Cache Hit %"
                                stroke="#82ca9d"
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Typography color="text.secondary">
                              No historical performance data available
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Prematch Distribution Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Prematch Score Distribution</Typography>
                      <Box sx={{ width: '100%', height: 300 }}>
                        {data.analytics.current?.prematch_distribution ? (
                          <ResponsiveContainer>
                            <BarChart
                              data={formatDistributionData(data.analytics.current.prematch_distribution)}
                              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="range"
                                angle={0}
                                interval={0}
                                label={{ value: 'Score Range', position: 'insideBottom', offset: -15 }}
                              />
                              <YAxis
                                label={{ value: 'Number of Prematches', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip />
                              <Bar 
                                dataKey="count" 
                                fill="#8884d8" 
                                name="Prematches"
                                label={{ position: 'top' }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Typography color="text.secondary">
                              No distribution data available
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* User Engagement Card - Updated with more metrics */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">User Engagement Metrics</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Active Users (24h)</Typography>
                          <Typography variant="h4">
                            {data.analytics.current.active_users_24h || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {((data.analytics.current.active_users_24h / data.summary.totalUsers) * 100).toFixed(1)}% of total
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Successful Matches (24h)</Typography>
                          <Typography variant="h4">
                            {data.analytics.current?.successful_matches_24h || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {((data.analytics.current?.successful_matches_24h || 0) / 
                              (data.analytics.current?.active_users_24h || 1)).toFixed(1)} per active user
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Skip Rate (24h)</Typography>
                          <Typography variant="h4">
                            {((data.analytics.current.skip_ratio_24h || 0) * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Avg Match Score</Typography>
                          <Typography variant="h4">
                            {(data.analytics.current.avg_relevancy_score || 0).toFixed(1)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Popular Channels Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Top Common Channels in Matches</Typography>
                      {data.analytics.current.popular_channels.length > 0 ? (
                        <List>
                          {data.analytics.current.popular_channels.slice(0, 5).map((channel) => (
                            <ListItem key={channel.channel_id}>
                              <ListItemText
                                primary={channel.channel_name}
                                secondary={`${channel.count} matches`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          No channel data available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            data && (
              <Box mt={4}>
                <Alert severity="info">
                  Analytics data is not available yet. Please wait for the first analytics snapshot to be generated.
                </Alert>
              </Box>
            )
          )}
          
          {/* Redis Status */}
          <Box mt={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Redis Status: {data.redis.status}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Cache Data: {data.redis.sampleCacheData}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
} 