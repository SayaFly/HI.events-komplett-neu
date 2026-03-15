import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stack, Title, Group, Paper, Grid, Text, Badge, Skeleton,
  Table, ActionIcon, SimpleGrid, Button,
} from '@mantine/core';
import { IconArrowLeft, IconCalendarEvent, IconBuilding } from '@tabler/icons-react';
import { organizersApi } from '@/api';
import { Organizer } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function OrganizerDetailPage() {
  const { id }                    = useParams<{ id: string }>();
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [stats, setStats]         = useState<Record<string, number | string> | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      organizersApi.get(Number(id)),
      organizersApi.stats(Number(id)),
    ]).then(([o, s]) => {
      setOrganizer(o.data);
      setStats(s.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton height={400} radius="md" />;
  if (!organizer) return <Text>Veranstalter nicht gefunden</Text>;

  return (
    <Stack gap="lg">
      <Group>
        <ActionIcon variant="subtle" component={Link} to="/organizers">
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Title order={2}>{organizer.name}</Title>
        <Badge color={organizer.is_active ? 'green' : 'gray'} variant="light">
          {organizer.is_active ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </Group>

      {stats && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {[
            { label: 'Events gesamt',   value: stats.total_events },
            { label: 'Aktive Events',   value: stats.active_events },
            { label: 'Umsatz gesamt',   value: formatCurrency(Number(stats.total_revenue)) },
            { label: 'Teilnehmer',      value: stats.total_attendees },
          ].map((s) => (
            <Paper key={s.label} p="sm" radius="md" withBorder ta="center">
              <Text size="xl" fw={700} c="violet">{s.value}</Text>
              <Text size="xs" c="dimmed">{s.label}</Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="md">Kontaktdaten</Title>
            <Stack gap="xs">
              {[
                ['E-Mail', organizer.email],
                ['Telefon', organizer.phone],
                ['Website', organizer.website],
                ['Adresse', organizer.address],
                ['Stadt', organizer.city],
                ['Land', organizer.country],
                ['Währung', organizer.currency],
              ].map(([label, value]) => value && (
                <Group key={label} justify="space-between">
                  <Text c="dimmed" size="sm">{label}</Text>
                  <Text size="sm">{value}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder h="100%">
            <Title order={4} mb="md">Schnellzugriff</Title>
            <Stack gap="xs">
              <Button
                leftSection={<IconCalendarEvent size={16} />}
                variant="light"
                component={Link}
                to={`/events?organizer=${id}`}
                fullWidth
              >
                Events anzeigen
              </Button>
              <Button
                leftSection={<IconBuilding size={16} />}
                variant="light"
                component={Link}
                to="/venues"
                fullWidth
              >
                Veranstaltungsorte
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
