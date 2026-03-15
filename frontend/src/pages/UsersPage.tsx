import { useEffect, useState } from 'react';
import {
  Stack, Title, Group, Button, Paper, Table, Badge, ActionIcon, Text,
  Modal, TextInput, Select, Skeleton, Menu, PasswordInput, Pagination,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconDotsVertical } from '@tabler/icons-react';
import { usersApi } from '@/api';
import { User, PaginatedResponse } from '@/types';
import { formatDate } from '@/utils/format';

const ROLE_COLOR: Record<string, string> = {
  admin: 'red', organizer: 'violet', staff: 'blue', attendee: 'gray',
};
const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator', organizer: 'Veranstalter', staff: 'Mitarbeiter', attendee: 'Besucher',
};

export default function UsersPage() {
  const [data, setData]           = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [editing, setEditing]     = useState<User | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving]       = useState(false);

  const form = useForm({
    initialValues: { name: '', email: '', password: '', role: 'attendee' },
    validate: {
      name:  (v) => !v ? 'Name erforderlich' : null,
      email: (v) => !/^\S+@\S+$/.test(v) ? 'Ungültige E-Mail' : null,
      password: (v, vals) => !editing && !v ? 'Passwort erforderlich' : null,
    },
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, per_page: 25 });
      setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const openCreate = () => { setEditing(null); form.reset(); open(); };
  const openEdit   = (u: User) => {
    setEditing(u);
    form.setValues({ name: u.name, email: u.email, password: '', role: u.role });
    open();
  };

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      const payload: Record<string, string> = { name: values.name, email: values.email, role: values.role };
      if (values.password) payload.password = values.password;

      if (editing) {
        await usersApi.update(editing.id, payload);
        notifications.show({ message: 'Benutzer aktualisiert.', color: 'green' });
      } else {
        await usersApi.create({ ...payload, password: values.password });
        notifications.show({ message: 'Benutzer erstellt.', color: 'green' });
      }
      close(); load();
    } finally { setSaving(false); }
  };

  const handleDelete = (u: User) => {
    modals.openConfirmModal({
      title: 'Benutzer löschen',
      children: <Text>Möchten Sie <strong>{u.name}</strong> wirklich löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await usersApi.delete(u.id);
        notifications.show({ message: 'Gelöscht.', color: 'green' });
        load();
      },
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Benutzerverwaltung</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Neuer Benutzer</Button>
      </Group>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>E-Mail</Table.Th>
              <Table.Th>Rolle</Table.Th>
              <Table.Th>Erstellt</Table.Th>
              <Table.Th w={60}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <Table.Tr key={i}>{Array(5).fill(0).map((_, j) => <Table.Td key={j}><Skeleton h={20} /></Table.Td>)}</Table.Tr>
              ))
            ) : data?.data.length === 0 ? (
              <Table.Tr><Table.Td colSpan={5}><Text ta="center" c="dimmed" py="xl">Keine Benutzer</Text></Table.Td></Table.Tr>
            ) : (
              data?.data.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td><Text size="sm" fw={500}>{u.name}</Text></Table.Td>
                  <Table.Td><Text size="sm">{u.email}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={ROLE_COLOR[u.role]} variant="light" size="sm">
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text size="sm">{formatDate(u.created_at)}</Text></Table.Td>
                  <Table.Td>
                    <Menu shadow="sm" width={140}>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDotsVertical size={14} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(u)}>Bearbeiten</Menu.Item>
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(u)}>Löschen</Menu.Item>
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

      <Modal opened={opened} onClose={close} title={editing ? 'Benutzer bearbeiten' : 'Neuer Benutzer'} size="md">
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <TextInput label="E-Mail" required {...form.getInputProps('email')} />
            <PasswordInput
              label={editing ? 'Neues Passwort (leer = unverändert)' : 'Passwort'}
              required={!editing}
              {...form.getInputProps('password')}
            />
            <Select
              label="Rolle"
              data={[
                { value: 'admin',     label: 'Administrator' },
                { value: 'organizer', label: 'Veranstalter' },
                { value: 'staff',     label: 'Mitarbeiter' },
                { value: 'attendee',  label: 'Besucher' },
              ]}
              {...form.getInputProps('role')}
            />
            <Button type="submit" loading={saving}>{editing ? 'Speichern' : 'Erstellen'}</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
