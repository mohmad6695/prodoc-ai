'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

/**
 * A wrapper component that provides theme context (light/dark mode) to the application.
 * This must be a client component to manage theme state.
 * * @param {object} props - Props passed to the next-themes ThemeProvider.
 */
export function ThemeProvider({ children, ...props }) {
  // We use a React.Fragment here to wrap the children and pass props to the external provider.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}