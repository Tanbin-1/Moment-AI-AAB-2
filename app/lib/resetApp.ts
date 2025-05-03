import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Reset the app to its initial state
 * This is useful for testing or when the app is in a bad state
 */
export const resetApp = async (): Promise<void> => {
  try {
    console.log("Resetting app to initial state...");

    // Clear all AsyncStorage data
    await AsyncStorage.clear();

    // Cancel all notifications
    if (Platform.OS !== "web") {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (notifError) {
        console.error(
          "Error canceling notifications during reset:",
          notifError,
        );
      }
    }

    // Set first install flag to trigger first-time setup
    await AsyncStorage.setItem(STORAGE_KEYS.FIRST_INSTALL, "false");

    console.log("App reset complete");
  } catch (error) {
    console.error("Error resetting app:", error);
  }
};

/**
 * Force reload the app
 * This will trigger a full reload of the app
 */
export const forceReload = (): void => {
  try {
    console.log("Forcing app reload...");
    // For Expo, we can't actually reload the app programmatically
    // But we can tell the user to restart the app
    console.log("Please restart the app manually");
  } catch (error) {
    console.error("Error forcing reload:", error);
  }
};
