import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextInput, PasswordInput, Button, Paper, Title, Text, Stack,
  Group, Anchor, Alert, Box, Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { authApi } from '@/api';
import { useAuthStore } from '@/contexts/authStore';
import { AuthUser } from '@/contexts/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const { setAuth }           = useAuthStore();
  const navigate              = useNavigate();

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email:    (v) => (/^\S+@\S+$/.test(v) ? null : 'Ungültige E-Mail-Adresse'),
      password: (v) => (v.length < 6 ? 'Passwort zu kurz' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(values);
      setAuth(res.data.token, res.data.user as AuthUser);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.errors?.email?.[0]
        ?? e.response?.data?.message
        ?? 'Anmeldung fehlgeschlagen.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" bg="gray.0">
      <Box w={420} p="xl">
        <Title ta="center" mb={4} c="violet">🎫 event-veranstaltungen.de</Title>
        <Text ta="center" c="dimmed" mb="xl" size="sm">
          Dashboard-Anmeldung
        </Text>

        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Title order={3} mb="lg">Anmelden</Title>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" radius="md">
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="E-Mail-Adresse"
                placeholder="ihre@email.de"
                required
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Passwort"
                placeholder="Ihr Passwort"
                required
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={loading} fullWidth mt="xs">
                Anmelden
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text ta="center" mt="md" size="xs" c="dimmed">
          © {new Date().getFullYear()} event-veranstaltungen.de
        </Text>
      </Box>
    </Center>
  );
}
