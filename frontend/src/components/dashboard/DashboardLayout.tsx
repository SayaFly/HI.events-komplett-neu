import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  AppShell, Burger, Group, NavLink, Avatar, Text, Menu, ActionIcon,
  Divider, ScrollArea, Box, Badge, rem, useMantineColorScheme,
  useMantineTheme, UnstyledButton, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard, IconCalendarEvent, IconTicket, IconShoppingCart,
  IconUsers, IconBuilding, IconUsersGroup, IconSettings, IconLogout,
  IconUser, IconQrcode, IconMail, IconChevronRight, IconMoon, IconSun,
  IconCategory, IconBell,
} from '@tabler/icons-react';
import { useAuthStore } from '@/contexts/authStore';
import { authApi } from '@/api';
import { notifications } from '@mantine/notifications';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    icon: <IconDashboard size={18} />,      path: '/' },
  { label: 'Events',       icon: <IconCalendarEvent size={18} />,  path: '/events' },
  { label: 'Tickets',      icon: <IconTicket size={18} />,         path: '/events' },
  { label: 'Bestellungen', icon: <IconShoppingCart size={18} />,   path: '/orders' },
  { label: 'Teilnehmer',   icon: <IconUsers size={18} />,          path: '/events' },
  { label: 'Veranstalter', icon: <IconUsersGroup size={18} />,     path: '/organizers' },
  { label: 'Veranstaltungsorte', icon: <IconBuilding size={18} />, path: '/venues' },
  { label: 'Check-In',     icon: <IconQrcode size={18} />,         path: '/events' },
  { label: 'Nachrichten',  icon: <IconMail size={18} />,           path: '/events' },
  { label: 'Benutzer',     icon: <IconUser size={18} />,           path: '/users', adminOnly: true },
  { label: 'Kategorien',   icon: <IconCategory size={18} />,       path: '/settings', adminOnly: true },
  { label: 'Einstellungen',icon: <IconSettings size={18} />,       path: '/settings', adminOnly: true },
];

export default function DashboardLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
    notifications.show({ title: 'Abgemeldet', message: 'Sie wurden erfolgreich abgemeldet.', color: 'green' });
  };

  const filteredNav = navItems.filter((item) => !item.adminOnly || user?.role === 'admin');

  const mainNav = [
    { label: 'Dashboard',    icon: <IconDashboard size={18} />,      path: '/' },
    { label: 'Events',       icon: <IconCalendarEvent size={18} />,  path: '/events' },
    { label: 'Bestellungen', icon: <IconShoppingCart size={18} />,   path: '/orders' },
    { label: 'Veranstalter', icon: <IconUsersGroup size={18} />,     path: '/organizers' },
    { label: 'Veranstaltungsorte', icon: <IconBuilding size={18} />, path: '/venues' },
  ];
  const adminNav = [
    { label: 'Benutzer',      icon: <IconUser size={18} />,      path: '/users' },
    { label: 'Einstellungen', icon: <IconSettings size={18} />,  path: '/settings' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text
              fw={700}
              size="lg"
              c="violet"
              component={Link}
              to="/"
              style={{ textDecoration: 'none' }}
            >
              🎫 dev.veranstaltungen.de
            </Text>
          </Group>

          <Group gap="xs">
            <Tooltip label={colorScheme === 'dark' ? 'Hell' : 'Dunkel'}>
              <ActionIcon
                variant="subtle"
                onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
              >
                {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar
                      src={user?.avatar}
                      radius="xl"
                      size="sm"
                      color="violet"
                    >
                      {user?.name?.[0]}
                    </Avatar>
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={500} lineClamp={1}>{user?.name}</Text>
                      <Text size="xs" c="dimmed">{user?.role}</Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.email}</Menu.Label>
                <Menu.Item leftSection={<IconUser size={14} />} component={Link} to="/profile">
                  Profil
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={handleLogout}
                >
                  Abmelden
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Sidebar ───────────────────────────────────────── */}
      <AppShell.Navbar p="xs">
        <ScrollArea>
          {mainNav.map((item) => (
            <NavLink
              key={item.path}
              label={item.label}
              leftSection={item.icon}
              active={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
              component={Link}
              to={item.path}
              mb={2}
              styles={{ root: { borderRadius: 8 } }}
            />
          ))}

          {user?.role === 'admin' && (
            <>
              <Divider my="sm" label="Administration" labelPosition="center" />
              {adminNav.map((item) => (
                <NavLink
                  key={item.path}
                  label={item.label}
                  leftSection={item.icon}
                  active={location.pathname.startsWith(item.path)}
                  component={Link}
                  to={item.path}
                  mb={2}
                  styles={{ root: { borderRadius: 8 } }}
                />
              ))}
            </>
          )}
        </ScrollArea>
      </AppShell.Navbar>

      {/* ── Main Content ──────────────────────────────────── */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
