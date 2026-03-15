import { useEffect, useState } from 'react';
import {
  Stack, Title, Button, Group, TextInput, Table, Badge,
  ActionIcon, Card, Modal, ColorInput, Text, Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { categoriesApi } from '../../services/api';

interface Category {
  id: number; name: string; slug: string; description: string;
  icon: string; color: string; is_active: boolean; events_count: number;
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: { name: '', description: '', icon: '', color: '#7950f2', is_active: true },
    validate: { name: (v) => v ? null : 'Name erforderlich' },
  });

  const load = () => {
    setLoading(true);
    categoriesApi.list().then((r) => setCats(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditCat(null); form.reset(); setModalOpen(true); };
  const openEdit = (cat: Category) => {
    setEditCat(cat);
    form.setValues({ name: cat.name, description: cat.description, icon: cat.icon, color: cat.color, is_active: cat.is_active });
    setModalOpen(true);
  };

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      if (editCat) {
        await categoriesApi.update(editCat.id, values);
        notifications.show({ message: 'Kategorie aktualisiert', color: 'teal' });
      } else {
        await categoriesApi.create(values);
        notifications.show({ message: 'Kategorie erstellt', color: 'teal' });
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

  const handleDelete = (cat: Category) => {
    modals.openConfirmModal({
      title: 'Kategorie löschen',
      children: <Text>Möchten Sie <strong>{cat.name}</strong> löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        categoriesApi.delete(cat.id)
          .then(() => {
            notifications.show({ message: 'Kategorie gelöscht', color: 'teal' });
            load();
          })
          .catch((e: { response?: { data?: { message?: string } } }) =>
            notifications.show({ title: 'Fehler', message: e.response?.data?.message, color: 'red' })
          ),
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Kategorien</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Neue Kategorie</Button>
      </Group>

      <Card>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Beschreibung</Table.Th>
              <Table.Th>Veranstaltungen</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {cats.map((cat) => (
              <Table.Tr key={cat.id}>
                <Table.Td>
                  <Group gap="xs">
                    {cat.color && (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                    )}
                    <Text fw={500} size="sm">{cat.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td><Text size="sm" c="dimmed">{cat.description || '–'}</Text></Table.Td>
                <Table.Td><Badge variant="light">{cat.events_count}</Badge></Table.Td>
                <Table.Td>
                  <Badge color={cat.is_active ? 'teal' : 'gray'} size="sm">
                    {cat.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon variant="subtle" onClick={() => openEdit(cat)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(cat)}><IconTrash size={16} /></ActionIcon>
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
        title={editCat ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
        radius="md"
      >
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <TextInput label="Beschreibung" {...form.getInputProps('description')} />
            <TextInput label="Icon (z. B. music, sport)" {...form.getInputProps('icon')} />
            <ColorInput label="Farbe" {...form.getInputProps('color')} />
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
