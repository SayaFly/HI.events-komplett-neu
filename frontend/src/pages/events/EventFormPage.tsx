import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Stack, Title, Button, Group, TextInput, Textarea, Select,
  NumberInput, Card, Grid, Switch, Loader, Center,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { eventsApi, categoriesApi } from '../../services/api';
import dayjs from 'dayjs';

interface Category { id: number; name: string; }

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm({
    initialValues: {
      title: '', description: '', short_description: '',
      category_id: '', start_date: null as Date | null,
      end_date: null as Date | null, location: '', address: '',
      city: '', zip_code: '', country: 'Deutschland',
      max_attendees: 0, status: 'draft', is_featured: false,
    },
    validate: {
      title: (v) => v ? null : 'Titel ist erforderlich',
      description: (v) => v ? null : 'Beschreibung ist erforderlich',
      category_id: (v) => v ? null : 'Kategorie ist erforderlich',
      location: (v) => v ? null : 'Veranstaltungsort ist erforderlich',
      city: (v) => v ? null : 'Stadt ist erforderlich',
      start_date: (v) => v ? null : 'Startdatum ist erforderlich',
      end_date: (v) => v ? null : 'Enddatum ist erforderlich',
    },
  });

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data));
    if (isEdit) {
      setLoading(true);
      eventsApi.get(Number(id)).then((r) => {
        const ev = r.data;
        form.setValues({
          ...ev,
          category_id: String(ev.category_id),
          start_date: new Date(ev.start_date),
          end_date: new Date(ev.end_date),
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (values: typeof form.values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        category_id: Number(values.category_id),
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD HH:mm:ss') : null,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD HH:mm:ss') : null,
      };
      if (isEdit) {
        await eventsApi.update(Number(id), payload);
        notifications.show({ message: 'Veranstaltung aktualisiert', color: 'teal' });
      } else {
        await eventsApi.create(payload);
        notifications.show({ message: 'Veranstaltung erstellt', color: 'teal' });
      }
      navigate('/events');
    } catch (_err: unknown) {
      notifications.show({ title: 'Fehler', message: 'Speichern fehlgeschlagen', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Center h={300}><Loader /></Center>;

  return (
    <Stack gap="md">
      <Group>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/events')}>
          Zurück
        </Button>
        <Title order={2}>{isEdit ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung'}</Title>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card mb="md">
              <Stack>
                <TextInput label="Titel" required {...form.getInputProps('title')} />
                <Textarea label="Kurzbeschreibung" rows={2} {...form.getInputProps('short_description')} />
                <Textarea label="Beschreibung" required rows={5} {...form.getInputProps('description')} />
              </Stack>
            </Card>
            <Card>
              <Title order={5} mb="md">Datum & Ort</Title>
              <Grid>
                <Grid.Col span={6}>
                  <DateTimePicker label="Startdatum" required {...form.getInputProps('start_date')} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <DateTimePicker label="Enddatum" required {...form.getInputProps('end_date')} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput label="Veranstaltungsort" required {...form.getInputProps('location')} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput label="Adresse" {...form.getInputProps('address')} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput label="PLZ" {...form.getInputProps('zip_code')} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput label="Stadt" required {...form.getInputProps('city')} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput label="Land" {...form.getInputProps('country')} />
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card mb="md">
              <Title order={5} mb="md">Einstellungen</Title>
              <Stack>
                <Select
                  label="Kategorie"
                  required
                  data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                  {...form.getInputProps('category_id')}
                />
                <Select
                  label="Status"
                  data={[
                    { value: 'draft', label: 'Entwurf' },
                    { value: 'published', label: 'Veröffentlicht' },
                    { value: 'cancelled', label: 'Abgesagt' },
                  ]}
                  {...form.getInputProps('status')}
                />
                <NumberInput
                  label="Max. Teilnehmer"
                  min={0}
                  description="0 = unbegrenzt"
                  {...form.getInputProps('max_attendees')}
                />
                <Switch
                  label="Hervorgehoben"
                  {...form.getInputProps('is_featured', { type: 'checkbox' })}
                />
              </Stack>
            </Card>

            <Button
              type="submit"
              fullWidth
              loading={saving}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Speichern
            </Button>
          </Grid.Col>
        </Grid>
      </form>
    </Stack>
  );
}
