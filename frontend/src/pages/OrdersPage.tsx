import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Button, Paper, Table, Badge, ActionIcon, Text,
  TextInput, Select, Pagination, Skeleton, Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  IconSearch, IconFilter, IconEye, IconDotsVertical,
  IconDownload, IconArrowLeft,
} from '@tabler/icons-react';
import { ordersApi } from '@/api';
import { Order, PaginatedResponse } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'green', pending: 'yellow', cancelled: 'red', refunded: 'gray',
  partially_refunded: 'orange',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert',
  refunded: 'Erstattet', partially_refunded: 'Teilw. erstattet',
};

export default function OrdersPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [data, setData]       = useState<PaginatedResponse<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (eventId) {
        res = await ordersApi.byEvent(Number(eventId), { page, search, status, per_page: 25 });
      } else {
        // Fallback: first organizer
        res = await ordersApi.byEvent(0, { page, search, status, per_page: 25 });
      }
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, status, eventId]);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    try {
      await ordersApi.updateStatus(order.id, newStatus);
      notifications.show({ message: 'Status aktualisiert.', color: 'green' });
      load();
    } catch {
      notifications.show({ message: 'Fehler.', color: 'red' });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group>
          {eventId && (
            <ActionIcon variant="subtle" component={Link} to={`/events/${eventId}`}>
              <IconArrowLeft size={18} />
            </ActionIcon>
          )}
          <Title order={2}>Bestellungen</Title>
        </Group>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Group gap="sm">
          <TextInput
            placeholder="Suchen..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
          />
          <Select
            placeholder="Status"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            clearable
            leftSection={<IconFilter size={16} />}
            data={[
              { value: 'confirmed', label: 'Bestätigt' },
              { value: 'pending',   label: 'Ausstehend' },
              { value: 'cancelled', label: 'Storniert' },
              { value: 'refunded',  label: 'Erstattet' },
            ]}
            w={180}
          />
        </Group>
      </Paper>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Bestellung</Table.Th>
              <Table.Th>Kunde</Table.Th>
              <Table.Th>Datum</Table.Th>
              <Table.Th>Betrag</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th w={60}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <Table.Tr key={i}>{Array(6).fill(0).map((_, j) => <Table.Td key={j}><Skeleton h={20} /></Table.Td>)}</Table.Tr>
              ))
            ) : data?.data.length === 0 ? (
              <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">Keine Bestellungen</Text></Table.Td></Table.Tr>
            ) : (
              data?.data.map((order) => (
                <Table.Tr key={order.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>#{order.order_number}</Text>
                    <Text size="xs" c="dimmed">{order.event?.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{order.first_name} {order.last_name}</Text>
                    <Text size="xs" c="dimmed">{order.email}</Text>
                  </Table.Td>
                  <Table.Td><Text size="sm">{formatDateTime(order.created_at)}</Text></Table.Td>
                  <Table.Td><Text size="sm" fw={600}>{formatCurrency(order.total)}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLOR[order.status]} variant="light" size="sm">
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="sm" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDotsVertical size={14} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />} component={Link} to={`/orders/${order.id}`}>
                          Details
                        </Menu.Item>
                        {order.status === 'pending' && (
                          <Menu.Item onClick={() => handleStatusChange(order, 'confirmed')}>
                            Bestätigen
                          </Menu.Item>
                        )}
                        {['confirmed', 'pending'].includes(order.status) && (
                          <Menu.Item color="red" onClick={() => handleStatusChange(order, 'cancelled')}>
                            Stornieren
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {data && data.last_page > 1 && (
        <Group justify="center">
          <Pagination total={data.last_page} value={page} onChange={setPage} />
        </Group>
      )}
    </Stack>
  );
}
