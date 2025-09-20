'use client';

import React, { useEffect, useState } from 'react';
import type { Client } from '../../../types/client';
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
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    client_code: '',
    name: '',
  });
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editTemplateValues, setEditTemplateValues] = useState<Record<string, string>>({});
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeClientForMenu, setActiveClientForMenu] = useState<Client | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const router = useRouter();

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Client[] = await response.json();
      setClients(data);
    } catch (err) {
      throw new Error('Failed to fetch clients.');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Template[] = await response.json();
      setTemplates(data);
    } catch (err) {
      throw new Error('Failed to fetch templates.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchClients(), fetchTemplates()]);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setNewClient({ client_code: '', name: '' }); // Reset form
    setTemplateValues({}); // Reset template values
    setCreateError(null); // Clear previous errors
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient({ ...client }); // Create a copy to avoid editing the state directly
    setEditTemplateValues({}); // Reset first to clear old data
    setEditError(null);
    setEditModalOpen(true);

    const fetchAttributes = async () => {
      try {
        const response = await fetch(`/api/clients/${client.id}/attributes`);
        if (!response.ok) {
          throw new Error('Failed to fetch client attributes.');
        }
        const attributes: { template_key: string; value: string }[] = await response.json();

        const attributeValues = attributes.reduce((acc, attr) => {
          acc[attr.template_key] = attr.value;
          return acc;
        }, {} as Record<string, string>);

        setEditTemplateValues(attributeValues);
      } catch (err) {
        console.error('Error fetching attributes:', err);
        setEditError('Could not load client attributes.');
      }
    };

    fetchAttributes();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, client: Client) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveClientForMenu(client);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveClientForMenu(null);
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

  const handleTemplateValueChange = (templateKey: string, value: string) => {
    setTemplateValues(prev => ({ ...prev, [templateKey]: value }));
  };

  const handleEditTemplateValueChange = (templateKey: string, value: string) => {
    setEditTemplateValues(prev => ({ ...prev, [templateKey]: value }));
  };

  const renderAttributeInput = (template: Template, currentValues: Record<string, string>, valueChangeHandler: (key: string, value: string) => void) => {
    const value = currentValues[template.key] || '';
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => valueChangeHandler(template.key, e.target.value);
    const commonProps = {
      fullWidth: true,
      variant: 'standard' as const,
      value,
      onChange,
      InputProps: { disableUnderline: true },
    };

    switch (template.data_type) {
      case 'type_number':
        return <TextField {...commonProps} type="number" />;
      case 'type_decimal':
        return <TextField {...commonProps} type="number" inputProps={{ step: '0.01' }} />;
      case 'type_date':
        return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} />;
      case 'type_datetime':
        return <TextField {...commonProps} type="datetime-local" InputLabelProps={{ shrink: true }} />;
      case 'type_text':
        return <TextField {...commonProps} multiline rows={2} />;
      case 'type_string':
      default:
        return <TextField {...commonProps} type="text" />;
    }
  };

  const handleUpdate = async () => {
    if (!editingClient) return;

    setEditError(null);
    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingClient.name,
          status: editingClient.status,
          attributes: editTemplateValues,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedClient: Client = await response.json();
      setClients(prev => prev.map(c => (c.id === updatedClient.id ? updatedClient : c)));
      showNotification('Client updated successfully!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('An unexpected error occurred.');
      }
      showNotification(editError || 'Error updating client.', 'error');
      console.error('Error updating client:', err);
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newClient, attributes: templateValues }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const createdClient: Client = await response.json();
      setClients(prevClients => [...prevClients, createdClient]);
      showNotification('Client created successfully!', 'success');
      setCreateModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('An unexpected error occurred.');
      }
      showNotification(createError || 'Error creating client.', 'error');
      console.error('Error creating client:', err);
    }
  };

  const handleOpenDeleteDialog = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete client.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
      showNotification('Client deleted successfully!', 'success');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while deleting.');
      }
      showNotification(error || 'Error deleting client.', 'error');
      console.error('Error deleting client:', err);
    } finally {
      setDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box sx={{ py: 2, px: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Stack spacing={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Clients List"
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
            {clients.length === 0 ? (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No clients found.
                </Typography>
              </Box>
            ) : (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 2.0 }}>Client Code</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Name</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Status</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Created At</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(client => (
                    <TableRow
                      hover
                      key={client.id}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'background.paper',
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>{client.client_code}</TableCell>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={client.status}
                          size="small"
                          color={client.status === 'Activo' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{new Date(client.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={(event) => handleMenuOpen(event, client)}>
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
            count={clients.length}
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
            if (activeClientForMenu) {
              handleOpenEditModal(activeClientForMenu);
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
            if (activeClientForMenu) {
              handleOpenDeleteDialog(activeClientForMenu);
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
      <Dialog open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Add New Client</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {createError && <Typography color="error" variant="body2">{createError}</Typography>}
            <TextField
              autoFocus
              required
              margin="dense"
              label="Client Code"
              type="text"
              fullWidth
              value={newClient.client_code}
              onChange={(e) => setNewClient({ ...newClient, client_code: e.target.value })}
            />
            <TextField
              required
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            />
            <Divider sx={{ my: 2 }}>
              <Chip label="Attributes" />
            </Divider>
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Attribute</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{template.description}</TableCell>
                      <TableCell>
                        {renderAttributeInput(template, templateValues, handleTemplateValueChange)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
      {editingClient && (
        <Dialog open={isEditModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>Edit Client</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {editError && (
                <Typography color="error" variant="body2">
                  {editError}
                </Typography>
              )}
              <TextField disabled margin="dense" label="Client Code" type="text" fullWidth value={editingClient.client_code} />
              <TextField
                required
                margin="dense"
                label="Name"
                type="text"
                fullWidth
                value={editingClient.name}
                onChange={(e) => setEditingClient(prev => (prev ? { ...prev, name: e.target.value } : null))}
              />
              <TextField
                required
                select
                margin="dense"
                label="Status"
                fullWidth
                value={editingClient.status}
                onChange={(e) => setEditingClient(prev => (prev ? { ...prev, status: e.target.value } : null))}
              >
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Inactivo">Inactivo</MenuItem>
              </TextField>
              <Divider sx={{ my: 2 }}>
                <Chip label="Attributes" />
              </Divider>
              <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Attribute</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{template.description}</TableCell>
                        <TableCell>
                          {renderAttributeInput(template, editTemplateValues, handleEditTemplateValueChange)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
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
            Are you sure you want to delete the client "{clientToDelete?.name}"? This action cannot be undone.
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
