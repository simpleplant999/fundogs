import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrlEnv = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
  const devHttpApi =
    /^https?:\/\//i.test(apiUrlEnv) && apiUrlEnv.toLowerCase().startsWith('http:');

  const existingInfoPlist = (config.ios?.infoPlist ?? {}) as Record<string, unknown>;
  const existingAts =
    (existingInfoPlist.NSAppTransportSecurity as Record<string, unknown> | undefined) ?? {};

  return {
    ...config,
    name: 'FunDogs',
    slug: 'fundogs-mobile',
    scheme: 'fundogs',
    splash: {
      ...config.splash,
      backgroundColor: '#fffaf3',
    },
    ios: {
      ...config.ios,
      ...(devHttpApi
        ? {
            infoPlist: {
              ...existingInfoPlist,
              NSAppTransportSecurity: {
                ...existingAts,
                /** Load http:// LAN API and /uploads from a dev machine (physical device / simulator). */
                NSAllowsLocalNetworking: true,
              },
            },
          }
        : {}),
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        backgroundColor: '#fffaf3',
      },
      /** Required for http:// API + image URLs on many Android devices (not needed over HTTPS). */
      ...(devHttpApi ? { usesCleartextTraffic: true } : {}),
    },
    extra: {
      ...(typeof config.extra === 'object' && config.extra !== null ? config.extra : {}),
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
      webOrigin: process.env.EXPO_PUBLIC_WEB_ORIGIN ?? '',
    },
  };
};