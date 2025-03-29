import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';

const getFileTypeColor = (fileType) => {
  const type = fileType.toLowerCase();
  switch (type) {
    case 'pdf':
      return 'error.main';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'success.main';
    case 'txt':
      return 'info.main';
    case 'doc':
    case 'docx':
      return 'primary.main';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return 'warning.main';
    case 'zip':
    case 'rar':
    case '7z':
      return 'secondary.main';
    default:
      return 'text.primary';
  }
};

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'filename', headerName: 'File Name', width: 200 },
    { 
      field: 'file_type', 
      headerName: 'Type', 
      width: 100,
      renderCell: (params) => (
        <Typography
          sx={{
            color: getFileTypeColor(params.value),
            fontWeight: 'medium'
          }}
        >
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'file_size', 
      headerName: 'Size', 
      width: 130,
      valueFormatter: (params) => {
        const bytes = parseInt(params.value);
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      }
    },
    { 
      field: 'upload_date', 
      headerName: 'Upload Date', 
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleDownload(params.row.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  useEffect(() => {
    fetchFiles();
    const token = localStorage.getItem('token');
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/files/');
      const fileData = response.data.results || response.data;
      const formattedFiles = Array.isArray(fileData) ? fileData.map(file => ({
        id: file.id,
        filename: file.filename,
        file_type: file.file_type,
        file_size: file.file_size,
        upload_date: file.upload_date,
      })) : [];
      setFiles(formattedFiles);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to fetch files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError(null);
    try {
      await axios.post('http://localhost:5000/api/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      fetchFiles();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/files/${fileId}/download/`,
        { 
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const file = files.find(f => f.id === fileId);
      link.setAttribute('download', file ? file.filename : 'download');
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Files</Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={uploading}
          >
            Upload File
            <input
              type="file"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {uploading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}

        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={files}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
          />
        </div>
      </Paper>
    </Container>
  );
};

export default FileList; 