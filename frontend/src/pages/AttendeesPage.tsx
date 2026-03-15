import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Paper, Table, Badge, ActionIcon, Text,
  TextInput, Select, Pagination, Skeleton, Button, Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSearch, IconFilter, IconArrowLeft, IconQrcode,
  IconDownload, IconDotsVertical, IconCheck,
} from '@tabler/icons-react';
import { attendeesApi } from '@/api';
import { Attendee, PaginatedResponse } from '@/types';
import { formatDateTime } from '@/utils/format';

const STATUS_COLOR: Record<string, string> = {
  active: 'blue', cancelled: 'red', checked_in: 'green',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Aktiv', cancelled: 'Storniert', checked_in: 'Eingecheckt',
};

export default function AttendeesPage() {
  const { id: eventId }  = useParams<{ id: string }>();
  const [data, setData]       = useState<PaginatedResponse<Attendee> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await attendeesApi.byEvent(Number(eventId), { page, search, status, per_page: 50 });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, status, eventId]);

  const handleExport = async () => {
    try {
      const res = await attendeesApi.export(Number(eventId));
      const csv = toCSV(res.data.data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `teilnehmer-event-${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifications.show({ message: 'Export fehlgeschlagen.', color: 'red' });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" component={Link} to={`/events/${eventId}`}>
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Title order={2}>Teilnehmer</Title>
        </Group>
        <Button leftSection={<IconDownload size={16} />} variant="light" onClick={handleExport}>
          CSV-Export
        </Button>
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
              { value: 'active',     label: 'Aktiv' },
              { value: 'checked_in', label: 'Eingecheckt' },
              { value: 'cancelled',  label: 'Storniert' },
            ]}
            w={180}
          />
          <Button variant="light" onClick={() => { setPage(1); load(); }}>Suchen</Button>
        </Group>
      </Paper>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Teilnehmer</Table.Th>
              <Table.Th>Ticket</Table.Th>
              <Table.Th>Ticket-Nr.</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Check-In</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <Table.Tr key={i}>{Array(5).fill(0).map((_, j) => <Table.Td key={j}><Skeleton h={20} /></Table.Td>)}</Table.Tr>
              ))
            ) : data?.data.length === 0 ? (
              <Table.Tr><Table.Td colSpan={5}><Text ta="center" c="dimmed" py="xl">Keine Teilnehmer</Text></Table.Td></Table.Tr>
            ) : (
              data?.data.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{a.first_name} {a.last_name}</Text>
                    <Text size="xs" c="dimmed">{a.email}</Text>
                  </Table.Td>
                  <Table.Td><Text size="sm">{a.ticket_type?.name}</Text></Table.Td>
                  <Table.Td><Text size="xs" ff="monospace">{a.ticket_number}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLOR[a.status]} variant="light" size="sm">
                      {STATUS_LABEL[a.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {a.checked_in_at ? (
                      <Text size="xs">{formatDateTime(a.checked_in_at)}</Text>
                    ) : (
                      <Text size="xs" c="dimmed">—</Text>
                    )}
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

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines   = rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
  return [headers.join(','), ...lines].join('\n');
}
