import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider } from '@/providers/auth-provider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const FundogsNavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0f766e',
    background: '#fffaf3',
    card: '#ffffff',
    text: '#422006',
    border: 'rgba(120, 53, 15, 0.12)',
    notification: '#0f766e',
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={FundogsNavigationTheme}>
          <Stack
            screenOptions={{
              headerTintColor: '#0f766e',
              headerStyle: { backgroundColor: '#fffaf3' },
              contentStyle: { backgroundColor: '#fffaf3' },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="campaign/[slug]" options={{ title: 'Campaign' }} />
            <Stack.Screen name="organizations/[slug]" options={{ title: 'Organization' }} />
            <Stack.Screen name="auth/login" options={{ title: 'Log in', presentation: 'modal' }} />
            <Stack.Screen name="auth/register" options={{ title: 'Register', presentation: 'modal' }} />
            <Stack.Screen name="my-campaigns" options={{ title: 'My campaigns' }} />
            <Stack.Screen name="profile" options={{ title: 'Profile' }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
