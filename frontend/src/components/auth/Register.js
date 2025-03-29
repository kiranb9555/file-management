import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validateUsername = (username) => {
    if (!username) {
      return 'Username is required';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== formData.password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Immediate validation
    switch (name) {
      case 'email':
        setErrors(prev => ({
          ...prev,
          email: validateEmail(value)
        }));
        break;
      case 'username':
        setErrors(prev => ({
          ...prev,
          username: validateUsername(value)
        }));
        break;
      case 'password':
        setErrors(prev => ({
          ...prev,
          password: validatePassword(value),
          // Also validate confirm password when password changes
          confirmPassword: formData.confirmPassword ? 
            validateConfirmPassword(formData.confirmPassword) : ''
        }));
        break;
      case 'confirmPassword':
        setErrors(prev => ({
          ...prev,
          confirmPassword: validateConfirmPassword(value)
        }));
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError('');
    setErrors({
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
    
    // Validate fields
    const emailError = validateEmail(formData.email);
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = formData.password !== formData.confirmPassword ? 
      'Passwords do not match' : '';

    if (emailError || usernameError || passwordError || confirmPasswordError) {
      setErrors({
        email: emailError,
        username: usernameError,
        password: passwordError,
        confirmPassword: confirmPasswordError
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Registering with data:', {
        email: formData.email,
        username: formData.username,
        password: formData.password
      });

      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      
      setSuccessMessage('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data) {
        // Handle specific field errors from the backend
        const backendErrors = err.response.data;
        const newErrors = { ...errors };
        
        Object.entries(backendErrors).forEach(([field, messages]) => {
          const errorMessage = Array.isArray(messages) ? messages[0] : messages;
          if (field === 'email') newErrors.email = errorMessage;
          if (field === 'username') newErrors.username = errorMessage;
          if (field === 'password') newErrors.password = errorMessage;
          if (field === 'non_field_errors') setSubmitError(errorMessage);
        });
        
        setErrors(newErrors);
      } else {
        setSubmitError(err.message || 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign Up
          </Typography>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              onBlur={() => {
                setErrors(prev => ({
                  ...prev,
                  email: validateEmail(formData.email)
                }));
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              onBlur={() => {
                setErrors(prev => ({
                  ...prev,
                  username: validateUsername(formData.username)
                }));
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              onBlur={() => {
                setErrors(prev => ({
                  ...prev,
                  password: validatePassword(formData.password)
                }));
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              onBlur={() => {
                setErrors(prev => ({
                  ...prev,
                  confirmPassword: validateConfirmPassword(formData.confirmPassword)
                }));
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || Object.values(errors).some(error => !!error)}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 