import { useEffect, useState } from 'react';
import {
  Stack, Title, Button, Group, TextInput, Select, Table, Badge,
  ActionIcon, Card, Modal, Text, NumberInput, Switch,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { ticketsApi, eventsApi } from '../../services/api';

interface TicketEvent { id: number; title: string; }
interface Ticket {
  id: number; name: string; type: string; price: number;
  quantity: number; quantity_sold: number; is_active: boolean;
  event?: TicketEvent;
}

const typeLabel = (t: string) =>
  ({ standard: 'Standard', vip: 'VIP', free: 'Kostenlos', early_bird: 'Frühbucher' }[t] ?? t);
const typeColor = (t: string) =>
  ({ standard: 'blue', vip: 'violet', free: 'teal', early_bird: 'orange' }[t] ?? 'gray');

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: {
      event_id: '', name: '', description: '', price: 0,
      quantity: 100, type: 'standard' as string,
      sale_start: null as Date | null, sale_end: null as Date | null,
      is_active: true,
    },
    validate: {
      event_id: (v) => v ? null : 'Veranstaltung erforderlich',
      name: (v) => v ? null : 'Name erforderlich',
      price: (v) => v >= 0 ? null : 'Preis muss >= 0 sein',
      quantity: (v) => v > 0 ? null : 'Menge muss > 0 sein',
    },
  });

  const load = () => {
    setLoading(true);
    const params = eventFilter ? { event_id: eventFilter } : {};
    ticketsApi.list(params).then((r) => setTickets(r.data.data ?? r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    eventsApi.list({ per_page: 100 }).then((r) => setEvents(r.data.data ?? []));
    load();
  }, []);

  useEffect(() => { load(); }, [eventFilter]);

  const openCreate = () => { setEditTicket(null); form.reset(); setModalOpen(true); };
  const openEdit = (t: Ticket) => {
    setEditTicket(t);
    form.setValues({
      event_id: String(t.event?.id ?? ''),
      name: t.name, description: '', price: t.price,
      quantity: t.quantity, type: t.type, is_active: t.is_active,
      sale_start: null, sale_end: null,
    });
    setModalOpen(true);
  };

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      const payload = { ...values, event_id: Number(values.event_id) };
      if (editTicket) {
        await ticketsApi.update(editTicket.id, payload);
        notifications.show({ message: 'Ticket aktualisiert', color: 'teal' });
      } else {
        await ticketsApi.create(payload);
        notifications.show({ message: 'Ticket erstellt', color: 'teal' });
      }
      setModalOpen(false);
      load();
    } catch {
      notifications.show({ title: 'Fehler', message: 'Speichern fehlgeschlagen', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (t: Ticket) => {
    modals.openConfirmModal({
      title: 'Ticket löschen',
      children: <Text>Ticket <strong>{t.name}</strong> löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        ticketsApi.delete(t.id).then(() => {
          notifications.show({ message: 'Gelöscht', color: 'teal' });
          load();
        }),
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Tickets</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Neues Ticket</Button>
      </Group>

      <Card>
        <Select
          placeholder="Nach Veranstaltung filtern"
          data={events.map((e) => ({ value: String(e.id), label: e.title }))}
          value={eventFilter}
          onChange={setEventFilter}
          clearable
          mb="md"
          w={300}
        />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Veranstaltung</Table.Th>
              <Table.Th>Typ</Table.Th>
              <Table.Th>Preis</Table.Th>
              <Table.Th>Verfügbar</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tickets.map((t) => (
              <Table.Tr key={t.id}>
                <Table.Td><Text fw={500} size="sm">{t.name}</Text></Table.Td>
                <Table.Td><Text size="sm">{t.event?.title ?? '–'}</Text></Table.Td>
                <Table.Td><Badge color={typeColor(t.type)} size="sm">{typeLabel(t.type)}</Badge></Table.Td>
                <Table.Td>
                  <Text size="sm">{t.price === 0 ? 'Kostenlos' : `${Number(t.price).toFixed(2)} €`}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{t.quantity - t.quantity_sold} / {t.quantity}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={t.is_active ? 'teal' : 'gray'} size="sm">
                    {t.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon variant="subtle" onClick={() => openEdit(t)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(t)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTicket ? 'Ticket bearbeiten' : 'Neues Ticket'}
        radius="md"
      >
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack>
            <Select
              label="Veranstaltung"
              required
              data={events.map((e) => ({ value: String(e.id), label: e.title }))}
              {...form.getInputProps('event_id')}
            />
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <Select
              label="Typ"
              data={[
                { value: 'standard', label: 'Standard' },
                { value: 'vip', label: 'VIP' },
                { value: 'free', label: 'Kostenlos' },
                { value: 'early_bird', label: 'Frühbucher' },
              ]}
              {...form.getInputProps('type')}
            />
            <NumberInput label="Preis (€)" min={0} decimalScale={2} {...form.getInputProps('price')} />
            <NumberInput label="Anzahl verfügbar" min={1} {...form.getInputProps('quantity')} />
            <DateTimePicker label="Verkaufsstart" {...form.getInputProps('sale_start')} clearable />
            <DateTimePicker label="Verkaufsende" {...form.getInputProps('sale_end')} clearable />
            <Switch label="Aktiv" {...form.getInputProps('is_active', { type: 'checkbox' })} />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setModalOpen(false)}>Abbrechen</Button>
              <Button type="submit" loading={saving}>Speichern</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
