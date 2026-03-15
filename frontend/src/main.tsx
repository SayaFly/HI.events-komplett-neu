import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import App from './App';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import 'dayjs/locale/de';

const theme = createTheme({
  primaryColor: 'violet',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  defaultRadius: 'md',
  colors: {
    violet: [
      '#f5f0ff', '#ede5ff', '#dbc8ff', '#c8aaff',
      '#b48afe', '#a06cf9', '#9255f5', '#7c3aed',
      '#6d28d9', '#5b21b6',
    ],
  },
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
    Card: {
      defaultProps: { radius: 'md', withBorder: true },
    },
    TextInput: {
      defaultProps: { radius: 'md' },
    },
    Select: {
      defaultProps: { radius: 'md' },
    },
    Paper: {
      defaultProps: { radius: 'md' },
    },
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

const theme = createTheme({
  primaryColor: 'violet',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif' },
  colors: {
    violet: [
      '#f3f0ff', '#e5dbff', '#d0bfff', '#b197fc',
      '#9775fa', '#845ef7', '#7950f2', '#7048e8',
      '#6741d9', '#5f3dc4',
    ],
  },
  components: {
    Button: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { radius: 'md', shadow: 'sm', withBorder: true } },
    TextInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    Textarea: { defaultProps: { radius: 'md' } },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: 'de', firstDayOfWeek: 1 }}>
    <BrowserRouter>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <ModalsProvider>
          <Notifications position="top-right" />
          <App />
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
);
