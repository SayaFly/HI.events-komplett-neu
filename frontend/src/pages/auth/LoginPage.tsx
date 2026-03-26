import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Title, Text, TextInput, PasswordInput,
  Button, Stack, Center, Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBuildingStore } from '@tabler/icons-react';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Ungültige E-Mail-Adresse'),
      password: (v) => (v.length >= 6 ? null : 'Passwort zu kurz'),
    },
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.email, values.password);
      setAuth(res.data.token, res.data.user);
      notifications.show({ title: 'Willkommen!', message: `Hallo, ${res.data.user.name}`, color: 'teal' });
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Anmeldung fehlgeschlagen';
      notifications.show({ title: 'Fehler', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Center mb="xl">
        <Stack align="center" gap="xs">
          <Box p="md" style={{ background: 'var(--mantine-color-violet-1)', borderRadius: '50%' }}>
            <IconBuildingStore size={32} color="var(--mantine-color-violet-6)" />
          </Box>
          <Title order={2} ta="center">dev.veranstaltungen.de</Title>
          <Text c="dimmed" size="sm">Backend Dashboard – Anmeldung</Text>
        </Stack>
      </Center>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="E-Mail"
              placeholder="admin@dev.veranstaltungen.de"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Passwort"
              placeholder="Ihr Passwort"
              required
              {...form.getInputProps('password')}
            />
            <Button type="submit" fullWidth loading={loading} color="violet">
              Anmelden
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
