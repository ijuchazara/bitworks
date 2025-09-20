'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { Attribute } from '../../../types/attribute';
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
  Snackbar,
} from '@mui/material';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import PencilIcon from '@heroicons/react/24/solid/PencilIcon';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';
import EllipsisVerticalIcon from '@heroicons/react/24/solid/EllipsisVerticalIcon';
import { useRouter } from 'next/navigation';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

interface AttributeDetail extends Attribute {
  client_name: string;
  template_description: string;
  template_data_type: string;
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<AttributeDetail[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newAttribute, setNewAttribute] = useState({
    client_id: '',
    template_id: '',
    value: '',
  });

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeDetail | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeAttributeForMenu, setActiveAttributeForMenu] = useState<AttributeDetail | null>(null);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<AttributeDetail | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [attributesRes, clientsRes, templatesRes] = await Promise.all([
          fetch('/api/attributes').catch(() => {
            console.warn('/api/attributes endpoint does not exist yet.');
            return { ok: true, json: () => Promise.resolve([]) };
          }),
          fetch('/api/clients'),
          fetch('/api/templates'),
        ]);

        if (!attributesRes.ok || !clientsRes.ok || !templatesRes.ok) {
          throw new Error('Failed to fetch initial data.');
        }

        const attributesData = await attributesRes.json();
        const clientsData = await clientsRes.json();
        const templatesData = await templatesRes.json();

        setAttributes(attributesData);
        setClients(clientsData);
        setTemplates(templatesData);
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
    setNewAttribute({ client_id: '', template_id: '', value: '' });
    setCreateError(null);
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (attribute: AttributeDetail) => {
    setEditingAttribute(attribute);
    setEditValue(attribute.value);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, attribute: AttributeDetail) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveAttributeForMenu(attribute);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveAttributeForMenu(null);
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

  const renderAttributeInput = (dataType: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    const commonProps = {
      fullWidth: true,
      margin: 'dense' as const,
      label: 'Value',
      value,
      onChange,
    };

    switch (dataType) {
      case 'type_number':
        return <TextField {...commonProps} type="number" />;
      case 'type_decimal':
        return <TextField {...commonProps} type="number" inputProps={{ step: '0.01' }} />;
      case 'type_date':
        return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} />;
      case 'type_datetime':
        return <TextField {...commonProps} type="datetime-local" InputLabelProps={{ shrink: true }} />;
      case 'type_text':
        return <TextField {...commonProps} multiline rows={4} />;
      case 'type_string':
      default:
        return <TextField {...commonProps} type="text" />;
    }
  };

  const selectedTemplateForCreate = useMemo(() => {
    return templates.find(t => t.id === Number(newAttribute.template_id));
  }, [newAttribute.template_id, templates]);

  const handleCreate = async () => {
    setCreateError(null);
    try {
      const response = await fetch('/api/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Number(newAttribute.client_id),
          template_id: Number(newAttribute.template_id),
          value: newAttribute.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const createdAttribute: AttributeDetail = await response.json();
      setAttributes(prev => [...prev, createdAttribute]);
      showNotification('Attribute created successfully!', 'success');
      setCreateModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('An unexpected error occurred.');
      }
      showNotification(createError || 'Error creating attribute.', 'error');
      console.error('Error creating attribute:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editingAttribute) return;
    setEditError(null);
    try {
      const response = await fetch(`/api/attributes/${editingAttribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const updatedAttribute: AttributeDetail = await response.json();
      setAttributes(prev => prev.map(attr => (attr.id === updatedAttribute.id ? updatedAttribute : attr)));
      showNotification('Attribute updated successfully!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('An unexpected error occurred.');
      }
      showNotification(editError || 'Error updating attribute.', 'error');
      console.error('Error updating attribute:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!attributeToDelete) return;
    try {
      const response = await fetch(`/api/attributes/${attributeToDelete.id}`, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete attribute.' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      setAttributes(prev => prev.filter(attr => attr.id !== attributeToDelete.id));
      showNotification('Attribute deleted successfully!', 'success');
      setDeleteModalOpen(false);
      setAttributeToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error deleting attribute:', err);
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
            title="Attributes Master List"
            action={
              <Button startIcon={<SvgIcon fontSize="small"><PlusIcon /></SvgIcon>} variant="contained" onClick={handleOpenCreateModal}>
                Add
              </Button>
            }
          />
          <Divider />
          <Box sx={{ overflow: 'auto', flexGrow: 1, backgroundColor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
            {attributes.length === 0 ? (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No attributes found.
                </Typography>
              </Box>
            ) : (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 2.0 }}>Client</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Attribute</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Value</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Updated At</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attributes
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(attr => (
                      <TableRow hover key={attr.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'background.paper' }, '&:nth-of-type(even)': { backgroundColor: 'action.hover' } }}>
                        <TableCell>{attr.client_name}</TableCell>
                        <TableCell>{attr.template_description}</TableCell>
                        <TableCell>{attr.value}</TableCell>
                        <TableCell>{new Date(attr.updated_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton onClick={(event) => handleMenuOpen(event, attr)}>
                            <SvgIcon fontSize="small"><EllipsisVerticalIcon /></SvgIcon>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </Box>
          <TablePagination component="div" count={attributes.length} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10, 25]} />
        </Card>
      </Stack>

      <Dialog open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Attribute</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {createError && <Typography color="error" variant="body2">{createError}</Typography>}
            <TextField required select margin="dense" label="Client" fullWidth value={newAttribute.client_id} onChange={(e) => setNewAttribute({ ...newAttribute, client_id: e.target.value })}>
              {clients.map((client) => (<MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>))}
            </TextField>
            <TextField required select margin="dense" label="Attribute Template" fullWidth value={newAttribute.template_id} onChange={(e) => setNewAttribute({ ...newAttribute, template_id: e.target.value, value: '' })}>
              {templates.map((template) => (<MenuItem key={template.id} value={template.id}>{template.description}</MenuItem>))}
            </TextField>
            {selectedTemplateForCreate ? (
              renderAttributeInput(selectedTemplateForCreate.data_type, newAttribute.value, (e) => setNewAttribute({ ...newAttribute, value: e.target.value }))
            ) : (
              <TextField
                disabled
                margin="dense"
                label="Value"
                fullWidth
                helperText="Select an attribute template first"
                value=""
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {editingAttribute && (
        <Dialog open={isEditModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Attribute</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {editError && <Typography color="error" variant="body2">{editError}</Typography>}
              <TextField disabled margin="dense" label="Client" fullWidth value={editingAttribute.client_name} />
              <TextField disabled margin="dense" label="Attribute" fullWidth value={editingAttribute.template_description} />
              {renderAttributeInput(editingAttribute.template_data_type, editValue, (e) => setEditValue(e.target.value))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      )}

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { if (activeAttributeForMenu) { handleOpenEditModal(activeAttributeForMenu); } handleMenuClose(); }}>
          <ListItemIcon><PencilIcon width={20} /></ListItemIcon>
          <Typography variant="inherit">Edit</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (activeAttributeForMenu) { setAttributeToDelete(activeAttributeForMenu); setDeleteModalOpen(true); } handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><TrashIcon width={20} /></ListItemIcon>
          <Typography variant="inherit">Delete</Typography>
        </MenuItem>
      </Menu>

      <Dialog open={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this attribute? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
