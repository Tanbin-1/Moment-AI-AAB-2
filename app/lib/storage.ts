import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Storage keys
export const STORAGE_KEYS = {
  FIRST_INSTALL: "moment_ai_first_install",
  USER_PREFERENCES: "moment_ai_user_preferences",
};

// Check if this is the first time the app is installed
export const checkFirstInstall = async (): Promise<boolean> => {
  try {
    console.log("Checking if this is first install...");

    // Check for clean install flag in app config
    const cleanInstall = Constants.expoConfig?.extra?.cleanInstall === true;
    if (cleanInstall) {
      console.log("Clean install flag detected, treating as first install");
      // Still set the flag for future use
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_INSTALL, "false");
      } catch (setError) {
        console.error("Error setting first install flag:", setError);
      }
      return true;
    }

    // Regular install check logic
    // Add timeout to prevent AsyncStorage from hanging
    const getItemPromise = AsyncStorage.getItem(STORAGE_KEYS.FIRST_INSTALL);
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log("AsyncStorage timeout reached, assuming NOT first install");
        resolve("false"); // Assume not first install on timeout to prevent creating multiple lists
      }, 2000);
    });

    const value = await Promise.race([getItemPromise, timeoutPromise]);
    console.log("First install check value:", value);

    if (value === null) {
      // This is the first install, set the flag
      console.log("This is a first install, setting flag");
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_INSTALL, "false");
      } catch (setError) {
        console.error("Error setting first install flag:", setError);
        // Continue even if setting fails
      }
      return true;
    }
    console.log("This is not a first install");
    return false;
  } catch (error) {
    console.error("Error checking first install:", error);
    // If there's an error, assume it's NOT a first install to prevent creating multiple lists
    return false;
  }
};

// Clear all app data (for testing purposes)
export const clearAllAppData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log("All app data cleared successfully");
  } catch (error) {
    console.error("Error clearing app data:", error);
  }
};

// Save user preferences
export const saveUserPreferences = async (preferences: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences),
    );
  } catch (error) {
    console.error("Error saving user preferences:", error);
  }
};

// Get user preferences
export const getUserPreferences = async (): Promise<any> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (value !== null) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error("Error getting user preferences:", error);
    return null;
  }
};
