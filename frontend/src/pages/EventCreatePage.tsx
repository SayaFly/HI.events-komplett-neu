import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Title, Button, Group, TextInput, Textarea, Select, Switch,
  Paper, NumberInput, Grid, ActionIcon, FileInput, Text, Loader, Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconDeviceFloppy, IconUpload } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { eventsApi, organizersApi, categoriesApi, venuesApi } from '@/api';
import { Organizer, Category, Venue } from '@/types';
import dayjs from 'dayjs';

export default function EventCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues]         = useState<Venue[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);

  const form = useForm({
    initialValues: {
      organizer_id:     '',
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
    validate: {
      title:        (v) => v.length < 3 ? 'Titel zu kurz' : null,
      organizer_id: (v) => !v ? 'Veranstalter erforderlich' : null,
      start_date:   (v) => !v ? 'Startdatum erforderlich' : null,
    },
  });

  useEffect(() => {
    Promise.all([organizersApi.list(), categoriesApi.list()]).then(([o, c]) => {
      setOrganizers(o.data.data || []);
      setCategories(c.data || []);
    });
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      venuesApi.list(selectedOrg).then((r) => setVenues(r.data || []));
    }
  }, [selectedOrg]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        organizer_id: Number(values.organizer_id),
        venue_id:     values.venue_id ? Number(values.venue_id) : undefined,
        category_id:  values.category_id ? Number(values.category_id) : undefined,
        start_date:   values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD HH:mm:ss') : undefined,
        end_date:     values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD HH:mm:ss') : undefined,
      };
      const res = await eventsApi.create(Number(values.organizer_id), payload);
      notifications.show({ message: 'Event erstellt.', color: 'green' });
      navigate(`/events/${res.data.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      notifications.show({ message: e.response?.data?.message ?? 'Fehler.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group>
        <ActionIcon variant="subtle" component={Link} to="/events">
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Title order={2}>Neues Event erstellen</Title>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Select
                  label="Veranstalter"
                  placeholder="Veranstalter auswählen"
                  data={organizers.map((o) => ({ value: String(o.id), label: o.name }))}
                  required
                  {...form.getInputProps('organizer_id')}
                  onChange={(v) => {
                    form.setFieldValue('organizer_id', v ?? '');
                    setSelectedOrg(v ? Number(v) : null);
                  }}
                />
                <TextInput
                  label="Titel"
                  placeholder="Event-Titel"
                  required
                  {...form.getInputProps('title')}
                />
                <TextInput
                  label="Kurzbeschreibung"
                  placeholder="Kurze Beschreibung"
                  {...form.getInputProps('short_description')}
                />
                <Textarea
                  label="Beschreibung"
                  placeholder="Ausführliche Beschreibung des Events"
                  rows={6}
                  {...form.getInputProps('description')}
                />
                <Grid>
                  <Grid.Col span={6}>
                    <DateTimePicker
                      label="Startdatum & Uhrzeit"
                      placeholder="Datum & Uhrzeit wählen"
                      required
                      {...form.getInputProps('start_date')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <DateTimePicker
                      label="Enddatum & Uhrzeit"
                      placeholder="Optional"
                      {...form.getInputProps('end_date')}
                    />
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
                    placeholder="Kategorie wählen"
                    clearable
                    data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                    {...form.getInputProps('category_id')}
                  />
                  <Select
                    label="Veranstaltungsort"
                    placeholder="Ort wählen"
                    clearable
                    data={venues.map((v) => ({ value: String(v.id), label: `${v.name}, ${v.city}` }))}
                    {...form.getInputProps('venue_id')}
                  />
                  <Switch
                    label="Online-Event"
                    {...form.getInputProps('is_online', { type: 'checkbox' })}
                  />
                  {form.values.is_online && (
                    <TextInput
                      label="Online-URL"
                      placeholder="http://..."
                      {...form.getInputProps('online_url')}
                    />
                  )}
                  <NumberInput
                    label="Max. Teilnehmer"
                    placeholder="Unbegrenzt"
                    min={1}
                    {...form.getInputProps('max_attendees')}
                  />
                  <TextInput
                    label="Cover-Bild URL"
                    placeholder="http://..."
                    {...form.getInputProps('cover_image')}
                  />
                  <Switch
                    label="Featured Event"
                    {...form.getInputProps('is_featured', { type: 'checkbox' })}
                  />
                </Stack>
              </Paper>

              <Button
                type="submit"
                loading={loading}
                leftSection={<IconDeviceFloppy size={16} />}
                fullWidth
              >
                Event erstellen
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      </form>
    </Stack>
  );
}
