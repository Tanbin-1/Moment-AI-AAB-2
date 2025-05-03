import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Storage keys
const STORAGE_KEY_URL = 'SUPABASE_URL';
const STORAGE_KEY_KEY = 'SUPABASE_ANON_KEY';

// Dynamic Supabase configuration
let supabaseUrl: string | null = null;
let supabaseAnonKey: string | null = null;
let supabaseInstance: any = null;

// Get Supabase URL from various sources
const getSupabaseUrl = (): string | null => {
  if (supabaseUrl) return supabaseUrl;
  
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const extraUrl = Constants.expoConfig?.extra?.supabaseUrl;
  
  return envUrl || extraUrl || null;
};

// Get Supabase Anon Key from various sources
const getSupabaseAnonKey = (): string | null => {
  if (supabaseAnonKey) return supabaseAnonKey;
  
  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const extraKey = Constants.expoConfig?.extra?.supabaseAnonKey;
  
  return envKey || extraKey || null;
};

// Initialize Supabase client
const initSupabase = (url: string, key: string) => {
  console.log(`Initializing Supabase with URL: ${url.substring(0, 15)}...`);
  supabaseUrl = url;
  supabaseAnonKey = key;
  supabaseInstance = createClient<Database>(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return supabaseInstance;
};

// Check for stored credentials
export const loadStoredCredentials = async () => {
  try {
    const url = await AsyncStorage.getItem(STORAGE_KEY_URL);
    const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);
    
    if (url && key) {
      return initSupabase(url, key);
    }
    
    return null;
  } catch (error) {
    console.error("Error loading stored Supabase credentials:", error);
    return null;
  }
};

// Save credentials for future use
export const saveCredentials = async (url: string, key: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_URL, url);
    await AsyncStorage.setItem(STORAGE_KEY_KEY, key);
    return initSupabase(url, key);
  } catch (error) {
    console.error("Error saving Supabase credentials:", error);
    return null;
  }
};

// Get current Supabase instance or create new one if possible
export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  
  if (url && key) {
    return initSupabase(url, key);
  }
  
  // Add detailed error for debugging
  const platformInfo = Platform.OS;
  const envVars = {
    hasUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    hasExtraUrl: !!Constants.expoConfig?.extra?.supabaseUrl,
    hasExtraKey: !!Constants.expoConfig?.extra?.supabaseAnonKey,
  };
  
  console.error(`Supabase configuration missing. Platform: ${platformInfo}, ENV vars: ${JSON.stringify(envVars)}`);
  throw new Error(`Supabase configuration not found. Please check your environment variables or configure Supabase in the app.`);
};
