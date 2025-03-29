import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { API_URL } from '../../config';

const AddressManager = () => {
  const [addresses, setAddresses] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    is_default: false,
  });

  // Fetch addresses when component mounts
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/addresses/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      setAddresses(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
    setEditingAddress(null);
    setFormData({
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      is_default: false,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleEdit = (address) => {
    setEditingAddress(address.id);
    setFormData({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (editingAddress) {
        await axios.put(
          `${API_URL}/addresses/${editingAddress}/`, 
          formData,
          { headers }
        );
      } else {
        await axios.post(
          `${API_URL}/addresses/`, 
          formData,
          { headers }
        );
      }
      await fetchAddresses(); // Fetch updated list
      handleClose();
      setError(null);
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err.response?.data?.detail || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/addresses/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      await fetchAddresses(); // Fetch updated list
      setError(null);
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Failed to delete address');
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_default' ? checked : value
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <Typography>Loading addresses...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Addresses</Typography>
        <Button variant="contained" color="primary" onClick={handleClickOpen}>
          Add New Address
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {addresses.length === 0 ? (
        <Typography color="textSecondary">
          No addresses found. Click 'Add New Address' to add one.
        </Typography>
      ) : (
        <List>
          {addresses.map((address) => (
            <ListItem
              key={address.id}
              divider
              secondaryAction={
                <Box>
                  <IconButton edge="end" onClick={() => handleEdit(address)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(address.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography>{address.street}</Typography>
                    {address.is_default && (
                      <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                        (Default)
                      </Typography>
                    )}
                  </Box>
                }
                secondary={`${address.city}, ${address.state}, ${address.country} ${address.postal_code}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              name="street"
              label="Street Address"
              value={formData.street}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              name="state"
              label="State"
              value={formData.state}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              name="country"
              label="Country"
              value={formData.country}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              name="postal_code"
              label="Postal Code"
              value={formData.postal_code}
              onChange={handleChange}
              required
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_default}
                  onChange={handleChange}
                  name="is_default"
                />
              }
              label="Set as default address"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingAddress ? 'Update' : 'Add'} Address
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddressManager; 