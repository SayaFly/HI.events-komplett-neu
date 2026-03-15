import { useEffect, useState } from 'react';
import {
  Grid, Paper, Text, Title, Group, Stack, Badge, RingProgress,
  SimpleGrid, Skeleton, ThemeIcon, Box,
} from '@mantine/core';
import {
  IconCalendarEvent, IconShoppingCart, IconUsers, IconCurrencyEuro,
  IconQrcode, IconTrendingUp,
} from '@tabler/icons-react';
import { AreaChart } from '@mantine/charts';
import { dashboardApi } from '@/api';
import { DashboardStats, RevenueData, Order } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function StatCard({ title, value, icon, color, description }: StatCardProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>{title}</Text>
        <ThemeIcon variant="light" color={color} radius="md" size="lg">
          {icon}
        </ThemeIcon>
      </Group>
      <Text fw={700} size="xl">{value}</Text>
      {description && <Text size="xs" c="dimmed" mt={4}>{description}</Text>}
    </Paper>
  );
}

export default function DashboardPage() {
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [revenue, setRevenue]     = useState<RevenueData[]>([]);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, revRes, ordRes] = await Promise.all([
          dashboardApi.stats(),
          dashboardApi.revenue(30),
          dashboardApi.recentOrders(),
        ]);
        setStats(statsRes.data);
        setRevenue(revRes.data.data || []);
        setOrders(ordRes.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const checkInRate = stats
    ? stats.total_attendees > 0
      ? Math.round((stats.checked_in / stats.total_attendees) * 100)
      : 0
    : 0;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
        <Text size="sm" c="dimmed">Übersicht aller Aktivitäten</Text>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing="md">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} height={100} radius="md" />)
        ) : (
          <>
            <StatCard
              title="Events gesamt"
              value={stats?.total_events ?? 0}
              icon={<IconCalendarEvent size={20} />}
              color="violet"
              description={`${stats?.published_events ?? 0} veröffentlicht`}
            />
            <StatCard
              title="Bestellungen"
              value={stats?.total_orders ?? 0}
              icon={<IconShoppingCart size={20} />}
              color="blue"
            />
            <StatCard
              title="Umsatz"
              value={formatCurrency(stats?.total_revenue ?? 0)}
              icon={<IconCurrencyEuro size={20} />}
              color="green"
              description="Bestätigte Bestellungen"
            />
            <StatCard
              title="Teilnehmer"
              value={stats?.total_attendees ?? 0}
              icon={<IconUsers size={20} />}
              color="cyan"
            />
            <StatCard
              title="Eingecheckt"
              value={stats?.checked_in ?? 0}
              icon={<IconQrcode size={20} />}
              color="orange"
              description={`${checkInRate}% Check-in-Rate`}
            />
            <StatCard
              title="Veröffentlicht"
              value={stats?.published_events ?? 0}
              icon={<IconTrendingUp size={20} />}
              color="pink"
              description="Aktive Events"
            />
          </>
        )}
      </SimpleGrid>

      {/* Revenue Chart */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="md">Umsatz (letzte 30 Tage)</Title>
            {loading ? (
              <Skeleton height={200} radius="md" />
            ) : revenue.length > 0 ? (
              <AreaChart
                h={200}
                data={revenue}
                dataKey="date"
                series={[{ name: 'total', color: 'violet.6', label: 'Umsatz (€)' }]}
                curveType="monotone"
                tickLine="x"
                gridAxis="xy"
              />
            ) : (
              <Box h={200} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text c="dimmed">Keine Umsatzdaten vorhanden</Text>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder h="100%">
            <Title order={4} mb="md">Check-In-Rate</Title>
            <Group justify="center" mt="lg">
              <RingProgress
                size={140}
                thickness={14}
                sections={[{ value: checkInRate, color: 'violet' }]}
                label={
                  <Text ta="center" fw={700} size="xl">{checkInRate}%</Text>
                }
              />
            </Group>
            <Stack gap={4} mt="md">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Teilnehmer gesamt</Text>
                <Text size="sm" fw={500}>{stats?.total_attendees ?? 0}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Eingecheckt</Text>
                <Text size="sm" fw={500} c="violet">{stats?.checked_in ?? 0}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Recent Orders */}
      <Paper p="md" radius="md" withBorder>
        <Title order={4} mb="md">Letzte Bestellungen</Title>
        {loading ? (
          <Skeleton height={200} radius="md" />
        ) : orders.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">Keine Bestellungen vorhanden</Text>
        ) : (
          <Stack gap="xs">
            {orders.slice(0, 10).map((order) => (
              <Group key={order.id} justify="space-between" p="xs"
                style={{ borderRadius: 8, background: 'var(--mantine-color-gray-0)' }}>
                <Box>
                  <Text size="sm" fw={500}>{order.first_name} {order.last_name}</Text>
                  <Text size="xs" c="dimmed">{order.email} · #{order.order_number}</Text>
                </Box>
                <Group gap="sm">
                  <Text size="sm" fw={600} c="violet">{formatCurrency(order.total)}</Text>
                  <Badge
                    color={orderStatusColor(order.status)}
                    variant="light"
                    size="sm"
                  >
                    {orderStatusLabel(order.status)}
                  </Badge>
                </Group>
              </Group>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}

function orderStatusColor(status: string) {
  return { confirmed: 'green', pending: 'yellow', cancelled: 'red', refunded: 'gray' }[status] ?? 'gray';
}
function orderStatusLabel(status: string) {
  return { confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert', refunded: 'Erstattet' }[status] ?? status;
}
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
