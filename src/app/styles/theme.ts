'use client';

import { createTheme } from '@mui/material/styles';
import { Fascinate } from 'next/font/google';

export const fascinate = Fascinate({
  weight: '400',
  subsets: ['latin'],
});

export const theme = createTheme({
  palette: {
    primary: {
      main: '#ff5757',
      contrastText: '#fff',
    },
    secondary: {
      main: '#000000',
    },
  },
  typography: {
    fontFamily: 'inherit',
    h1: {
      fontFamily: fascinate.style.fontFamily,
    },
    h2: {
      fontFamily: fascinate.style.fontFamily,
    },
    h4: {
      fontFamily: fascinate.style.fontFamily,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});
