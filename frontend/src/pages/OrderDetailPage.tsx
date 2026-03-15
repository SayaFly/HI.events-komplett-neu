import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Paper, Table, Badge, ActionIcon, Text, Grid,
  Divider, Button, Skeleton, Modal, Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import { ordersApi } from '@/api';
import { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'green', pending: 'yellow', cancelled: 'red', refunded: 'gray',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert', refunded: 'Erstattet',
};

export default function OrderDetailPage() {
  const { orderId }     = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.get(Number(orderId))
      .then((r) => setOrder(r.data))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <Skeleton height={500} radius="md" />;
  if (!order)  return <Text>Bestellung nicht gefunden</Text>;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" component={Link} to="/orders">
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Title order={2}>Bestellung #{order.order_number}</Title>
          <Badge color={STATUS_COLOR[order.status]} variant="light">
            {STATUS_LABEL[order.status]}
          </Badge>
        </Group>
        <Button leftSection={<IconPrinter size={16} />} variant="light" onClick={() => window.print()}>
          Drucken
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="md">Kundendaten</Title>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed" size="sm">Name</Text>
                <Text size="sm" fw={500}>{order.first_name} {order.last_name}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">E-Mail</Text>
                <Text size="sm">{order.email}</Text>
              </Group>
              {order.phone && (
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">Telefon</Text>
                  <Text size="sm">{order.phone}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text c="dimmed" size="sm">Bestelldatum</Text>
                <Text size="sm">{formatDateTime(order.created_at)}</Text>
              </Group>
              {order.paid_at && (
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">Bezahlt am</Text>
                  <Text size="sm">{formatDateTime(order.paid_at)}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="md">Zahlungsdetails</Title>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed" size="sm">Zwischensumme</Text>
                <Text size="sm">{formatCurrency(order.subtotal)}</Text>
              </Group>
              {order.discount > 0 && (
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">Rabatt</Text>
                  <Text size="sm" c="green">-{formatCurrency(order.discount)}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text c="dimmed" size="sm">MwSt.</Text>
                <Text size="sm">{formatCurrency(order.tax)}</Text>
              </Group>
              <Divider my="xs" />
              <Group justify="space-between">
                <Text fw={700}>Gesamt</Text>
                <Text fw={700} c="violet" size="lg">{formatCurrency(order.total)}</Text>
              </Group>
              {order.payment_method && (
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">Zahlungsart</Text>
                  <Text size="sm">{order.payment_method}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        {order.items && order.items.length > 0 && (
          <Grid.Col span={12}>
            <Paper p="md" radius="md" withBorder>
              <Title order={4} mb="md">Bestellpositionen</Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Ticket</Table.Th>
                    <Table.Th>Anzahl</Table.Th>
                    <Table.Th>Einzelpreis</Table.Th>
                    <Table.Th>Gesamt</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {order.items.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>{item.ticket_type?.name}</Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>{formatCurrency(item.unit_price)}</Table.Td>
                      <Table.Td>{formatCurrency(item.total)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Grid.Col>
        )}
      </Grid>
    </Stack>
  );
}
