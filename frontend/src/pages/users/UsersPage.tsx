import { useEffect, useState } from 'react';
import {
  Stack, Title, Button, Group, TextInput, Select, Table, Badge,
  ActionIcon, Card, Modal, Text, Switch, Pagination, PasswordInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import { usersApi } from '../../services/api';
import dayjs from 'dayjs';

interface User {
  id: number; name: string; email: string; role: string;
  is_active: boolean; created_at: string; orders_count: number;
}
interface Paginated { data: User[]; current_page: number; last_page: number; total: number; }

const roleColor = (r: string) => ({ admin: 'red', organizer: 'violet', user: 'blue' }[r] ?? 'gray');
const roleLabel = (r: string) => ({ admin: 'Admin', organizer: 'Veranstalter', user: 'Benutzer' }[r] ?? r);

export default function UsersPage() {
  const [data, setData] = useState<Paginated | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: { name: '', email: '', password: '', role: 'user' as string, is_active: true },
    validate: {
      name: (v) => v ? null : 'Name erforderlich',
      email: (v) => /^\S+@\S+$/.test(v) ? null : 'Ungültige E-Mail',
      password: (v) => (!editUser && v.length < 8) ? 'Mindestens 8 Zeichen' : null,
    },
  });

  const load = () => {
    setLoading(true);
    usersApi.list({ search, role, page, per_page: 15 })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, role, page]);

  const openCreate = () => { setEditUser(null); form.reset(); setModalOpen(true); };
  const openEdit = (u: User) => {
    setEditUser(u);
    form.setValues({ name: u.name, email: u.email, password: '', role: u.role, is_active: u.is_active });
    setModalOpen(true);
  };

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...values };
      if (editUser && !values.password) {
        delete payload.password;
      }
      if (editUser) {
        await usersApi.update(editUser.id, payload);
        notifications.show({ message: 'Benutzer aktualisiert', color: 'teal' });
      } else {
        await usersApi.create(payload);
        notifications.show({ message: 'Benutzer erstellt', color: 'teal' });
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Fehler';
      notifications.show({ title: 'Fehler', message: msg, color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (u: User) => {
    modals.openConfirmModal({
      title: 'Benutzer löschen',
      children: <Text>Benutzer <strong>{u.name}</strong> löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        usersApi.delete(u.id).then(() => {
          notifications.show({ message: 'Gelöscht', color: 'teal' });
          load();
        }),
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Benutzer</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Neuer Benutzer</Button>
      </Group>

      <Card>
        <Group mb="md">
          <TextInput
            placeholder="Name oder E-Mail suchen"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Rolle filtern"
            data={[
              { value: 'admin', label: 'Admin' },
              { value: 'organizer', label: 'Veranstalter' },
              { value: 'user', label: 'Benutzer' },
            ]}
            value={role}
            onChange={(v) => { setRole(v); setPage(1); }}
            clearable
            w={180}
          />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>E-Mail</Table.Th>
              <Table.Th>Rolle</Table.Th>
              <Table.Th>Bestellungen</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Registriert</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td><Text fw={500} size="sm">{u.name}</Text></Table.Td>
                <Table.Td><Text size="sm">{u.email}</Text></Table.Td>
                <Table.Td><Badge color={roleColor(u.role)} size="sm">{roleLabel(u.role)}</Badge></Table.Td>
                <Table.Td><Text size="sm">{u.orders_count}</Text></Table.Td>
                <Table.Td>
                  <Badge color={u.is_active ? 'teal' : 'gray'} size="sm">
                    {u.is_active ? 'Aktiv' : 'Deaktiviert'}
                  </Badge>
                </Table.Td>
                <Table.Td><Text size="sm">{dayjs(u.created_at).format('DD.MM.YYYY')}</Text></Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" onClick={() => openEdit(u)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(u)}><IconTrash size={16} /></ActionIcon>
                  </Group>
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
      </Card>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
        radius="md"
      >
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <TextInput label="E-Mail" required {...form.getInputProps('email')} />
            <PasswordInput
              label={editUser ? 'Neues Passwort (leer lassen = unverändert)' : 'Passwort'}
              required={!editUser}
              {...form.getInputProps('password')}
            />
            <Select
              label="Rolle"
              data={[
                { value: 'admin', label: 'Admin' },
                { value: 'organizer', label: 'Veranstalter' },
                { value: 'user', label: 'Benutzer' },
              ]}
              {...form.getInputProps('role')}
            />
            <Switch label="Konto aktiv" {...form.getInputProps('is_active', { type: 'checkbox' })} />
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
