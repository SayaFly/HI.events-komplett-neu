import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Button, Paper, Table, Badge, ActionIcon, Text,
  Modal, TextInput, Textarea, Select, NumberInput, Switch, Skeleton, Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconArrowLeft, IconDotsVertical } from '@tabler/icons-react';
import { ticketTypesApi } from '@/api';
import { TicketType } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function TicketsPage() {
  const { id: eventId }  = useParams<{ id: string }>();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: {
      name: '', description: '', price: 0, quantity: undefined as number | undefined,
      min_per_order: 1, max_per_order: undefined as number | undefined,
      type: 'paid', status: 'active', tax_rate: 19, is_hidden: false,
    },
    validate: { name: (v) => !v ? 'Name erforderlich' : null },
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await ticketTypesApi.list(Number(eventId));
      setTickets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  const openCreate = () => {
    setEditing(null);
    form.reset();
    open();
  };

  const openEdit = (t: TicketType) => {
    setEditing(t);
    form.setValues({
      name: t.name, description: t.description ?? '',
      price: t.price, quantity: t.quantity,
      min_per_order: t.min_per_order, max_per_order: t.max_per_order,
      type: t.type, status: t.status, tax_rate: t.tax_rate, is_hidden: t.is_hidden,
    });
    open();
  };

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      if (editing) {
        await ticketTypesApi.update(Number(eventId), editing.id, values);
        notifications.show({ message: 'Ticket-Typ aktualisiert.', color: 'green' });
      } else {
        await ticketTypesApi.create(Number(eventId), values);
        notifications.show({ message: 'Ticket-Typ erstellt.', color: 'green' });
      }
      close();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (t: TicketType) => {
    modals.openConfirmModal({
      title: 'Ticket-Typ löschen',
      children: <Text>Möchten Sie <strong>{t.name}</strong> wirklich löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await ticketTypesApi.delete(Number(eventId), t.id);
        notifications.show({ message: 'Gelöscht.', color: 'green' });
        load();
      },
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" component={Link} to={`/events/${eventId}`}>
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Title order={2}>Ticket-Typen</Title>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Neuer Ticket-Typ
        </Button>
      </Group>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Typ</Table.Th>
              <Table.Th>Preis</Table.Th>
              <Table.Th>Kontingent</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>MwSt.</Table.Th>
              <Table.Th w={60}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Table.Tr key={i}>{Array(7).fill(0).map((_, j) => <Table.Td key={j}><Skeleton h={20} /></Table.Td>)}</Table.Tr>
              ))
            ) : tickets.length === 0 ? (
              <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="xl">Keine Ticket-Typen</Text></Table.Td></Table.Tr>
            ) : (
              tickets.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td><Text size="sm" fw={500}>{t.name}</Text></Table.Td>
                  <Table.Td><Badge variant="light" size="sm">{{ paid: 'Kostenpflichtig', free: 'Kostenlos', donation: 'Spende' }[t.type]}</Badge></Table.Td>
                  <Table.Td>{t.type === 'free' ? 'Kostenlos' : formatCurrency(t.price)}</Table.Td>
                  <Table.Td>{t.quantity ?? '∞'}</Table.Td>
                  <Table.Td>
                    <Badge color={{ active: 'green', inactive: 'gray', sold_out: 'red' }[t.status]} variant="light" size="sm">
                      {{ active: 'Aktiv', inactive: 'Inaktiv', sold_out: 'Ausverkauft' }[t.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t.tax_rate}%</Table.Td>
                  <Table.Td>
                    <Menu shadow="sm" width={140}>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDotsVertical size={14} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(t)}>Bearbeiten</Menu.Item>
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(t)}>Löschen</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editing ? 'Ticket-Typ bearbeiten' : 'Neuer Ticket-Typ'} size="md">
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <Textarea label="Beschreibung" {...form.getInputProps('description')} />
            <Select label="Typ" data={[
              { value: 'paid', label: 'Kostenpflichtig' },
              { value: 'free', label: 'Kostenlos' },
              { value: 'donation', label: 'Spende' },
            ]} {...form.getInputProps('type')} />
            {form.values.type === 'paid' && (
              <NumberInput label="Preis (€)" min={0} decimalScale={2} {...form.getInputProps('price')} />
            )}
            <NumberInput label="Kontingent (leer = unbegrenzt)" min={1} {...form.getInputProps('quantity')} />
            <Group grow>
              <NumberInput label="Min. pro Bestellung" min={1} {...form.getInputProps('min_per_order')} />
              <NumberInput label="Max. pro Bestellung" min={1} {...form.getInputProps('max_per_order')} />
            </Group>
            <NumberInput label="MwSt. (%)" min={0} max={100} {...form.getInputProps('tax_rate')} />
            <Select label="Status" data={[
              { value: 'active', label: 'Aktiv' },
              { value: 'inactive', label: 'Inaktiv' },
            ]} {...form.getInputProps('status')} />
            <Switch label="Versteckt (nicht öffentlich sichtbar)" {...form.getInputProps('is_hidden', { type: 'checkbox' })} />
            <Button type="submit" loading={saving}>{editing ? 'Speichern' : 'Erstellen'}</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
