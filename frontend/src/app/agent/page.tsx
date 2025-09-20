'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import dayjs from 'dayjs';

import { config } from '@/config';
import { LatestOrders } from '@/components/agent/overview/latest-orders';
import { LatestProducts } from '@/components/agent/overview/latest-products';
import { Sales } from '@/components/agent/overview/sales';
import { TasksProgress } from '@/components/agent/overview/tasks-progress';
import { TotalCustomers } from '@/components/agent/overview/total-customers';
import { TotalProfit } from '@/components/agent/overview/total-profit';
import { Traffic } from '@/components/agent/overview/traffic';

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
        const response = await fetch('/api/conversations/stats/by-month');
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
    <Grid container spacing={3}>
      <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TotalCustomers sx={{ height: '100%' }} value={totalClients.toString()} />
      </Grid>
      <Grid
        size={{ lg: 3, sm: 6, xs: 12 }}
      >
        <TotalCustomers sx={{ height: '100%' }} value={totalUsers.toString()} />
      </Grid>
      <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TotalProfit sx={{ height: '100%' }} value="$15k" />
      </Grid>
      <Grid
        size={{
          lg: 8,
          xs: 12,
        }}
      >
        <Sales
          chartSeries={conversationSeries}
          sx={{ height: '100%' }}
          title="Conversations"
        />
      </Grid>
      <Grid
        size={{
          lg: 4,
          md: 6,
          xs: 12,
        }}
      >
        <Traffic chartSeries={[63, 15, 22]} labels={['Desktop', 'Tablet', 'Phone']} sx={{ height: '100%' }} />
      </Grid>
      <Grid
        size={{
          lg: 4,
          md: 6,
          xs: 12,
        }}
      >
        <LatestProducts
          products={[
            {
              id: 'PRD-005',
              name: 'Soja & Co. Eucalyptus',
              image: '/assets/product-5.png',
              updatedAt: dayjs().subtract(18, 'minutes').subtract(5, 'hour').toDate(),
            },
            {
              id: 'PRD-004',
              name: 'Necessaire Body Lotion',
              image: '/assets/product-4.png',
              updatedAt: dayjs().subtract(41, 'minutes').subtract(3, 'hour').toDate(),
            },
            {
              id: 'PRD-003',
              name: 'Ritual of Sakura',
              image: '/assets/product-3.png',
              updatedAt: dayjs().subtract(5, 'minutes').subtract(3, 'hour').toDate(),
            },
            {
              id: 'PRD-002',
              name: 'Lancome Rouge',
              image: '/assets/product-2.png',
              updatedAt: dayjs().subtract(23, 'minutes').subtract(2, 'hour').toDate(),
            },
            {
              id: 'PRD-001',
              name: 'Healthcare Erbology',
              image: '/assets/product-1.png',
              updatedAt: dayjs().subtract(10, 'minutes').toDate(),
            },
          ]}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        size={{
          lg: 8,
          md: 12,
          xs: 12,
        }}
      >
        <LatestOrders
          orders={[
            {
              id: 'ORD-007',
              customer: { name: 'Ekaterina Tankova' },
              amount: 30.5,
              status: 'pending',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-006',
              customer: { name: 'Cao Yu' },
              amount: 25.1,
              status: 'delivered',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-004',
              customer: { name: 'Alexa Richardson' },
              amount: 10.99,
              status: 'refunded',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-003',
              customer: { name: 'Anje Keizer' },
              amount: 96.43,
              status: 'pending',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-002',
              customer: { name: 'Clarke Gillebert' },
              amount: 32.54,
              status: 'delivered',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-001',
              customer: { name: 'Adam Denisov' },
              amount: 16.76,
              status: 'delivered',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
          ]}
          sx={{ height: '100%' }}
        />
      </Grid>
    </Grid>
  );
}
