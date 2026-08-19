import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  webOrigin?: string;
};

function readExtra(): Extra {
  return (Constants.expoConfig?.extra as Extra | undefined) ?? {};
}

/** Raw API URL from env or app config `extra` (same semantics as web `NEXT_PUBLIC_API_URL`). */
export function getApiUrlRaw(): string {
  const fromEnv =
    typeof process.env.EXPO_PUBLIC_API_URL === 'string' ? process.env.EXPO_PUBLIC_API_URL : '';
  const fromExtra = readExtra().apiUrl ?? '';
  return (fromEnv || fromExtra).trim();
}

/** Site origin for opening donate/support flows in the browser (e.g. `https://fundogs.example`). */
export function getWebOriginRaw(): string {
  const fromEnv =
    typeof process.env.EXPO_PUBLIC_WEB_ORIGIN === 'string' ? process.env.EXPO_PUBLIC_WEB_ORIGIN : '';
  const fromExtra = readExtra().webOrigin ?? '';
  return (fromEnv || fromExtra).trim().replace(/\/+$/, '');
}
