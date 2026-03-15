import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Stack, Title, Button, Group, TextInput, Textarea, Select, Switch,
  Paper, NumberInput, Grid, ActionIcon, Skeleton, Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconDeviceFloppy, IconAlertCircle } from '@tabler/icons-react';
import { eventsApi, categoriesApi, venuesApi } from '@/api';
import { Category, Venue } from '@/types';
import dayjs from 'dayjs';

export default function EventEditPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues]         = useState<Venue[]>([]);

  const form = useForm({
    initialValues: {
      organizer_id:     0,
      title:            '',
      short_description:'',
      description:      '',
      start_date:       null as Date | null,
      end_date:         null as Date | null,
      status:           'draft',
      visibility:       'public',
      venue_id:         '',
      category_id:      '',
      is_online:        false,
      online_url:       '',
      website:          '',
      max_attendees:    undefined as number | undefined,
      cover_image:      '',
      currency:         'EUR',
      is_featured:      false,
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, catRes] = await Promise.all([
          eventsApi.get(Number(id)),
          categoriesApi.list(),
        ]);
        const event = evRes.data;
        setCategories(catRes.data || []);

        if (event.organizer_id) {
          const venRes = await venuesApi.list(event.organizer_id);
          setVenues(venRes.data || []);
        }

        form.setValues({
          organizer_id:     event.organizer_id,
          title:            event.title,
          short_description:event.short_description ?? '',
          description:      event.description ?? '',
          start_date:       event.start_date ? new Date(event.start_date) : null,
          end_date:         event.end_date ? new Date(event.end_date) : null,
          status:           event.status,
          visibility:       event.visibility,
          venue_id:         event.venue_id ? String(event.venue_id) : '',
          category_id:      event.category_id ? String(event.category_id) : '',
          is_online:        event.is_online,
          online_url:       event.online_url ?? '',
          website:          event.website ?? '',
          max_attendees:    event.max_attendees,
          cover_image:      event.cover_image ?? '',
          currency:         event.currency,
          is_featured:      event.is_featured,
        });
      } catch {
        setError('Event konnte nicht geladen werden.');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        venue_id:    values.venue_id ? Number(values.venue_id) : null,
        category_id: values.category_id ? Number(values.category_id) : null,
        start_date:  values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD HH:mm:ss') : undefined,
        end_date:    values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD HH:mm:ss') : null,
      };
      await eventsApi.update(values.organizer_id, Number(id), payload);
      notifications.show({ message: 'Event gespeichert.', color: 'green' });
      navigate(`/events/${id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      notifications.show({ message: e.response?.data?.message ?? 'Fehler.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Skeleton height={500} radius="md" />;

  return (
    <Stack gap="lg">
      <Group>
        <ActionIcon variant="subtle" component={Link} to={`/events/${id}`}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Title order={2}>Event bearbeiten</Title>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red">{error}</Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <TextInput label="Titel" required {...form.getInputProps('title')} />
                <TextInput label="Kurzbeschreibung" {...form.getInputProps('short_description')} />
                <Textarea label="Beschreibung" rows={6} {...form.getInputProps('description')} />
                <Grid>
                  <Grid.Col span={6}>
                    <DateTimePicker label="Startdatum" required {...form.getInputProps('start_date')} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <DateTimePicker label="Enddatum" {...form.getInputProps('end_date')} />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="sm">
              <Paper p="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Select
                    label="Status"
                    data={[
                      { value: 'draft',     label: 'Entwurf' },
                      { value: 'published', label: 'Veröffentlicht' },
                      { value: 'cancelled', label: 'Abgesagt' },
                      { value: 'completed', label: 'Abgeschlossen' },
                    ]}
                    {...form.getInputProps('status')}
                  />
                  <Select
                    label="Sichtbarkeit"
                    data={[
                      { value: 'public',   label: 'Öffentlich' },
                      { value: 'private',  label: 'Privat' },
                      { value: 'unlisted', label: 'Nicht gelistet' },
                    ]}
                    {...form.getInputProps('visibility')}
                  />
                  <Select
                    label="Kategorie"
                    clearable
                    data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                    {...form.getInputProps('category_id')}
                  />
                  <Select
                    label="Veranstaltungsort"
                    clearable
                    data={venues.map((v) => ({ value: String(v.id), label: `${v.name}, ${v.city}` }))}
                    {...form.getInputProps('venue_id')}
                  />
                  <Switch label="Online-Event" {...form.getInputProps('is_online', { type: 'checkbox' })} />
                  {form.values.is_online && (
                    <TextInput label="Online-URL" {...form.getInputProps('online_url')} />
                  )}
                  <NumberInput label="Max. Teilnehmer" min={1} {...form.getInputProps('max_attendees')} />
                  <TextInput label="Cover-Bild URL" {...form.getInputProps('cover_image')} />
                  <Switch label="Featured Event" {...form.getInputProps('is_featured', { type: 'checkbox' })} />
                </Stack>
              </Paper>
              <Button type="submit" loading={loading} leftSection={<IconDeviceFloppy size={16} />} fullWidth>
                Änderungen speichern
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      </form>
    </Stack>
  );
}
