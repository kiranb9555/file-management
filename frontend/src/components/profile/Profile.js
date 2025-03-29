import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';

const Profile = () => {
  const { user, updateUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    phone_number: user?.phone_number || '',
    email: user?.email || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        await fetchProfileData();
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/users/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('Profile response:', response.data);
      setProfileData({
        username: response.data.username || '',
        phone_number: response.data.phone_number || '',
        email: response.data.email || '',
      });
      updateUser(response.data);  // Update the global user state
      setError(null);
    } catch (err) {
      console.error('Profile error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch profile data';
      setError(errorMessage);
      if (err.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/addresses/');
      setAddresses(response.data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleOpenDialog = (address = null) => {
    if (address) {
      setAddressForm(address);
      setEditingAddress(address.id);
    } else {
      setAddressForm({
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false
      });
      setEditingAddress(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAddress(null);
  };

  const handleSubmitAddress = async () => {
    try {
      if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.country || !addressForm.postal_code) {
        setError('Please fill in all address fields');
        return;
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (editingAddress) {
        await axios.put(
          `http://localhost:5000/api/addresses/${editingAddress}/`, 
          addressForm,
          config
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/addresses/', 
          addressForm,
          config
        );
      }
      fetchAddresses();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err.response?.data?.detail || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/addresses/${addressId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchAddresses();
      setError(null);
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Failed to delete address');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setError(null);
      setErrorMessage(null);
      
      // Validate username
      if (!profileData.username) {
        setErrorMessage('Username is required');
        return;
      }
      if (profileData.username.length < 3) {
        setErrorMessage('Username must be at least 3 characters long');
        return;
      }

      const updatedData = {
        username: profileData.username.trim(),
        phone_number: profileData.phone_number?.trim() || '',
      };

      console.log('Sending profile update:', updatedData);

      const response = await updateProfile(updatedData);
      
      // Update both local and global state
      setProfileData(prev => ({
        ...prev,
        ...response,
      }));
      updateUser(response);
      
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMsg = err.details?.username || 
                      err.details?.error || 
                      err.error || 
                      'Failed to update profile';
      setErrorMessage(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        phone_number: user.phone_number || '',
        email: user.email || '',
      });
    }
  }, [user]);

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
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Profile Information</Typography>
        {isEditing ? (
          <Box component="form">
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Phone Number"
              value={profileData.phone_number}
              onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
            />
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleProfileUpdate} sx={{ mr: 1 }}>
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography>Username: {user?.username}</Typography>
            <Typography>Email: {user?.email}</Typography>
            <Typography>Phone: {user?.phone_number || 'Not set'}</Typography>
            <Button
              variant="outlined"
              onClick={() => setIsEditing(true)}
              sx={{ mt: 2 }}
            >
              Edit Profile
            </Button>
          </>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Profile Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemText 
                  primary="Email"
                  secondary={profileData?.email || user?.email || 'Not available'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Name"
                  secondary={profileData?.name || user?.name || 'Not available'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Member Since"
                  secondary={profileData?.date_joined ? 
                    new Date(profileData.date_joined).toLocaleDateString() : 
                    'Not available'
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                Addresses
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => handleOpenDialog()}
              >
                Add Address
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {addresses.map((address) => (
                <ListItem key={address.id}>
                  <ListItemText
                    primary={address.street}
                    secondary={`${address.city}, ${address.state} ${address.postal_code}, ${address.country}`}
                  />
                  <Box>
                    {address.is_default && (
                      <Typography variant="caption" color="primary" sx={{ mr: 2 }}>
                        Default
                      </Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(address)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Street"
              value={addressForm.street}
              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="City"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="State"
              value={addressForm.state}
              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Postal Code"
              value={addressForm.postal_code}
              onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Country"
              value={addressForm.country}
              onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                />
              }
              label="Set as default address"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmitAddress} variant="contained">
            {editingAddress ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 