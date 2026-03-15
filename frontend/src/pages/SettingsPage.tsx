import { useEffect, useState } from 'react';
import {
  Stack, Title, Tabs, TextInput, Button, Paper, Group, Text,
  Skeleton, Alert, Divider, Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconMail, IconAlertCircle } from '@tabler/icons-react';
import { settingsApi } from '@/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const form = useForm({
    initialValues: {
      site_name:         '',
      site_url:          '',
      site_description:  '',
      default_currency:  'EUR',
      default_timezone:  'Europe/Berlin',
      support_email:     '',
      mail_from_address: '',
      mail_from_name:    '',
    },
  });

  useEffect(() => {
    settingsApi.all().then((res) => {
      const flat: Record<string, string> = {};
      Object.values(res.data).forEach((group: unknown) => {
        Object.assign(flat, group);
      });
      form.setValues({
        site_name:        flat.site_name         ?? '',
        site_url:         flat.site_url          ?? '',
        site_description: flat.site_description  ?? '',
        default_currency: flat.default_currency  ?? 'EUR',
        default_timezone: flat.default_timezone  ?? 'Europe/Berlin',
        support_email:    flat.support_email     ?? '',
        mail_from_address:flat.mail_from_address ?? '',
        mail_from_name:   flat.mail_from_name    ?? '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(form.values as Record<string, string>);
      notifications.show({ message: 'Einstellungen gespeichert.', color: 'green' });
    } catch {
      notifications.show({ message: 'Fehler beim Speichern.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton height={400} radius="md" />;

  return (
    <Stack gap="lg">
      <Title order={2}>Einstellungen</Title>

      <Tabs defaultValue="general">
        <Tabs.List mb="md">
          <Tabs.Tab value="general" leftSection={<IconSettings size={16} />}>Allgemein</Tabs.Tab>
          <Tabs.Tab value="mail" leftSection={<IconMail size={16} />}>E-Mail</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
              <TextInput label="Website-Name" {...form.getInputProps('site_name')} />
              <TextInput label="Website-URL" {...form.getInputProps('site_url')} />
              <TextInput label="Beschreibung" {...form.getInputProps('site_description')} />
              <Divider label="Regionale Einstellungen" />
              <Group grow>
                <TextInput label="Standardwährung (ISO 3)" maxLength={3} {...form.getInputProps('default_currency')} />
                <TextInput label="Standard-Zeitzone" {...form.getInputProps('default_timezone')} />
              </Group>
              <TextInput label="Support-E-Mail" {...form.getInputProps('support_email')} />
              <Button onClick={handleSave} loading={saving}>Einstellungen speichern</Button>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="mail">
          <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
              <TextInput label="Absender-E-Mail" {...form.getInputProps('mail_from_address')} />
              <TextInput label="Absender-Name" {...form.getInputProps('mail_from_name')} />
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                SMTP-Zugangsdaten werden in der <code>.env</code>-Datei auf dem Server konfiguriert.
              </Alert>
              <Button onClick={handleSave} loading={saving}>Einstellungen speichern</Button>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
