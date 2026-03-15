import { useState } from 'react';
import {
  Stack, Title, Paper, TextInput, PasswordInput, Button,
  Group, Avatar, Text, Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { authApi } from '@/api';
import { useAuthStore } from '@/contexts/authStore';
import { AuthUser } from '@/contexts/authStore';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving]     = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const profileForm = useForm({
    initialValues: {
      name:     user?.name     ?? '',
      email:    user?.email    ?? '',
      phone:    user?.phone    ?? '',
      locale:   user?.locale   ?? 'de',
      timezone: user?.timezone ?? 'Europe/Berlin',
    },
  });

  const pwForm = useForm({
    initialValues: { current_password: '', password: '', password_confirmation: '' },
    validate: {
      password: (v) => v.length < 8 ? 'Mindestens 8 Zeichen' : null,
      password_confirmation: (v, vals) => v !== vals.password ? 'Passwörter stimmen nicht überein' : null,
    },
  });

  const handleProfile = async (values: typeof profileForm.values) => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile(values);
      setUser(res.data.user as AuthUser);
      notifications.show({ message: 'Profil gespeichert.', color: 'green' });
    } finally { setSaving(false); }
  };

  const handlePassword = async (values: typeof pwForm.values) => {
    setPwSaving(true);
    try {
      await authApi.changePassword(values);
      notifications.show({ message: 'Passwort geändert.', color: 'green' });
      pwForm.reset();
    } catch {
      notifications.show({ message: 'Aktuelles Passwort ist falsch.', color: 'red' });
    } finally { setPwSaving(false); }
  };

  return (
    <Stack gap="lg" maw={600}>
      <Title order={2}>Mein Profil</Title>

      <Paper p="md" radius="md" withBorder>
        <Group mb="md">
          <Avatar src={user?.avatar} size="lg" radius="xl" color="violet">
            {user?.name?.[0]}
          </Avatar>
          <Stack gap={0}>
            <Text fw={600}>{user?.name}</Text>
            <Text size="sm" c="dimmed">{user?.email}</Text>
            <Text size="xs" c="dimmed" tt="capitalize">{user?.role}</Text>
          </Stack>
        </Group>
        <Divider mb="md" />
        <form onSubmit={profileForm.onSubmit(handleProfile)}>
          <Stack gap="sm">
            <TextInput label="Name" {...profileForm.getInputProps('name')} />
            <TextInput label="E-Mail" {...profileForm.getInputProps('email')} />
            <TextInput label="Telefon" {...profileForm.getInputProps('phone')} />
            <Group grow>
              <TextInput label="Sprache" {...profileForm.getInputProps('locale')} />
              <TextInput label="Zeitzone" {...profileForm.getInputProps('timezone')} />
            </Group>
            <Button type="submit" loading={saving}>Profil speichern</Button>
          </Stack>
        </form>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Title order={4} mb="md">Passwort ändern</Title>
        <form onSubmit={pwForm.onSubmit(handlePassword)}>
          <Stack gap="sm">
            <PasswordInput label="Aktuelles Passwort" required {...pwForm.getInputProps('current_password')} />
            <PasswordInput label="Neues Passwort" required {...pwForm.getInputProps('password')} />
            <PasswordInput label="Passwort bestätigen" required {...pwForm.getInputProps('password_confirmation')} />
            <Button type="submit" loading={pwSaving} variant="light">Passwort ändern</Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
