import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  Avatar,
  Menu,
  Box,
  ActionIcon,
  useMantineColorScheme,
  Divider,
  Stack,
  Badge,
} from '@mantine/core';
import {
  IconDashboard,
  IconCalendarEvent,
  IconCategory,
  IconTicket,
  IconShoppingCart,
  IconUsers,
  IconLogout,
  IconMoon,
  IconSun,
  IconChevronRight,
  IconBuildingStore,
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { notifications } from '@mantine/notifications';

const navItems = [
  { label: 'Dashboard', icon: <IconDashboard size={18} />, path: '/' },
  { label: 'Veranstaltungen', icon: <IconCalendarEvent size={18} />, path: '/events' },
  { label: 'Kategorien', icon: <IconCategory size={18} />, path: '/categories' },
  { label: 'Tickets', icon: <IconTicket size={18} />, path: '/tickets' },
  { label: 'Bestellungen', icon: <IconShoppingCart size={18} />, path: '/orders' },
  { label: 'Benutzer', icon: <IconUsers size={18} />, path: '/users' },
];

export default function AppLayout() {
  const [opened, setOpened] = useState(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    logout();
    navigate('/login');
    notifications.show({ title: 'Abgemeldet', message: 'Erfolgreich abgemeldet', color: 'teal' });
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={() => setOpened(!opened)} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <IconBuildingStore size={24} color="var(--mantine-color-violet-6)" />
              <Text fw={700} size="lg" c="violet">
                event-veranstaltungen.de
              </Text>
            </Group>
          </Group>
          <Group>
            <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} size="lg" radius="md">
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <Menu position="bottom-end" shadow="md" radius="md">
              <Menu.Target>
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <Avatar color="violet" radius="xl" size="sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box visibleFrom="sm">
                    <Text size="sm" fw={500}>{user?.name}</Text>
                    <Badge size="xs" color="violet" variant="light">{user?.role}</Badge>
                  </Box>
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconLogout size={16} />} onClick={handleLogout} color="red">
                  Abmelden
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={item.icon}
                rightSection={isActive ? <IconChevronRight size={14} /> : null}
                active={isActive}
                variant={isActive ? 'filled' : 'subtle'}
                color="violet"
                onClick={() => { navigate(item.path); setOpened(false); }}
              />
            );
          })}
        </Stack>
        <Divider my="md" />
        <Text size="xs" c="dimmed" ta="center">event-veranstaltungen.de v1.0</Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
