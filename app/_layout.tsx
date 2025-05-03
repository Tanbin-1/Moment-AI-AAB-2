import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, LogBox, Platform } from "react-native";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useAppContext } from "../app/context/AppContext";
import ErrorBoundary from "../app/components/ErrorBoundary";
import * as Notifications from "expo-notifications";
import { Slot } from "expo-router";

// Ignore specific warnings to improve performance
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "VirtualizedLists should never be nested",
  "Sending `onAnimatedValueUpdate` with no listeners registered",
]);

// Configure notifications for the app - make it non-blocking
if (Platform.OS !== "web") {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Set up notification channel for Android in a non-blocking way
  if (Platform.OS === "android") {
    setTimeout(() => {
      try {
        Notifications.setNotificationChannelAsync("default", {
          name: "Moment AI",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3478F6",
          sound: true,
          enableVibrate: true,
          showBadge: true,
        }).catch((err) =>
          console.log("Error setting up default channel:", err),
        );

        // Create a second channel for reminders with a different sound
        Notifications.setNotificationChannelAsync("reminders", {
          name: "Moment AI Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3478F6",
          sound: true,
          enableVibrate: true,
          showBadge: true,
        }).catch((err) =>
          console.log("Error setting up reminders channel:", err),
        );
      } catch (error) {
        console.log(
          "Non-critical error setting up notification channels:",
          error,
        );
      }
    }, 1000); // Delay to not block startup
  }
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Add error handling for debugging Expo Go issues
  if (Platform.OS !== "web") {
    console.log("Starting app initialization on mobile device");
    // Add global error handler for uncaught JS errors
    const errorHandler = global.ErrorUtils || require('react-native').ErrorUtils;
    if (errorHandler) {
      const originalErrorHandler = errorHandler.getGlobalHandler();
      errorHandler.setGlobalHandler((error, isFatal) => {
        console.log(`Global error caught: ${error.message}`);
        console.log(`Stack trace: ${error.stack}`);
        console.log(`Is fatal: ${isFatal}`);
        originalErrorHandler(error, isFatal);
      });
    }
  }
  
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEMPO && Platform.OS === "web") {
      const { TempoDevtools } = require("tempo-devtools");
      TempoDevtools.init();
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      // Add a small delay before hiding splash screen to ensure app is ready
      setTimeout(() => {
        SplashScreen.hideAsync().catch((err) => {
          console.log("Error hiding splash screen:", err);
        });
      }, 500);
    }
  }, [loaded]);

  // Add a safety timeout to hide splash screen even if loading gets stuck
  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      if (Platform.OS !== "web") {
        console.log("Splash screen safety timeout reached, forcing hide");
        SplashScreen.hideAsync().catch((err) => {
          console.log("Error hiding splash screen in safety timeout:", err);
        });
      }
    }, 2000); // Reduced to 2 seconds to ensure app doesn't appear stuck

    return () => clearTimeout(splashTimeout);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <AppContentWithErrorBoundary />
        </AppProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap the app content in an error boundary that has access to the AppContext
function AppContentWithErrorBoundary() {
  const { isDarkMode } = useAppContext();

  return (
    <ErrorBoundary isDarkMode={isDarkMode}>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={({ route }) => ({
            headerShown: !route.name.startsWith("tempobook"),
          })}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
