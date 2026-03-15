import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Title, Group, Button, TextInput, Select, Table, Badge,
  ActionIcon, Pagination, Text, Card, Skeleton, Menu,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash,
  IconDotsVertical, IconBan, IconCheck,
} from '@tabler/icons-react';
import { eventsApi } from '../../services/api';
import dayjs from 'dayjs';

interface Event {
  id: number; title: string; status: string; city: string;
  start_date: string; current_attendees: number; max_attendees: number;
  category?: { name: string };
}
interface Paginated { data: Event[]; current_page: number; last_page: number; total: number; }

const statusColor = (s: string) =>
  ({ published: 'teal', draft: 'gray', cancelled: 'red', sold_out: 'orange' }[s] ?? 'gray');
const statusLabel = (s: string) =>
  ({ published: 'Veröffentlicht', draft: 'Entwurf', cancelled: 'Abgesagt', sold_out: 'Ausverkauft' }[s] ?? s);

export default function EventsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Paginated | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    eventsApi.list({ search, status, page, per_page: 15 })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  const handleDelete = (id: number, title: string) => {
    modals.openConfirmModal({
      title: 'Veranstaltung löschen',
      children: <Text>Möchten Sie <strong>{title}</strong> wirklich löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        eventsApi.delete(id).then(() => {
          notifications.show({ message: 'Veranstaltung gelöscht', color: 'teal' });
          load();
        }),
    });
  };

  const handlePublish = (id: number) =>
    eventsApi.publish(id).then(() => { notifications.show({ message: 'Veröffentlicht', color: 'teal' }); load(); });

  const handleCancel = (id: number) =>
    eventsApi.cancel(id).then(() => { notifications.show({ message: 'Abgesagt', color: 'orange' }); load(); });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Veranstaltungen</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/events/new')}>
          Neue Veranstaltung
        </Button>
      </Group>

      <Card>
        <Group mb="md">
          <TextInput
            placeholder="Suchen..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Status filtern"
            data={[
              { value: 'published', label: 'Veröffentlicht' },
              { value: 'draft', label: 'Entwurf' },
              { value: 'cancelled', label: 'Abgesagt' },
            ]}
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            clearable
            w={180}
          />
        </Group>

        {loading ? (
          <Stack>{[...Array(5)].map((_, i) => <Skeleton key={i} height={48} />)}</Stack>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Titel</Table.Th>
                  <Table.Th>Kategorie</Table.Th>
                  <Table.Th>Datum</Table.Th>
                  <Table.Th>Ort</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Teilnehmer</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.data.map((ev) => (
                  <Table.Tr key={ev.id}>
                    <Table.Td><Text fw={500} size="sm">{ev.title}</Text></Table.Td>
                    <Table.Td><Text size="sm">{ev.category?.name ?? '–'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{dayjs(ev.start_date).format('DD.MM.YYYY HH:mm')}</Text></Table.Td>
                    <Table.Td><Text size="sm">{ev.city}</Text></Table.Td>
                    <Table.Td><Badge color={statusColor(ev.status)} size="sm">{statusLabel(ev.status)}</Badge></Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {ev.current_attendees ?? 0}
                        {ev.max_attendees ? ` / ${ev.max_attendees}` : ''}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" radius="md">
                        <Menu.Target>
                          <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => navigate(`/events/${ev.id}/edit`)}>Bearbeiten</Menu.Item>
                          {ev.status === 'draft' && (
                            <Menu.Item leftSection={<IconCheck size={14} />} onClick={() => handlePublish(ev.id)} color="teal">Veröffentlichen</Menu.Item>
                          )}
                          {ev.status === 'published' && (
                            <Menu.Item leftSection={<IconBan size={14} />} onClick={() => handleCancel(ev.id)} color="orange">Absagen</Menu.Item>
                          )}
                          <Menu.Item leftSection={<IconTrash size={14} />} onClick={() => handleDelete(ev.id, ev.title)} color="red">Löschen</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
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
          </>
        )}
      </Card>
    </Stack>
  );
}
