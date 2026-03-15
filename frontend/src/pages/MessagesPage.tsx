import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Paper, Table, Badge, ActionIcon, Text,
  Modal, TextInput, Textarea, Button, Skeleton, Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSend, IconTrash, IconArrowLeft, IconMail } from '@tabler/icons-react';
import { messagesApi } from '@/api';
import { Message } from '@/types';
import { formatDateTime } from '@/utils/format';

export default function MessagesPage() {
  const { id: eventId }           = useParams<{ id: string }>();
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving]       = useState(false);

  const form = useForm({
    initialValues: { subject: '', body: '', type: 'email' },
    validate: {
      subject: (v) => !v ? 'Betreff erforderlich' : null,
      body:    (v) => !v ? 'Inhalt erforderlich' : null,
    },
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await messagesApi.list(Number(eventId));
      setMessages(res.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [eventId]);

  const handleCreate = async (values: typeof form.values) => {
    setSaving(true);
    try {
      await messagesApi.create(Number(eventId), values);
      notifications.show({ message: 'Nachricht gespeichert.', color: 'green' });
      close(); load();
    } finally { setSaving(false); }
  };

  const handleSend = async (m: Message) => {
    modals.openConfirmModal({
      title: 'Nachricht senden',
      children: <Text>Nachricht <strong>{m.subject}</strong> an alle Teilnehmer senden?</Text>,
      labels: { confirm: 'Senden', cancel: 'Abbrechen' },
      confirmProps: { color: 'violet' },
      onConfirm: async () => {
        await messagesApi.send(m.id);
        notifications.show({ message: 'Nachricht gesendet.', color: 'green' });
        load();
      },
    });
  };

  const handleDelete = (m: Message) => {
    modals.openConfirmModal({
      title: 'Löschen',
      children: <Text>Nachricht <strong>{m.subject}</strong> löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await messagesApi.delete(m.id);
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
          <Title order={2}>Nachrichten</Title>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>Neue Nachricht</Button>
      </Group>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Betreff</Table.Th>
              <Table.Th>Typ</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Empfänger</Table.Th>
              <Table.Th>Gesendet</Table.Th>
              <Table.Th w={100}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Table.Tr key={i}>{Array(6).fill(0).map((_, j) => <Table.Td key={j}><Skeleton h={20} /></Table.Td>)}</Table.Tr>
              ))
            ) : messages.length === 0 ? (
              <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">Keine Nachrichten</Text></Table.Td></Table.Tr>
            ) : (
              messages.map((m) => (
                <Table.Tr key={m.id}>
                  <Table.Td><Text size="sm" fw={500}>{m.subject}</Text></Table.Td>
                  <Table.Td><Badge variant="light" size="sm">{m.type.toUpperCase()}</Badge></Table.Td>
                  <Table.Td>
                    <Badge
                      color={{ draft: 'gray', sent: 'green', failed: 'red' }[m.status]}
                      variant="light" size="sm"
                    >
                      {{ draft: 'Entwurf', sent: 'Gesendet', failed: 'Fehler' }[m.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text size="sm">{m.recipients_count}</Text></Table.Td>
                  <Table.Td><Text size="sm">{m.sent_at ? formatDateTime(m.sent_at) : '—'}</Text></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {m.status === 'draft' && (
                        <ActionIcon variant="light" color="violet" size="sm" onClick={() => handleSend(m)}>
                          <IconSend size={14} />
                        </ActionIcon>
                      )}
                      {m.status === 'draft' && (
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(m)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title="Neue Nachricht" size="lg">
        <form onSubmit={form.onSubmit(handleCreate)}>
          <Stack gap="sm">
            <TextInput label="Betreff" required {...form.getInputProps('subject')} />
            <Textarea label="Nachrichtentext" rows={8} required {...form.getInputProps('body')} />
            <Text size="xs" c="dimmed">
              Die Nachricht wird an alle aktiven Teilnehmer dieses Events gesendet.
            </Text>
            <Button type="submit" loading={saving}>Als Entwurf speichern</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
