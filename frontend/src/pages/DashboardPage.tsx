import { useEffect, useState } from 'react';
import {
  Grid, Card, Text, Title, Group, Stack, Badge, Table,
  RingProgress, SimpleGrid, Skeleton, ThemeIcon,
} from '@mantine/core';
import {
  IconCalendarEvent, IconShoppingCart, IconCurrencyEuro,
  IconUsers, IconTicket, IconTrendingUp,
} from '@tabler/icons-react';
import { AreaChart } from '@mantine/charts';
import { dashboardApi } from '../services/api';

interface Stats {
  total_events: number;
  published_events: number;
  total_orders: number;
  confirmed_orders: number;
  total_revenue: number;
  total_users: number;
  tickets_sold: number;
  revenue_this_month: number;
  revenue_last_month: number;
  orders_this_month: number;
  new_users_this_month: number;
}

interface RevenuePoint { month: string; label: string; revenue: number; orders: number; }
interface RecentOrder {
  id: number; order_number: string; email: string; total_amount: number;
  status: string; created_at: string;
  event?: { title: string };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      dashboardApi.revenue(6),
      dashboardApi.recentOrders(8),
    ]).then(([s, r, o]) => {
      setStats(s.data);
      setRevenue(r.data);
      setRecentOrders(o.data);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Veranstaltungen', value: stats.total_events, sub: `${stats.published_events} veröffentlicht`, icon: <IconCalendarEvent />, color: 'violet' },
    { label: 'Gesamteinnahmen', value: fmt(stats.total_revenue), sub: `${fmt(stats.revenue_this_month)} diesen Monat`, icon: <IconCurrencyEuro />, color: 'teal' },
    { label: 'Bestellungen', value: stats.total_orders, sub: `${stats.orders_this_month} diesen Monat`, icon: <IconShoppingCart />, color: 'blue' },
    { label: 'Benutzer', value: stats.total_users, sub: `${stats.new_users_this_month} neu diesen Monat`, icon: <IconUsers />, color: 'orange' },
    { label: 'Tickets verkauft', value: stats.tickets_sold, sub: 'Insgesamt', icon: <IconTicket />, color: 'pink' },
    { label: 'Bestätigt', value: stats.confirmed_orders, sub: `von ${stats.total_orders} Bestellungen`, icon: <IconTrendingUp />, color: 'green' },
  ] : [];

  const statusColor = (s: string) =>
    ({ confirmed: 'teal', pending: 'yellow', cancelled: 'red', refunded: 'gray' }[s] ?? 'gray');

  const statusLabel = (s: string) =>
    ({ confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert', refunded: 'Erstattet' }[s] ?? s);

  return (
    <Stack gap="md">
      <Title order={2}>Dashboard</Title>

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={100} radius="md" />)}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {statCards.map((c) => (
            <Card key={c.label}>
              <Group justify="space-between">
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">{c.label}</Text>
                  <Text fw={700} size="xl">{c.value}</Text>
                  <Text size="xs" c="dimmed">{c.sub}</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" color={c.color} variant="light">
                  {c.icon}
                </ThemeIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card>
            <Text fw={600} mb="md">Einnahmen (letzte 6 Monate)</Text>
            {loading ? (
              <Skeleton height={200} />
            ) : (
              <AreaChart
                h={220}
                data={revenue}
                dataKey="label"
                series={[{ name: 'revenue', color: 'violet.6', label: 'Einnahmen (€)' }]}
                curveType="natural"
                tickLine="y"
              />
            )}
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card h="100%">
            <Text fw={600} mb="md">Bestätigungsrate</Text>
            {stats && (
              <Stack align="center">
                <RingProgress
                  size={160}
                  thickness={16}
                  roundCaps
                  sections={[{
                    value: stats.total_orders > 0
                      ? Math.round((stats.confirmed_orders / stats.total_orders) * 100)
                      : 0,
                    color: 'teal',
                  }]}
                  label={
                    <Text ta="center" fw={700} size="xl">
                      {stats.total_orders > 0
                        ? `${Math.round((stats.confirmed_orders / stats.total_orders) * 100)}%`
                        : '0%'}
                    </Text>
                  }
                />
                <Text size="sm" c="dimmed">
                  {stats.confirmed_orders} von {stats.total_orders} Bestellungen bestätigt
                </Text>
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Card>
        <Text fw={600} mb="md">Letzte Bestellungen</Text>
        {loading ? <Skeleton height={200} /> : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Bestellnr.</Table.Th>
                <Table.Th>E-Mail</Table.Th>
                <Table.Th>Veranstaltung</Table.Th>
                <Table.Th>Betrag</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentOrders.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td><Text size="sm" fw={500}>{o.order_number}</Text></Table.Td>
                  <Table.Td><Text size="sm">{o.email}</Text></Table.Td>
                  <Table.Td><Text size="sm">{o.event?.title ?? '–'}</Text></Table.Td>
                  <Table.Td><Text size="sm" fw={500}>{fmt(o.total_amount)}</Text></Table.Td>
                  <Table.Td><Badge color={statusColor(o.status)} size="sm">{statusLabel(o.status)}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
