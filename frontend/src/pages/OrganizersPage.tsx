import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stack, Title, Group, Button, Paper, Table, Badge, ActionIcon, Text,
  Modal, TextInput, Textarea, Skeleton, Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconEye, IconDotsVertical } from '@tabler/icons-react';
import { organizersApi } from '@/api';
import { Organizer } from '@/types';

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<Organizer | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving]       = useState(false);

  const form = useForm({
    initialValues: {
      name: '', description: '', email: '', phone: '', website: '',
      address: '', city: '', zip: '', country: 'DE', currency: 'EUR',
    },
    validate: { name: (v) => !v ? 'Name erforderlich' : null },
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await organizersApi.list();
      setOrganizers(res.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); form.reset(); open(); };
  const openEdit   = (o: Organizer) => {
    setEditing(o);
    form.setValues({
      name: o.name, description: o.description ?? '', email: o.email ?? '',
      phone: o.phone ?? '', website: o.website ?? '', address: o.address ?? '',
      city: o.city ?? '', zip: o.zip ?? '', country: o.country, currency: o.currency,
    });
    open();
  };

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      if (editing) {
        await organizersApi.update(editing.id, values);
        notifications.show({ message: 'Veranstalter aktualisiert.', color: 'green' });
      } else {
        await organizersApi.create(values);
        notifications.show({ message: 'Veranstalter erstellt.', color: 'green' });
      }
      close(); load();
    } finally { setSaving(false); }
  };

  const handleDelete = (o: Organizer) => {
    modals.openConfirmModal({
      title: 'Veranstalter löschen',
      children: <Text>Möchten Sie <strong>{o.name}</strong> löschen? Alle Events werden ebenfalls gelöscht.</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await organizersApi.delete(o.id);
        notifications.show({ message: 'Gelöscht.', color: 'green' });
        load();
      },
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Veranstalter</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Neuer Veranstalter</Button>
      </Group>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>E-Mail</Table.Th>
              <Table.Th>Stadt</Table.Th>
              <Table.Th>Events</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th w={60}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Table.Tr key={i}>{Array(6).fill(0).map((_, j) => <Table.Td key={j}><Skeleton h={20} /></Table.Td>)}</Table.Tr>
              ))
            ) : organizers.length === 0 ? (
              <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">Keine Veranstalter</Text></Table.Td></Table.Tr>
            ) : (
              organizers.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{o.name}</Text>
                    <Text size="xs" c="dimmed">{o.slug}</Text>
                  </Table.Td>
                  <Table.Td><Text size="sm">{o.email ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{o.city ?? '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{o.events_count ?? 0}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={o.is_active ? 'green' : 'gray'} variant="light" size="sm">
                      {o.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="sm" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDotsVertical size={14} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />} component={Link} to={`/organizers/${o.id}`}>
                          Details
                        </Menu.Item>
                        <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(o)}>Bearbeiten</Menu.Item>
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(o)}>Löschen</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editing ? 'Veranstalter bearbeiten' : 'Neuer Veranstalter'} size="lg">
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <Textarea label="Beschreibung" {...form.getInputProps('description')} />
            <Group grow>
              <TextInput label="E-Mail" {...form.getInputProps('email')} />
              <TextInput label="Telefon" {...form.getInputProps('phone')} />
            </Group>
            <TextInput label="Website" {...form.getInputProps('website')} />
            <TextInput label="Adresse" {...form.getInputProps('address')} />
            <Group grow>
              <TextInput label="Stadt" {...form.getInputProps('city')} />
              <TextInput label="PLZ" {...form.getInputProps('zip')} />
            </Group>
            <Group grow>
              <TextInput label="Land (ISO 2)" {...form.getInputProps('country')} maxLength={2} />
              <TextInput label="Währung (ISO 3)" {...form.getInputProps('currency')} maxLength={3} />
            </Group>
            <Button type="submit" loading={saving}>{editing ? 'Speichern' : 'Erstellen'}</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
