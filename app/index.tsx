import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Plus, Moon, Sun } from "lucide-react-native";
import TaskList from "./components/TaskList";
import ListSelector from "./components/ListSelector";
import TaskModal from "./components/TaskModal";
import { useAppContext } from "./context/AppContext";
import SupabaseConfig from "./components/SupabaseConfig";
import ErrorFallback from "./components/ErrorFallback";
import { loadStoredCredentials, saveCredentials } from "./lib/supabase";

import { resetApp } from "./lib/resetApp";

export default function HomeScreen() {
  console.log("Rendering HomeScreen component");

  // State for loading Supabase
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Add a way to reset the app if it gets stuck, but don't auto-reset on startup
  React.useEffect(() => {
    const handleAppReset = async () => {
      // This is just for development - in production you'd want a different trigger
      if (__DEV__) {
        console.log("Development mode detected, enabling app reset feature");
        // Don't automatically reset on startup - this causes multiple default lists
        // Only reset when explicitly triggered
      }
    };

    handleAppReset();
  }, []);

  // Reset error handler
  const resetError = () => {
    setError(null);
    checkSupabaseConfig();
  };

  // Check for Supabase configuration
  const checkSupabaseConfig = async () => {
    try {
      setIsLoadingSupabase(true);
      setError(null);
      console.log("Checking Supabase configuration...");
      
      const supabase = await loadStoredCredentials();
      if (supabase) {
        console.log("Supabase credentials loaded successfully");
        setIsSupabaseConfigured(true);
      } else {
        console.log("No Supabase credentials found");
      }
    } catch (err) {
      console.error("Error checking Supabase credentials:", err);
      setError(err instanceof Error ? err : new Error("Failed to load Supabase configuration"));
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  // Run config check on mount
  useEffect(() => {
    checkSupabaseConfig();
  }, []);

  // Handle Supabase config save
  const handleSupabaseConfigSaved = (url: string, key: string) => {
    try {
      console.log("Saving Supabase credentials...");
      saveCredentials(url, key).then((client) => {
        if (client) {
          console.log("Supabase client created successfully");
          setIsSupabaseConfigured(true);
          setError(null);
        } else {
          throw new Error("Failed to initialize Supabase client");
        }
      }).catch((err) => {
        console.error("Error saving credentials:", err);
        setError(err instanceof Error ? err : new Error("Failed to save Supabase configuration"));
      });
    } catch (err) {
      console.error("Exception in handleSupabaseConfigSaved:", err);
      setError(err instanceof Error ? err : new Error("Failed to process Supabase configuration"));
    }
  };

  const {
    setModalVisible,
    setEditingTask,
    selectedListId,
    isDarkMode,
    toggleDarkMode,
  } = useAppContext();
  const colorScheme = useColorScheme();

  const handleAddTask = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  // Show error screen if there's an error
  if (error) {
    return <ErrorFallback error={error} resetError={resetError} isDarkMode={isDarkMode} />;
  }

  // Show loading indicator while checking Supabase config
  if (isLoadingSupabase) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#121726' : '#f9fafb' }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#3B82F6' : '#3478F6'} />
        <Text style={{ marginTop: 16, color: isDarkMode ? '#e2e8f0' : '#475569' }}>
          Loading Supabase configuration...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? "bg-[#121726]" : "bg-gray-50"}`}
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#121726" : "#f9fafb"}
        translucent={true}
      />

      {/* Supabase Configuration Modal */}
      <SupabaseConfig onConfigSaved={handleSupabaseConfigSaved} />

      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-2 bg-white/5">
          <View className="flex-row justify-between items-center">
            <Text
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Moment AI
            </Text>
            <TouchableOpacity
              onPress={toggleDarkMode}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
            >
              {isDarkMode ? (
                <Sun size={20} color="#FFF" />
              ) : (
                <Moon size={20} color="#333" />
              )}
            </TouchableOpacity>
          </View>
          <Text
            className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Stay organized effortlessly
          </Text>
        </View>

        {/* List Selector */}
        <View className="px-6 py-4 bg-white/5">
          <ListSelector selectedListId={selectedListId} />
        </View>

        {/* Task List */}
        <View className="flex-1">
          <TaskList />
        </View>

        {/* Add Task Button */}
        <View className="absolute bottom-8 right-8">
          <TouchableOpacity
            className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center shadow-lg elevation-5"
            onPress={handleAddTask}
            style={{
              shadowColor: "#3478F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <Plus size={30} color="white" />
          </TouchableOpacity>
        </View>

        {/* Task Modal */}
        <TaskModal />
      </View>
    </SafeAreaView>
  );
}
