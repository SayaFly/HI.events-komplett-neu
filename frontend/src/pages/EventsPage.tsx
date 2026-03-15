import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stack, Title, Group, Button, TextInput, Select, Table, Badge, ActionIcon,
  Pagination, Paper, Text, Menu, Tooltip, Image, Box, Skeleton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye, IconCopy,
  IconDotsVertical, IconFilter,
} from '@tabler/icons-react';
import { eventsApi } from '@/api';
import { Event, PaginatedResponse } from '@/types';
import { formatDate, truncate } from '@/utils/format';

const STATUS_COLOR: Record<string, string> = {
  published: 'green', draft: 'gray', cancelled: 'red', completed: 'blue', archived: 'orange',
};
const STATUS_LABEL: Record<string, string> = {
  published: 'Veröffentlicht', draft: 'Entwurf', cancelled: 'Abgesagt',
  completed: 'Abgeschlossen', archived: 'Archiviert',
};

export default function EventsPage() {
  const navigate = useNavigate();
  const [data, setData]       = useState<PaginatedResponse<Event> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await eventsApi.list({ page, search, status, per_page: 20 });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = (event: Event) => {
    modals.openConfirmModal({
      title: 'Event löschen',
      children: <Text>Möchten Sie das Event <strong>{event.title}</strong> wirklich löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await eventsApi.delete(event.organizer_id, event.id);
          notifications.show({ message: 'Event gelöscht.', color: 'green' });
          load();
        } catch {
          notifications.show({ message: 'Fehler beim Löschen.', color: 'red' });
        }
      },
    });
  };

  const handleDuplicate = async (event: Event) => {
    try {
      const res = await eventsApi.duplicate(event.id);
      notifications.show({ message: 'Event dupliziert.', color: 'green' });
      navigate(`/events/${res.data.id}/edit`);
    } catch {
      notifications.show({ message: 'Fehler beim Duplizieren.', color: 'red' });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Events</Title>
        <Button leftSection={<IconPlus size={16} />} component={Link} to="/events/new">
          Neues Event
        </Button>
      </Group>

      {/* Filter */}
      <Paper p="md" radius="md" withBorder>
        <form onSubmit={handleSearch}>
          <Group gap="sm">
            <TextInput
              placeholder="Events suchen..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Status"
              leftSection={<IconFilter size={16} />}
              value={status}
              onChange={setStatus}
              clearable
              data={[
                { value: 'published', label: 'Veröffentlicht' },
                { value: 'draft',     label: 'Entwurf' },
                { value: 'cancelled', label: 'Abgesagt' },
                { value: 'completed', label: 'Abgeschlossen' },
              ]}
              w={180}
            />
            <Button type="submit" variant="light">Suchen</Button>
          </Group>
        </form>
      </Paper>

      {/* Table */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Event</Table.Th>
              <Table.Th>Datum</Table.Th>
              <Table.Th>Ort</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Aufrufe</Table.Th>
              <Table.Th w={80}>Aktionen</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <Table.Tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <Table.Td key={j}><Skeleton height={20} /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : data?.data.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="xl">Keine Events gefunden</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              data?.data.map((event) => (
                <Table.Tr key={event.id}>
                  <Table.Td>
                    <Group gap="sm">
                      {event.cover_image && (
                        <Image src={event.cover_image} w={40} h={40} radius="sm" fit="cover" />
                      )}
                      <Box>
                        <Text size="sm" fw={500} lineClamp={1}>{event.title}</Text>
                        <Text size="xs" c="dimmed">{event.organizer?.name}</Text>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(event.start_date)}</Text>
                    {event.end_date && (
                      <Text size="xs" c="dimmed">bis {formatDate(event.end_date)}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{event.venue?.city ?? (event.is_online ? 'Online' : '—')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLOR[event.status]} variant="light" size="sm">
                      {STATUS_LABEL[event.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{event.views_count.toLocaleString('de-DE')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />} component={Link} to={`/events/${event.id}`}>
                          Details
                        </Menu.Item>
                        <Menu.Item leftSection={<IconEdit size={14} />} component={Link} to={`/events/${event.id}/edit`}>
                          Bearbeiten
                        </Menu.Item>
                        <Menu.Item leftSection={<IconCopy size={14} />} onClick={() => handleDuplicate(event)}>
                          Duplizieren
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(event)}>
                          Löschen
                        </Menu.Item>
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
