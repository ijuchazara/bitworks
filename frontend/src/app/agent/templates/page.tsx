'use client';

import React, { useEffect, useState } from 'react';
import type { Template } from '../../../types/template';
import {
  Box,
  Button,
  Stack,
  SvgIcon,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  Card,
  CardHeader,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
  Snackbar,
} from '@mui/material';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import PencilIcon from '@heroicons/react/24/solid/PencilIcon';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';
import EllipsisVerticalIcon from '@heroicons/react/24/solid/EllipsisVerticalIcon';
import { useRouter } from 'next/navigation';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

const dataTypeOptions = [
  { value: 'type_number', label: 'Numero entero' },
  { value: 'type_decimal', label: 'Numero decimal' },
  { value: 'type_date', label: 'Fecha' },
  { value: 'type_datetime', label: 'Fecha y hora' },
  { value: 'type_string', label: 'Texto simple' },
  { value: 'type_text', label: 'Texto largo' },
];

const getDataTypeLabel = (value: string) => {
  const option = dataTypeOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    key: '',
    description: '',
    data_type: '',
    status: 'Activo',
  });
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTemplateForMenu, setActiveTemplateForMenu] = useState<Template | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const router = useRouter();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Template[] = await response.json();
      setTemplates(data);
    } catch (err) {
      setError('Failed to fetch templates.');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreateModal = () => {
    setNewTemplate({ key: '', description: '', data_type: '', status: 'Activo' }); // Reset form
    setCreateError(null); // Clear previous errors
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (template: Template) => {
    setEditingTemplate({ ...template }); // Create a copy to avoid editing the state directly
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: Template) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveTemplateForMenu(template);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveTemplateForMenu(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    setEditError(null);
    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editingTemplate.description,
          data_type: editingTemplate.data_type,
          status: editingTemplate.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedTemplate: Template = await response.json();
      setTemplates(prev => prev.map(t => (t.id === updatedTemplate.id ? updatedTemplate : t)));
      showNotification('Template updated successfully!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('An unexpected error occurred.');
      }
      showNotification(editError || 'Error updating template.', 'error');
      console.error('Error updating template:', err);
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const createdTemplate: Template = await response.json();
      setTemplates(prevTemplates => [...prevTemplates, createdTemplate]);
      showNotification('Template created successfully!', 'success');
      setCreateModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('An unexpected error occurred.');
      }
      showNotification(createError || 'Error creating template.', 'error');
      console.error('Error creating template:', err);
    }
  };

  const handleOpenDeleteDialog = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete template.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateToDelete.id));
      showNotification('Template deleted successfully!', 'success');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while deleting.');
      }
      showNotification(error || 'Error deleting template.', 'error');
      console.error('Error deleting template:', err);
    } finally {
      setDeleteModalOpen(false);
      setTemplateToDelete(null);
    }
  };

  if (loading) {
    return <Typography>Loading templates...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ py: 2, px: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Stack spacing={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Templates List"
            action={
              <Button
                startIcon={
                  <SvgIcon fontSize="small">
                    <PlusIcon />
                  </SvgIcon>
                }
                variant="contained"
                onClick={handleOpenCreateModal}
              >
                Add
              </Button>
            }
          />
          <Divider />
          <Box sx={{ overflow: 'auto', flexGrow: 1, backgroundColor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
            {templates.length === 0 ? (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No templates found.
                </Typography>
              </Box>
            ) : (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 2.0 }}>Key</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Description</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Data Type</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Status</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(template => (
                    <TableRow
                      hover
                      key={template.id}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'background.paper',
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>{template.key}</TableCell>
                      <TableCell>{template.description || 'N/A'}</TableCell>
                      <TableCell>{getDataTypeLabel(template.data_type)}</TableCell>
                      <TableCell>
                        <Chip
                          label={template.status}
                          size="small"
                          color={template.status === 'Activo' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(event) => handleMenuOpen(event, template)}>
                          <SvgIcon fontSize="small">
                            <EllipsisVerticalIcon />
                          </SvgIcon>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
          <TablePagination
            component="div"
            count={templates.length}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25]}
          />
        </Card>
      </Stack>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (activeTemplateForMenu) {
              handleOpenEditModal(activeTemplateForMenu);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <PencilIcon width={20} />
          </ListItemIcon>
          <Typography variant="inherit">Edit</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeTemplateForMenu) {
              handleOpenDeleteDialog(activeTemplateForMenu);
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <TrashIcon width={20} />
          </ListItemIcon>
          <Typography variant="inherit">Delete</Typography>
        </MenuItem>
      </Menu>
      <Dialog open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {createError && (
              <Typography color="error" variant="body2">
                {createError}
              </Typography>
            )}
            <TextField
              autoFocus
              required
              margin="dense"
              label="Key"
              type="text"
              fullWidth
              value={newTemplate.key}
              onChange={(e) => setNewTemplate({ ...newTemplate, key: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            />
            <TextField
              required
              select
              margin="dense"
              label="Data Type"
              fullWidth
              value={newTemplate.data_type}
              onChange={(e) => setNewTemplate({ ...newTemplate, data_type: e.target.value })}
            >
              {dataTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              required
              select
              margin="dense"
              label="Status"
              fullWidth
              value={newTemplate.status}
              onChange={(e) => setNewTemplate({ ...newTemplate, status: e.target.value })}
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
      {editingTemplate && (
        <Dialog open={isEditModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Template</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {editError && (
                <Typography color="error" variant="body2">
                  {editError}
                </Typography>
              )}
              <TextField disabled margin="dense" label="Key" type="text" fullWidth value={editingTemplate.key} />
              <TextField
                margin="dense"
                label="Description"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={editingTemplate.description}
                onChange={(e) => setEditingTemplate(prev => (prev ? { ...prev, description: e.target.value } : null))}
              />
              <TextField
                required
                select
                margin="dense"
                label="Data Type"
                fullWidth
                value={editingTemplate.data_type}
                onChange={(e) => setEditingTemplate(prev => (prev ? { ...prev, data_type: e.target.value } : null))}
              >
                {dataTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                required
                select
                margin="dense"
                label="Status"
                fullWidth
                value={editingTemplate.status}
                onChange={(e) => setEditingTemplate(prev => (prev ? { ...prev, status: e.target.value } : null))}
              >
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Inactivo">Inactivo</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      )}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        aria-labelledby="confirm-delete-dialog-title"
        aria-describedby="confirm-delete-dialog-description"
      >
        <DialogTitle id="confirm-delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-dialog-description">
            Are you sure you want to delete the template "{templateToDelete?.key}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
