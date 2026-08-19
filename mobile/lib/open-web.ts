import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

import { getWebOriginRaw } from './env';

/** Open a path on the FunDogs website (requires EXPO_PUBLIC_WEB_ORIGIN). */
export async function openWebPath(path: string): Promise<void> {
  const origin = getWebOriginRaw();
  if (!origin) {
    Alert.alert(
      'Website URL not set',
      'Add EXPO_PUBLIC_WEB_ORIGIN in your environment (for example https://your-site.com) to open this page.',
    );
    return;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  await WebBrowser.openBrowserAsync(`${origin}${normalized}`);
}
