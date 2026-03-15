import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Title, Group, TextInput, Select, Table, Badge,
  ActionIcon, Card, Pagination, Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconEye, IconTrash } from '@tabler/icons-react';
import { ordersApi } from '../../services/api';
import dayjs from 'dayjs';

interface Order {
  id: number; order_number: string; email: string; first_name: string; last_name: string;
  total_amount: number; status: string; payment_status: string; created_at: string;
  event?: { title: string };
}
interface Paginated { data: Order[]; current_page: number; last_page: number; total: number; }

const statusColor = (s: string) => ({ confirmed: 'teal', pending: 'yellow', cancelled: 'red', refunded: 'gray' }[s] ?? 'gray');
const statusLabel = (s: string) => ({ confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert', refunded: 'Erstattet' }[s] ?? s);
const payColor = (s: string) => ({ paid: 'teal', pending: 'yellow', failed: 'red', refunded: 'gray' }[s] ?? 'gray');
const payLabel = (s: string) => ({ paid: 'Bezahlt', pending: 'Ausstehend', failed: 'Fehlgeschlagen', refunded: 'Erstattet' }[s] ?? s);
const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

export default function OrdersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Paginated | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    ordersApi.list({ search, status, page, per_page: 15 })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  const handleDelete = (o: Order) => {
    modals.openConfirmModal({
      title: 'Bestellung löschen',
      children: <Text>Bestellung <strong>{o.order_number}</strong> löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        ordersApi.delete(o.id).then(() => {
          notifications.show({ message: 'Bestellung gelöscht', color: 'teal' });
          load();
        }),
    });
  };

  return (
    <Stack gap="md">
      <Title order={2}>Bestellungen</Title>

      <Card>
        <Group mb="md">
          <TextInput
            placeholder="Bestellnr. oder E-Mail"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Status"
            data={[
              { value: 'confirmed', label: 'Bestätigt' },
              { value: 'pending', label: 'Ausstehend' },
              { value: 'cancelled', label: 'Storniert' },
            ]}
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            clearable
            w={180}
          />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Bestellnr.</Table.Th>
              <Table.Th>Kunde</Table.Th>
              <Table.Th>Veranstaltung</Table.Th>
              <Table.Th>Betrag</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Zahlung</Table.Th>
              <Table.Th>Datum</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((o) => (
              <Table.Tr key={o.id}>
                <Table.Td><Text fw={500} size="sm">{o.order_number}</Text></Table.Td>
                <Table.Td><Text size="sm">{o.first_name} {o.last_name}</Text></Table.Td>
                <Table.Td><Text size="sm">{o.event?.title ?? '–'}</Text></Table.Td>
                <Table.Td><Text size="sm" fw={500}>{fmt(o.total_amount)}</Text></Table.Td>
                <Table.Td><Badge color={statusColor(o.status)} size="sm">{statusLabel(o.status)}</Badge></Table.Td>
                <Table.Td><Badge color={payColor(o.payment_status)} size="sm" variant="light">{payLabel(o.payment_status)}</Badge></Table.Td>
                <Table.Td><Text size="sm">{dayjs(o.created_at).format('DD.MM.YYYY')}</Text></Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" onClick={() => navigate(`/orders/${o.id}`)}><IconEye size={16} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(o)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {data && data.last_page > 1 && (
          <Group justify="center" mt="md">
            <Pagination total={data.last_page} value={page} onChange={setPage} />
          </Group>
        )}
      </Card>
    </Stack>
  );
}
