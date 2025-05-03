module.exports = {
  name: "Moment AI",
  slug: "moment-ai",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/custom-app-icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/custom-splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#121726",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sprynaillc.momentai",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/custom-adaptive-icon.png",
      backgroundColor: "#121726",
    },
    package: "com.sprynaillc.momentai",
    versionCode: 4
  },
  web: {
    favicon: "./assets/images/custom-favicon.png",
    bundler: "metro",
  },
  extra: {
    // Add the EAS project ID
    eas: {
      projectId: "1d987350-5345-466b-888f-cfde3b3c186b"
    },
    // Add Supabase environment variables
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // Flag to ensure fresh installation behavior
    cleanInstall: true,
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "./assets/images/custom-app-icon.png",
        color: "#3478F6"
      },
    ],
  ],
  experiments: {
    tsconfigPaths: true,
  },
  // Add optimization settings to reduce app size
  updates: {
    fallbackToCacheTimeout: 0,
  },
  // Optimize asset loading
  jsEngine: "hermes",
};
