import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Button, Tabs, Badge, Text, Paper, Grid,
  Image, Skeleton, ActionIcon, Menu, SimpleGrid, Box,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconEdit, IconTrash, IconTicket, IconUsers, IconShoppingCart,
  IconQrcode, IconMail, IconArrowLeft, IconDotsVertical,
  IconCalendar, IconMapPin, IconWorld,
} from '@tabler/icons-react';
import { eventsApi } from '@/api';
import { Event, EventStats } from '@/types';
import { formatDate, formatDateTime, formatCurrency } from '@/utils/format';

const STATUS_COLOR: Record<string, string> = {
  published: 'green', draft: 'gray', cancelled: 'red', completed: 'blue', archived: 'orange',
};
const STATUS_LABEL: Record<string, string> = {
  published: 'Veröffentlicht', draft: 'Entwurf', cancelled: 'Abgesagt',
  completed: 'Abgeschlossen', archived: 'Archiviert',
};

export default function EventDetailPage() {
  const { id }            = useParams<{ id: string }>();
  const navigate          = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, stRes] = await Promise.all([
          eventsApi.get(Number(id)),
          eventsApi.stats(Number(id)),
        ]);
        setEvent(evRes.data);
        setStats(stRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = () => {
    if (!event) return;
    modals.openConfirmModal({
      title: 'Event löschen',
      children: <Text>Möchten Sie <strong>{event.title}</strong> wirklich löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await eventsApi.delete(event.organizer_id, event.id);
        notifications.show({ message: 'Event gelöscht.', color: 'green' });
        navigate('/events');
      },
    });
  };

  if (loading) return <Skeleton height={400} radius="md" />;
  if (!event) return <Text>Event nicht gefunden</Text>;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" component={Link} to="/events">
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Title order={2} lineClamp={1}>{event.title}</Title>
          <Badge color={STATUS_COLOR[event.status]} variant="light">
            {STATUS_LABEL[event.status]}
          </Badge>
        </Group>
        <Group>
          <Button
            leftSection={<IconEdit size={16} />}
            variant="light"
            component={Link}
            to={`/events/${id}/edit`}
          >
            Bearbeiten
          </Button>
          <Menu shadow="md">
            <Menu.Target>
              <ActionIcon variant="light"><IconDotsVertical size={16} /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconTicket size={14} />} component={Link} to={`/events/${id}/tickets`}>
                Ticket-Typen
              </Menu.Item>
              <Menu.Item leftSection={<IconShoppingCart size={14} />} component={Link} to={`/events/${id}/orders`}>
                Bestellungen
              </Menu.Item>
              <Menu.Item leftSection={<IconUsers size={14} />} component={Link} to={`/events/${id}/attendees`}>
                Teilnehmer
              </Menu.Item>
              <Menu.Item leftSection={<IconQrcode size={14} />} component={Link} to={`/events/${id}/check-in`}>
                Check-In
              </Menu.Item>
              <Menu.Item leftSection={<IconMail size={14} />} component={Link} to={`/events/${id}/messages`}>
                Nachrichten
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={handleDelete}>
                Löschen
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Stats */}
      {stats && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
          {[
            { label: 'Tickets verkauft', value: stats.sold_tickets },
            { label: 'Verfügbar',         value: stats.available ?? '∞' },
            { label: 'Umsatz',            value: formatCurrency(stats.total_revenue) },
            { label: 'Bestellungen',      value: stats.total_orders },
            { label: 'Eingecheckt',       value: stats.checked_in },
            { label: 'Check-In-Rate',     value: `${stats.check_in_rate}%` },
          ].map((s) => (
            <Paper key={s.label} p="sm" radius="md" withBorder ta="center">
              <Text size="xl" fw={700} c="violet">{s.value}</Text>
              <Text size="xs" c="dimmed">{s.label}</Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
              <Group gap="xs">
                <IconCalendar size={16} />
                <Text size="sm">
                  {formatDateTime(event.start_date)}
                  {event.end_date && ` – ${formatDateTime(event.end_date)}`}
                </Text>
              </Group>
              {event.venue && (
                <Group gap="xs">
                  <IconMapPin size={16} />
                  <Text size="sm">{event.venue.name}, {event.venue.city}</Text>
                </Group>
              )}
              {event.is_online && (
                <Group gap="xs">
                  <IconWorld size={16} />
                  <Text size="sm">Online-Event</Text>
                </Group>
              )}
              {event.description && (
                <Box mt="sm">
                  <Text size="sm" dangerouslySetInnerHTML={{ __html: event.description }} />
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          {event.cover_image && (
            <Image
              src={event.cover_image}
              radius="md"
              fit="cover"
              h={200}
            />
          )}
          <Paper p="md" radius="md" withBorder mt={event.cover_image ? 'sm' : 0}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Veranstalter</Text>
                <Text size="sm" fw={500}>{event.organizer?.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Kategorie</Text>
                <Text size="sm" fw={500}>{event.category?.name ?? '—'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Sichtbarkeit</Text>
                <Badge size="sm" variant="light">
                  {{ public: 'Öffentlich', private: 'Privat', unlisted: 'Nicht gelistet' }[event.visibility]}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Aufrufe</Text>
                <Text size="sm" fw={500}>{event.views_count.toLocaleString('de-DE')}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Erstellt</Text>
                <Text size="sm" fw={500}>{formatDate(event.created_at)}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
