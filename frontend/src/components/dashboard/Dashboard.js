import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Remove any auth headers for public access
      const response = await axios.get(`${API_URL}/files/dashboard-stats/`);
      console.log('Dashboard stats:', response.data);
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        File Management Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Files
              </Typography>
              <Typography variant="h3">
                {stats?.total_files || 0}
              </Typography>
              <Typography color="textSecondary">
                Recent uploads: {stats?.recent_uploads || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* File Types Distribution */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Types Distribution
              </Typography>
              <Grid container spacing={2}>
                {stats?.file_types?.map((type) => (
                  <Grid item xs={6} key={type.type}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">{type.type}</Typography>
                      <Typography variant="h4">{type.count}</Typography>
                      <Typography color="textSecondary">files</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* User Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Statistics
              </Typography>
              <List>
                {stats?.user_stats?.map((user) => (
                  <ListItem key={user.email} divider>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {user.username || user.email}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography component="span" variant="body2" color="textSecondary">
                            Total Files: {user.file_count} | Recent Uploads: {user.recent_uploads}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 