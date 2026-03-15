import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Stack, Title, Button, Group, Card, Text, Badge,
  Table, Select, Grid, Loader, Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import { ordersApi } from '../../services/api';
import dayjs from 'dayjs';

interface OrderDetail {
  id: number; order_number: string; email: string; first_name: string; last_name: string;
  phone: string; total_amount: number; status: string; payment_status: string;
  payment_method: string; notes: string; created_at: string; paid_at: string;
  event?: { title: string; start_date: string; city: string };
  user?: { name: string; email: string };
  items?: Array<{
    id: number; quantity: number; unit_price: number; subtotal: number;
    attendee_name: string; ticket?: { name: string };
  }>;
}

const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
const statusLabel = (s: string) => ({ confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert', refunded: 'Erstattet' }[s] ?? s);
const statusColor = (s: string) => ({ confirmed: 'teal', pending: 'yellow', cancelled: 'red', refunded: 'gray' }[s] ?? 'gray');

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ordersApi.get(Number(id))
      .then((r) => { setOrder(r.data); setNewStatus(r.data.status); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!newStatus || !order) return;
    setSaving(true);
    try {
      const res = await ordersApi.updateStatus(order.id, { status: newStatus });
      setOrder(res.data);
      notifications.show({ message: 'Status aktualisiert', color: 'teal' });
    } catch {
      notifications.show({ title: 'Fehler', message: 'Aktualisierung fehlgeschlagen', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Center h={300}><Loader /></Center>;
  if (!order) return <Text>Bestellung nicht gefunden</Text>;

  return (
    <Stack gap="md">
      <Group>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/orders')}>
          Zurück
        </Button>
        <Title order={2}>Bestellung {order.order_number}</Title>
        <Badge color={statusColor(order.status)} size="lg">{statusLabel(order.status)}</Badge>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card mb="md">
            <Title order={5} mb="md">Bestellpositionen</Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ticket</Table.Th>
                  <Table.Th>Teilnehmer</Table.Th>
                  <Table.Th>Menge</Table.Th>
                  <Table.Th>Einzelpreis</Table.Th>
                  <Table.Th>Gesamt</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {order.items?.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.ticket?.name ?? '–'}</Table.Td>
                    <Table.Td>{item.attendee_name ?? '–'}</Table.Td>
                    <Table.Td>{item.quantity}</Table.Td>
                    <Table.Td>{fmt(item.unit_price)}</Table.Td>
                    <Table.Td><Text fw={500}>{fmt(item.subtotal)}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="flex-end" mt="md">
              <Text fw={700} size="lg">Gesamt: {fmt(order.total_amount)}</Text>
            </Group>
          </Card>

          <Card>
            <Title order={5} mb="md">Veranstaltung</Title>
            {order.event && (
              <Stack gap={4}>
                <Text fw={500}>{order.event.title}</Text>
                <Text size="sm" c="dimmed">
                  {dayjs(order.event.start_date).format('DD.MM.YYYY HH:mm')} – {order.event.city}
                </Text>
              </Stack>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card mb="md">
            <Title order={5} mb="md">Kunde</Title>
            <Stack gap={4}>
              <Text fw={500}>{order.first_name} {order.last_name}</Text>
              <Text size="sm">{order.email}</Text>
              {order.phone && <Text size="sm">{order.phone}</Text>}
            </Stack>
          </Card>

          <Card mb="md">
            <Title order={5} mb="md">Zahlungsinfo</Title>
            <Stack gap={4}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Methode</Text>
                <Text size="sm">{order.payment_method}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Status</Text>
                <Badge size="sm" color={order.payment_status === 'paid' ? 'teal' : 'yellow'}>
                  {order.payment_status === 'paid' ? 'Bezahlt' : 'Ausstehend'}
                </Badge>
              </Group>
              {order.paid_at && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Bezahlt am</Text>
                  <Text size="sm">{dayjs(order.paid_at).format('DD.MM.YYYY HH:mm')}</Text>
                </Group>
              )}
            </Stack>
          </Card>

          <Card>
            <Title order={5} mb="md">Status ändern</Title>
            <Stack>
              <Select
                data={[
                  { value: 'pending', label: 'Ausstehend' },
                  { value: 'confirmed', label: 'Bestätigt' },
                  { value: 'cancelled', label: 'Storniert' },
                  { value: 'refunded', label: 'Erstattet' },
                ]}
                value={newStatus}
                onChange={setNewStatus}
              />
              <Button onClick={handleUpdateStatus} loading={saving} fullWidth>
                Status speichern
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
