'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardHeader, Divider, Stack } from '@mui/material';

import { Sales } from '@/components/agent/overview/sales';
import { TotalCustomers } from '@/components/agent/overview/total-customers';

export default function Page(): React.JSX.Element {
  const [totalClients, setTotalClients] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [conversationSeries, setConversationSeries] = useState<Array<{ name: string; data: number[] }>>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setTotalClients(data.length);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setTotalUsers(data.length);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    const fetchConversationStats = async () => {
      try {
        const response = await fetch('/api/statistics/communications/by-month');
        if (response.ok) {
          const data = await response.json();
          const series = [{ name: data.current_year.name, data: data.current_year.data }];
          setConversationSeries(series);
        }
      } catch (error) {
        console.error('Failed to fetch conversation stats:', error);
      }
    };

    fetchClients();
    fetchUsers();
    fetchConversationStats();
  }, []);

  return (
    <Box sx={{ py: 2, px: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Stack spacing={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={3}>
          <Grid
            lg={4}
            sm={6}
            xs={12}
          >
            <TotalCustomers title="Total Clients" sx={{ height: '100%' }} value={totalClients.toString()} />
          </Grid>
          <Grid
            lg={4}
            sm={6}
            xs={12}
          >
            <TotalCustomers title="Total Users" sx={{ height: '100%' }} value={totalUsers.toString()} />
          </Grid>
          <Grid
            lg={12}
            xs={12}
          >
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Conversations" />
              <Divider />
              <Sales
                chartSeries={conversationSeries}
                sx={{ height: '100%' }}
              />
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
