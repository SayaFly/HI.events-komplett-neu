import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Paper, Text, TextInput, Button, Badge, Alert,
  Avatar, ActionIcon, Divider, Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconQrcode, IconCheck, IconX, IconArrowLeft, IconSearch, IconRefresh,
} from '@tabler/icons-react';
import { checkInApi } from '@/api';
import { Attendee } from '@/types';
import { formatDateTime } from '@/utils/format';

interface CheckInResult {
  status: 'checked_in' | 'already_checked_in' | 'cancelled' | 'error';
  message: string;
  attendee?: Attendee;
  checked_in_at?: string;
}

export default function CheckInPage() {
  const { id: eventId }       = useParams<{ id: string }>();
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState<CheckInResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleCheckIn = async (ticketNumber?: string) => {
    const num = ticketNumber ?? input.trim();
    if (!num) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await checkInApi.checkIn(num);
      setResult({
        status:   'checked_in',
        message:  res.data.message,
        attendee: res.data.attendee,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { status?: string; message?: string; attendee?: Attendee; checked_in_at?: string } } };
      const d = e.response?.data;
      setResult({
        status:       (d?.status ?? 'error') as CheckInResult['status'],
        message:      d?.message ?? 'Unbekannter Fehler',
        attendee:     d?.attendee,
        checked_in_at: d?.checked_in_at,
      });
    } finally {
      setLoading(false);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleReset = () => { setResult(null); setInput(''); inputRef.current?.focus(); };

  const statusColor = result
    ? { checked_in: 'green', already_checked_in: 'orange', cancelled: 'red', error: 'red' }[result.status]
    : 'gray';

  return (
    <Stack gap="lg" maw={600} mx="auto">
      <Group>
        <ActionIcon variant="subtle" component={Link} to={`/events/${eventId}`}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Title order={2}>Check-In</Title>
      </Group>

      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            Scannen Sie einen QR-Code oder geben Sie die Ticket-Nummer manuell ein.
          </Text>
          <Group gap="sm">
            <TextInput
              ref={inputRef}
              placeholder="Ticket-Nummer eingeben..."
              leftSection={<IconQrcode size={18} />}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
              style={{ flex: 1 }}
              size="lg"
            />
            <Button
              size="lg"
              loading={loading}
              onClick={() => handleCheckIn()}
              leftSection={<IconCheck size={18} />}
            >
              Check-In
            </Button>
          </Group>

          {result && (
            <>
              <Divider />
              <Alert
                color={statusColor}
                title={result.message}
                icon={result.status === 'checked_in' ? <IconCheck size={18} /> : <IconX size={18} />}
              >
                {result.attendee && (
                  <Stack gap="xs" mt="xs">
                    <Group>
                      <Avatar radius="xl" color={statusColor}>
                        {result.attendee.first_name?.[0]}
                      </Avatar>
                      <Box>
                        <Text fw={500}>{result.attendee.first_name} {result.attendee.last_name}</Text>
                        <Text size="sm" c="dimmed">{result.attendee.email}</Text>
                      </Box>
                    </Group>
                    <Text size="sm">
                      <strong>Ticket-Typ:</strong> {result.attendee.ticket_type?.name}
                    </Text>
                    <Text size="sm">
                      <strong>Ticket-Nr.:</strong> {result.attendee.ticket_number}
                    </Text>
                    {result.checked_in_at && (
                      <Text size="sm">
                        <strong>Zuerst eingecheckt:</strong> {formatDateTime(result.checked_in_at)}
                      </Text>
                    )}
                  </Stack>
                )}
              </Alert>
              <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={handleReset}>
                Nächster Scan
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
