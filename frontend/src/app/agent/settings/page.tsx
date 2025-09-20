'use client';

import React, { useEffect, useState } from 'react';
import type { Setting } from '../../../types/setting';
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
  CardActions,
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
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: '',
  });
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSettingForMenu, setActiveSettingForMenu] = useState<Setting | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const router = useRouter();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Setting[] = await response.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to fetch settings.');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOpenCreateModal = () => {
    setNewSetting({ key: '', value: '', description: '' }); // Reset form
    setCreateError(null); // Clear previous errors
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (setting: Setting) => {
    setEditingSetting({ ...setting }); // Create a copy to avoid editing the state directly
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, setting: Setting) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveSettingForMenu(setting);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveSettingForMenu(null);
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
    if (!editingSetting) return;

    setEditError(null);
    try {
      const response = await fetch(`/api/settings/${editingSetting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: editingSetting.value,
          description: editingSetting.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedSetting: Setting = await response.json();
      setSettings(prev => prev.map(s => (s.id === updatedSetting.id ? updatedSetting : s)));
      showNotification('Setting updated successfully!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('An unexpected error occurred.');
      }
      showNotification(editError || 'Error updating setting.', 'error');
      console.error('Error updating setting:', err);
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSetting),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const createdSetting: Setting = await response.json();
      setSettings(prevSettings => [...prevSettings, createdSetting]);
      showNotification('Setting created successfully!', 'success');
      setCreateModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('An unexpected error occurred.');
      }
      showNotification(createError || 'Error creating setting.', 'error');
      console.error('Error creating setting:', err);
    }
  };

  const handleOpenDeleteDialog = (setting: Setting) => {
    setSettingToDelete(setting);
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!settingToDelete) return;

    try {
      const response = await fetch(`/api/settings/${settingToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete setting.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setSettings(prevSettings => prevSettings.filter(s => s.id !== settingToDelete.id));
      showNotification('Setting deleted successfully!', 'success');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while deleting.');
      }
      showNotification(error || 'Error deleting setting.', 'error');
      console.error('Error deleting setting:', err);
    } finally {
      setDeleteModalOpen(false);
      setSettingToDelete(null);
    }
  };

  if (loading) {
    return <Typography>Loading settings...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ py: 2, px: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Stack spacing={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Settings List"
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
          <Box sx={{ overflow: 'auto', flexGrow: 1, backgroundColor: 'grey.50' }}>
            {settings.length === 0 ? (
              <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No settings found.
                </Typography>
              </Box>
            ) : (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 2.0 }}>Key</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Value</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Description</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Updated At</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(setting => (
                    <TableRow
                      hover
                      key={setting.id}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'background.paper',
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>{setting.key}</TableCell>
                      <TableCell>{setting.value}</TableCell>
                      <TableCell>{setting.description || 'N/A'}</TableCell>
                      <TableCell>{new Date(setting.updated_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={(event) => handleMenuOpen(event, setting)}>
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
            count={settings.length}
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
            if (activeSettingForMenu) {
              handleOpenEditModal(activeSettingForMenu);
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
            if (activeSettingForMenu) {
              handleOpenDeleteDialog(activeSettingForMenu);
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
        <DialogTitle>Add New Setting</DialogTitle>
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
              value={newSetting.key}
              onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              value={newSetting.description}
              onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
            />
            <TextField
              required
              margin="dense"
              label="Value"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={newSetting.value}
              onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
      {editingSetting && (
        <Dialog open={isEditModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Setting</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {editError && (
                <Typography color="error" variant="body2">
                  {editError}
                </Typography>
              )}
              <TextField
                disabled
                margin="dense"
                label="Key"
                type="text"
                fullWidth
                value={editingSetting.key}
              />
              <TextField
                margin="dense"
                label="Description"
                type="text"
                fullWidth
                value={editingSetting.description}
                onChange={(e) =>
                  setEditingSetting(prev => (prev ? { ...prev, description: e.target.value } : null))
                }
              />
              <TextField
                required
                margin="dense"
                label="Value"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={editingSetting.value}
                onChange={(e) =>
                  setEditingSetting(prev => (prev ? { ...prev, value: e.target.value } : null))
                }
              />
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
            Are you sure you want to delete the setting "{settingToDelete?.key}"? This action cannot be undone.
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
