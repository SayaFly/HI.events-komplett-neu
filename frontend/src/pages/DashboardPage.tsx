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
