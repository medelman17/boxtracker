import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "BoxTrack",
  slug: "boxtracker",
  owner: "edelman732",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  scheme: "boxtrack",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.boxtrack.app",
  },
  android: {
    package: "com.boxtrack.app",
  },
  web: {
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow BoxTrack to access your photos to add box content images.",
        cameraPermission: "Allow BoxTrack to use your camera to photograph box contents.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "1565d39f-5959-47a1-9745-69ab08de069a",
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
