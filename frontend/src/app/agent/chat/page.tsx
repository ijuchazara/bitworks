'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Card,
  CardHeader,
  Divider,
  Menu,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { PaperPlaneTilt as PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';

// Tipos de datos
interface Client {
  id: number;
  client_code: string;
  name: string;
  status: string;
}

interface User {
  id: number;
  username: string;
}

interface Message {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatUser {
  user_id: number;
  username: string;
  client_code: string;
  client_name: string;
  conversation_id: string;
  messages: Message[];
}

const AGENT_PORT = process.env.NEXT_PUBLIC_AGENT_PORT || '8001';

export default function ChatPage() {
  const theme = useTheme();

  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [usersForClient, setUsersForClient] = useState<User[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isUserMenuOpen = Boolean(userMenuAnchorEl);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) throw new Error('Error al cargar la lista de clientes');
        const data: Client[] = await response.json();
        setClients(data.filter((c) => c.status === 'Activo'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Un error inesperado ocurrió');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      const fetchUsers = async () => {
        try {
          const response = await fetch(`/api/clients/${selectedClient.client_code}/users`);
          if (!response.ok) throw new Error('Error al cargar los usuarios del cliente');
          const data: User[] = await response.json();
          setUsersForClient(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Un error inesperado ocurrió');
        }
      };
      fetchUsers();
    } else {
      setUsersForClient([]);
    }
    setSelectedUsername('');
  }, [selectedClient]);

  useEffect(() => {
    if (!chatUser) return;
    const wsUrl = `ws://localhost:${AGENT_PORT}/ws/${chatUser.user_id}`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('WebSocket connection established');
    ws.onmessage = (event) => {
      setIsTyping(false);
      try {
        const newMessage = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } catch (e) {
        if (event.data === 'new_message') {
          console.log('User message processed by agent.');
        }
      }
    };
    ws.onclose = () => console.log('WebSocket connection closed');
    ws.onerror = (error) => console.error('WebSocket error:', error);
    return () => ws.close();
  }, [chatUser]);

  const initializeUser = async () => {
    if (!selectedClient || !selectedUsername.trim()) {
      setError('Debe seleccionar un cliente y un nombre de usuario.');
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/api/load_conversation?username=${selectedUsername}&client_code=${selectedClient.client_code}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error al cargar la conversación' }));
        throw new Error(errorData.detail);
      }
      const data: ChatUser = await response.json();
      setChatUser(data);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Un error inesperado ocurrió');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !chatUser?.username) return;
    const tempMessage: Message = { id: Date.now(), role: 'user', content: messageText };
    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    const currentMessage = messageText;
    setMessageText('');
    setIsTyping(true);
    try {
      const response = await fetch(`http://localhost:${AGENT_PORT}/question?username=${chatUser.username}&client_code=${chatUser.client_code}&texto=${encodeURIComponent(currentMessage)}`);
      if (!response.ok) throw new Error('Error al enviar el mensaje');
    } catch (error) {
      setIsTyping(false);
      setError('Error al enviar el mensaje al agente.');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const changeUser = () => {
    setChatUser(null);
    setMessages([]);
    setSelectedClient(null);
    setSelectedUsername('');
    setIsNewUser(false);
    setError(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleChangeUser = () => {
    changeUser();
    handleUserMenuClose();
  };

  if (!chatUser) {
    return (
      <Box sx={{ p: 2 }}>
        <Card>
          <CardHeader title="Iniciar Sesión en el Chat" />
          <Divider />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3} direction="column" alignItems="center" justifyContent="center" sx={{ minHeight: '50vh' }}>
              <Grid item>
                <Typography variant="h5" gutterBottom>
                  Bienvenido al Sistema de Chat
                </Typography>
              </Grid>
              <Grid item sx={{ width: '100%', maxWidth: '400px' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress color="secondary" />
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Cliente</InputLabel>
                      <Select
                        value={selectedClient ? selectedClient.id : ''}
                        label="Cliente"
                        onChange={(e) => {
                          const client = clients.find((c) => c.id === e.target.value);
                          setSelectedClient(client || null);
                        }}
                      >
                        {clients.map((client) => (
                          <MenuItem key={client.id} value={client.id}>
                            {client.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedClient && (
                      <>
                        <FormControlLabel
                          control={<Switch checked={isNewUser} onChange={(e) => setIsNewUser(e.target.checked)} />}
                          label="Nuevo Usuario"
                        />
                        {isNewUser ? (
                          <TextField
                            fullWidth
                            label="Ingresa tu nombre de usuario"
                            variant="outlined"
                            value={selectedUsername}
                            onChange={(e) => setSelectedUsername(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && initializeUser()}
                          />
                        ) : (
                          <FormControl fullWidth>
                            <InputLabel>Username</InputLabel>
                            <Select value={selectedUsername} label="Username" onChange={(e) => setSelectedUsername(e.target.value)}>
                              {usersForClient.map((u) => (
                                <MenuItem key={u.id} value={u.username}>
                                  {u.username}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </>
                    )}
                  </Stack>
                )}
              </Grid>
              <Grid item>
                <Button variant="contained" color="primary" onClick={initializeUser} size="large" disabled={!selectedClient || !selectedUsername}>
                  Iniciar Chat
                </Button>
              </Grid>
              {error && <Grid item><Typography color="error">{error}</Typography></Grid>}
            </Grid>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 100px)', display: 'flex' }}>
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={chatUser.client_name}
          action={
            <>
              <Button
                id="user-menu-button"
                aria-controls={isUserMenuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen ? 'true' : undefined}
                onClick={handleUserMenuOpen}
                endIcon={<CaretDownIcon />}
                sx={{ color: 'text.primary' }}
              >
                {chatUser.username}
              </Button>
              <Menu
                id="user-menu"
                anchorEl={userMenuAnchorEl}
                open={isUserMenuOpen}
                onClose={handleUserMenuClose}
                MenuListProps={{ 'aria-labelledby': 'user-menu-button' }}
              >
                <MenuItem onClick={handleChangeUser}>Cambiar Usuario</MenuItem>
              </Menu>
            </>
          }
        />
        <Divider />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Paper sx={{ borderRadius: 0, flexGrow: 1, overflow: 'auto', p: 2, bgcolor: theme.palette.grey[50] }}>
            <Stack spacing={2}>
              {messages.map((msg) => (
                <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <Paper
                    elevation={2}
                    sx={{ p: 1.5, maxWidth: '70%', bgcolor: msg.role === 'user' ? alpha(theme.palette.primary.main, 0.1) : theme.palette.grey[200] }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                  </Paper>
                </Box>
              ))}
              {isTyping && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper elevation={2} sx={{ p: 1.5, bgcolor: theme.palette.grey[200] }}>
                    <Typography variant="body1">
                      <em>IA está escribiendo...</em>
                    </Typography>
                  </Paper>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          </Paper>
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              variant="outlined"
              placeholder="Escribe tu mensaje..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ flexGrow: 1 }}
            />
            <Button variant="contained" color="primary" endIcon={<PaperPlaneTiltIcon />} onClick={sendMessage} size="large" disabled={isTyping}>
              Enviar
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
