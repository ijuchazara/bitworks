'use client';

import React, { useEffect, useState } from 'react';
import type { User } from '../../../types/user';
import type { Client } from '../../../types/client';
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
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    client_id: '',
    status: 'Activo',
  });
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeUserForMenu, setActiveUserForMenu] = useState<User | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      throw new Error('Failed to fetch users.');
    }
  };

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchClients()]);
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
    setNewUser({ username: '', client_id: '', status: 'Activo' });
    setCreateError(null);
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser({ ...user });
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveUserForMenu(user);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveUserForMenu(null);
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
    if (!editingUser) return;
    setEditError(null);
    try {
      const body: { status: string } = {
        status: editingUser.status,
      };

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedUser: User = await response.json();
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
      showNotification('User updated successfully!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('An unexpected error occurred.');
      }
      showNotification(editError || 'Error updating user.', 'error');
      console.error('Error updating user:', err);
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, client_id: Number(newUser.client_id) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const createdUser: User = await response.json();
      setUsers(prevUsers => [...prevUsers, createdUser]);
      showNotification('User created successfully!', 'success');
      setCreateModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('An unexpected error occurred.');
      }
      showNotification(createError || 'Error creating user.', 'error');
      console.error('Error creating user:', err);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete user.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      showNotification('User deleted successfully!', 'success');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while deleting.');
      }
      showNotification(error || 'Error deleting user.', 'error');
      console.error('Error deleting user:', err);
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  if (loading) {
    return <Typography>Loading users...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box sx={{ py: 2, px: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Stack spacing={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Users List"
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
            {users.length === 0 ? (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No users found.
                </Typography>
              </Box>
            ) : (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 2.0 }}>Username</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Client Name</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Status</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Created At</TableCell>
                    <TableCell sx={{ py: 2.0 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(user => (
                    <TableRow
                      hover
                      key={user.id}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: 'background.paper' },
                        '&:nth-of-type(even)': { backgroundColor: 'action.hover' },
                      }}
                    >
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.client_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          color={user.status === 'Activo' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={(event) => handleMenuOpen(event, user)}>
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
            count={users.length}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25]}
          />
        </Card>
      </Stack>
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (activeUserForMenu) handleOpenEditModal(activeUserForMenu);
            handleMenuClose();
          }}
        >
          <ListItemIcon><PencilIcon width={20} /></ListItemIcon>
          <Typography variant="inherit">Edit</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeUserForMenu) handleOpenDeleteDialog(activeUserForMenu);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><TrashIcon width={20} /></ListItemIcon>
          <Typography variant="inherit">Delete</Typography>
        </MenuItem>
      </Menu>
      <Dialog open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {createError && <Typography color="error" variant="body2">{createError}</Typography>}
            <TextField autoFocus required margin="dense" label="Username" type="text" fullWidth value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
            <TextField required select margin="dense" label="Client" fullWidth value={newUser.client_id} onChange={(e) => setNewUser({ ...newUser, client_id: e.target.value })}>
              {clients.map((client) => (<MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
      {editingUser && (
        <Dialog open={isEditModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {editError && <Typography color="error" variant="body2">{editError}</Typography>}
              <TextField disabled margin="dense" label="Username" type="text" fullWidth value={editingUser.username} />
              <TextField required select margin="dense" label="Status" fullWidth value={editingUser.status} onChange={(e) => setEditingUser(prev => (prev ? { ...prev, status: e.target.value as 'Activo' | 'Inactivo' } : null))}>
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
      <Dialog open={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.username}"? This action cannot be undone.
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
