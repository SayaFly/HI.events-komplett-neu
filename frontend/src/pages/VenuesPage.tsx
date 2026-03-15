import { useEffect, useState } from 'react';
import {
  Stack, Title, Group, Button, Paper, Table, Badge, ActionIcon, Text,
  Modal, TextInput, Textarea, Skeleton, Menu, Select, NumberInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconDotsVertical, IconBuilding } from '@tabler/icons-react';
import { organizersApi, venuesApi } from '@/api';
import { Venue, Organizer } from '@/types';

export default function VenuesPage() {
  const [venues, setVenues]       = useState<Venue[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [loading, setLoading]     = useState(false);
  const [editing, setEditing]     = useState<Venue | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving]       = useState(false);

  const form = useForm({
    initialValues: {
      name: '', description: '', address: '', city: '',
      state: '', zip: '', country: 'DE', capacity: undefined as number | undefined,
      website: '', phone: '', email: '', is_online: false,
    },
    validate: {
      name:    (v) => !v ? 'Name erforderlich' : null,
      address: (v) => !v ? 'Adresse erforderlich' : null,
      city:    (v) => !v ? 'Stadt erforderlich' : null,
    },
  });

  const load = async () => {
    if (!selectedOrg) return;
    setLoading(true);
    try {
      const res = await venuesApi.list(selectedOrg);
      setVenues(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    organizersApi.list().then((r) => {
      const orgs = r.data.data || [];
      setOrganizers(orgs);
      if (orgs.length) setSelectedOrg(orgs[0].id);
    });
  }, []);

  useEffect(() => { load(); }, [selectedOrg]);

  const openCreate = () => { setEditing(null); form.reset(); open(); };
  const openEdit   = (v: Venue) => {
    setEditing(v);
    form.setValues({
      name: v.name, description: v.description ?? '', address: v.address,
      city: v.city, state: v.state ?? '', zip: v.zip ?? '',
      country: v.country, capacity: v.capacity, website: v.website ?? '',
      phone: v.phone ?? '', email: v.email ?? '', is_online: v.is_online,
    });
    open();
  };

  const handleSave = async (values: typeof form.values) => {
    if (!selectedOrg) return;
    setSaving(true);
    try {
      if (editing) {
        await venuesApi.update(selectedOrg, editing.id, values);
        notifications.show({ message: 'Veranstaltungsort aktualisiert.', color: 'green' });
      } else {
        await venuesApi.create(selectedOrg, values);
        notifications.show({ message: 'Veranstaltungsort erstellt.', color: 'green' });
      }
      close(); load();
    } finally { setSaving(false); }
  };

  const handleDelete = (v: Venue) => {
    modals.openConfirmModal({
      title: 'Löschen',
      children: <Text>Möchten Sie <strong>{v.name}</strong> löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await venuesApi.delete(selectedOrg!, v.id);
        notifications.show({ message: 'Gelöscht.', color: 'green' });
        load();
      },
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Veranstaltungsorte</Title>
        <Group>
          <Select
            placeholder="Veranstalter"
            value={selectedOrg ? String(selectedOrg) : null}
            onChange={(v) => setSelectedOrg(v ? Number(v) : null)}
            data={organizers.map((o) => ({ value: String(o.id), label: o.name }))}
            w={200}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} disabled={!selectedOrg}>
            Neuer Ort
          </Button>
        </Group>
      </Group>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Adresse</Table.Th>
              <Table.Th>Stadt</Table.Th>
              <Table.Th>Kapazität</Table.Th>
              <Table.Th>Typ</Table.Th>
              <Table.Th w={60}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Table.Tr key={i}>{Array(6).fill(0).map((_, j) => <Table.Td key={j}><Skeleton h={20} /></Table.Td>)}</Table.Tr>
              ))
            ) : venues.length === 0 ? (
              <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">Keine Veranstaltungsorte</Text></Table.Td></Table.Tr>
            ) : (
              venues.map((v) => (
                <Table.Tr key={v.id}>
                  <Table.Td><Text size="sm" fw={500}>{v.name}</Text></Table.Td>
                  <Table.Td><Text size="sm">{v.address}</Text></Table.Td>
                  <Table.Td><Text size="sm">{v.city}</Text></Table.Td>
                  <Table.Td><Text size="sm">{v.capacity ?? '—'}</Text></Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm" color={v.is_online ? 'blue' : 'violet'}>
                      {v.is_online ? 'Online' : 'Vor Ort'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="sm" width={140}>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDotsVertical size={14} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(v)}>Bearbeiten</Menu.Item>
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(v)}>Löschen</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editing ? 'Ort bearbeiten' : 'Neuer Veranstaltungsort'} size="md">
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <TextInput label="Adresse" required {...form.getInputProps('address')} />
            <Group grow>
              <TextInput label="Stadt" required {...form.getInputProps('city')} />
              <TextInput label="PLZ" {...form.getInputProps('zip')} />
            </Group>
            <Group grow>
              <TextInput label="Bundesland" {...form.getInputProps('state')} />
              <TextInput label="Land (ISO)" {...form.getInputProps('country')} maxLength={2} />
            </Group>
            <NumberInput label="Kapazität" min={1} {...form.getInputProps('capacity')} />
            <TextInput label="Website" {...form.getInputProps('website')} />
            <Group grow>
              <TextInput label="Telefon" {...form.getInputProps('phone')} />
              <TextInput label="E-Mail" {...form.getInputProps('email')} />
            </Group>
            <Button type="submit" loading={saving}>{editing ? 'Speichern' : 'Erstellen'}</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
